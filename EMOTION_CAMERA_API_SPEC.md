# Emotion Camera API Specification

## Backend Implementation Guide

**Document Version:** 1.0  
**Date:** May 11, 2026  
**Purpose:** Guide for backend engineers implementing the server-side counterpart to the emotion camera feature

---

## Table of Contents

1. [Overview](#overview)
2. [Current Frontend Implementation](#current-frontend-implementation)
3. [Data Models & Types](#data-models--types)
4. [Frontend Architecture](#frontend-architecture)
5. [Proposed Backend API Endpoints](#proposed-backend-api-endpoints)
6. [Implementation Guidelines](#implementation-guidelines)
7. [Integration Points](#integration-points)

---

## Overview

### Feature Purpose

The emotion camera feature enables real-time facial emotion detection during study sessions (Pomodoro timer). It analyzes the user's facial expressions to determine their study state and track emotional patterns over time.

### Current State

- **Frontend Implementation:** Client-side emotion detection using `face-api.js` (TensorFlow.js-based)
- **Processing Location:** Browser (no video transmission)
- **Data Flow:** Camera → Face Detection → Emotion Mapping → Context → UI Display
- **Goal:** Separate this into a client-server architecture where emotion data can be persisted, analyzed, and retrieved from the backend

---

## Current Frontend Implementation

### Architecture Overview

```
CameraProvider (HTML Media Stream)
        ↓
CVProvider (Context Manager)
        ↓
useFaceApiCV Hook (Emotion Detection)
        ↓
CVResponse Data
        ↓
Consumer Components (CVMonitor, PomodoroContent)
```

### Key Components

#### 1. **Camera Context** (`src/features/camera/context/CameraContext.tsx`)

- Manages browser camera permissions and media stream
- Handles device enumeration and selection
- Provides: `videoRef`, `stream`, `isCameraActive`, `permissionState`
- No backend interaction currently

#### 2. **CV Context** (`src/features/camera/context/CVContext.tsx`)

- Manages emotion detection and history tracking
- Maintains a history buffer of last 100 emotion snapshots
- Provides: `latestData`, `isConnected`, `history`, `error`, `isCapturing`
- **Current Limitation:** History is client-side only, lost on page refresh

#### 3. **useFaceApiCV Hook** (`src/features/camera/hooks/useFaceApiCV.ts`)

- Loads TensorFlow.js face-api.js models from `/public/models`
- Runs detection loop at ~30 FPS using requestAnimationFrame
- Maps 7 basic emotions to 5 study-specific states
- Returns: `connectionStatus`, `latestCVData`, `error`, `isModelLoaded`

---

## Data Models & Types

### Core Types

#### **CVResponse**

The fundamental data unit emitted by the face detection system.

```typescript
interface CVResponse {
  /** Detected emotion state (mapped from raw emotions) */
  emotion: 'focused' | 'distracted' | 'tired' | 'confused' | 'neutral' | string;

  /** Gaze direction relative to screen */
  gaze: 'center' | 'left' | 'right' | 'up' | 'down' | 'away' | string;

  /** Whether confusion is detected (based on negative emotions) */
  confusion: boolean;

  /** UNIX timestamp of the analysis (milliseconds) */
  timestamp: number;

  /** Confidence score (0-1), based on dominant emotion strength */
  confidence?: number;
}
```

#### **EmotionSnapshot**

A persisted version of CVResponse for history tracking.

```typescript
interface EmotionSnapshot {
  emotion: CVResponse['emotion'];
  gaze: CVResponse['gaze'];
  confusion: boolean;
  timestamp: number;
  confidence?: number;
}
```

#### **ConnectionStatus**

Represents the state of the face detection system.

```typescript
type ConnectionStatus =
  | 'disconnected' // Models not loaded
  | 'connecting' // Loading models
  | 'connected' // Models loaded, ready for detection
  | 'reconnecting' // Attempting to recover from error
  | 'error'; // Error state
```

### Emotion Mapping Logic

The frontend maps 7 basic emotions from face-api.js to 5 study-specific states:

```typescript
/**
 * Mapping Strategy:
 * - focused: high happiness (>0.4) OR high neutral (>0.6)
 *   → User is engaged and paying attention
 *
 * - neutral: medium neutral (0.4-0.6) with low other emotions
 *   → User is in a balanced state
 *
 * - distracted: high surprise (>0.3) OR competing emotions
 *   → User's attention is divided or reaction to stimulus
 *
 * - tired: high sadness (>0.3)
 *   → User shows signs of fatigue or low energy
 *
 * - confused: negative emotions (fearful >0.25, disgusted >0.25, angry >0.25)
 *   → User is struggling or frustrated
 *
 * Competition Detection: |dominant_score - second_score| < 0.1
 *   → Multiple emotions at similar levels = "distracted"
 */
```

---

## Frontend Architecture

### Detection Loop Configuration

```typescript
const DETECTION_CONFIG = {
  modelPath: '/models', // Path to face-api.js models
  targetFPS: 30, // Detection frequency
  minConfidence: 0.3, // Minimum emotion score threshold
  competingEmotionThreshold: 0.1, // For multi-emotion detection
} as const;
```

### History Tracking Configuration

```typescript
const HISTORY_CONFIG = {
  maxHistoryLength: 100, // Keep last 100 snapshots in memory
} as const;
```

### Face Detection Models Required

Two models are loaded from `/public/models`:

1. **tinyFaceDetector** - Lightweight face detection
2. **faceExpressionNet** - 7-emotion classifier

---

## Proposed Backend API Endpoints

### 1. **POST /api/emotion/sessions/start**

Initiate a new emotion recording session.

**Request:**

```json
{
  "sessionType": "pomodoro" | "study" | "other",
  "metadata": {
    "deckId": "optional-flashcard-deck-id",
    "activityName": "optional-activity-name"
  }
}
```

**Response:**

```json
{
  "sessionId": "uuid",
  "startedAt": "2026-05-11T10:30:00Z",
  "status": "recording"
}
```

### 2. **POST /api/emotion/sessions/{sessionId}/data**

Send emotion snapshots to the backend (batch or real-time).

**Request:**

```json
{
  "snapshots": [
    {
      "emotion": "focused",
      "gaze": "center",
      "confusion": false,
      "timestamp": 1715425800000,
      "confidence": 0.92
    },
    {
      "emotion": "distracted",
      "gaze": "left",
      "confusion": false,
      "timestamp": 1715425801000,
      "confidence": 0.78
    }
  ]
}
```

**Response:**

```json
{
  "received": 2,
  "processed": 2,
  "status": "ok"
}
```

**Notes:**

- Frontend can send data in batches (e.g., every 5 seconds) to reduce network overhead
- Each snapshot contains timestamp for local synchronization
- Server should validate timestamps fall within session window

### 3. **POST /api/emotion/sessions/{sessionId}/end**

Finalize emotion recording session.

**Request:**

```json
{
  "endedAt": "2026-05-11T10:55:00Z",
  "sessionStats": {
    "totalSnapshots": 1800,
    "dominantEmotion": "focused",
    "confusionCount": 45
  }
}
```

**Response:**

```json
{
  "sessionId": "uuid",
  "duration": "25m",
  "snapshotCount": 1800,
  "analysis": {
    "focusScore": 0.85,
    "confusionRate": 0.025,
    "emotionBreakdown": {
      "focused": 0.68,
      "neutral": 0.18,
      "distracted": 0.1,
      "tired": 0.03,
      "confused": 0.01
    }
  }
}
```

### 4. **GET /api/emotion/sessions/{sessionId}**

Retrieve complete session data with emotion history.

**Response:**

```json
{
  "sessionId": "uuid",
  "userId": "user-id",
  "sessionType": "pomodoro",
  "startedAt": "2026-05-11T10:30:00Z",
  "endedAt": "2026-05-11T10:55:00Z",
  "duration": "25m",
  "snapshotCount": 1800,
  "snapshots": [
    {
      "emotion": "focused",
      "gaze": "center",
      "confusion": false,
      "timestamp": 1715425800000,
      "confidence": 0.92
    }
  ],
  "analysis": {
    "focusScore": 0.85,
    "confusionRate": 0.025,
    "emotionBreakdown": {
      "focused": 0.68,
      "neutral": 0.18,
      "distracted": 0.1,
      "tired": 0.03,
      "confused": 0.01
    },
    "trends": [
      {
        "timeWindow": "0-5min",
        "dominantEmotion": "focused",
        "confidence": 0.87
      }
    ]
  }
}
```

### 5. **GET /api/emotion/history**

Retrieve emotion data for a time range or session list.

**Query Parameters:**

```
startDate: ISO 8601 date
endDate: ISO 8601 date
sessionType: optional filter
limit: max results (default 50)
offset: pagination offset
```

**Response:**

```json
{
  "sessions": [
    {
      "sessionId": "uuid",
      "sessionType": "pomodoro",
      "startedAt": "2026-05-11T10:30:00Z",
      "duration": "25m",
      "focusScore": 0.85,
      "emotionBreakdown": {
        "focused": 0.68,
        "neutral": 0.18,
        "distracted": 0.1,
        "tired": 0.03,
        "confused": 0.01
      }
    }
  ],
  "total": 125,
  "aggregateStats": {
    "averageFocusScore": 0.82,
    "totalSessionDuration": "500m",
    "mostCommonEmotion": "focused"
  }
}
```

### 6. **GET /api/emotion/analytics/trends**

Get aggregated emotion trends over time.

**Query Parameters:**

```
granularity: "daily" | "weekly" | "monthly"
days: number of days to look back (default 30)
```

**Response:**

```json
{
  "granularity": "daily",
  "data": [
    {
      "date": "2026-05-11",
      "focusScore": 0.85,
      "sessionCount": 3,
      "totalDuration": "75m",
      "emotionBreakdown": {
        "focused": 0.68,
        "neutral": 0.18,
        "distracted": 0.1,
        "tired": 0.03,
        "confused": 0.01
      }
    }
  ]
}
```

### 7. **DELETE /api/emotion/sessions/{sessionId}**

Delete a specific emotion session.

**Response:**

```json
{
  "sessionId": "uuid",
  "deleted": true,
  "message": "Session and associated emotion data deleted"
}
```

---

## Implementation Guidelines

### Database Schema

#### **emotion_sessions Table**

```sql
CREATE TABLE emotion_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  session_type VARCHAR(50),          -- 'pomodoro', 'study', etc.
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  snapshot_count INTEGER,
  metadata JSONB,                    -- session-specific metadata
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_emotion_sessions_user_date
ON emotion_sessions(user_id, started_at DESC);
```

#### **emotion_snapshots Table**

```sql
CREATE TABLE emotion_snapshots (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES emotion_sessions(id) ON DELETE CASCADE,
  emotion VARCHAR(50),               -- 'focused', 'distracted', etc.
  gaze VARCHAR(50),                  -- 'center', 'left', etc.
  confusion BOOLEAN,
  timestamp BIGINT NOT NULL,         -- milliseconds since epoch
  confidence DECIMAL(3,2),           -- 0.00 to 1.00
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id) REFERENCES emotion_sessions(id)
);

-- Optimize for time-range queries
CREATE INDEX idx_emotion_snapshots_session_time
ON emotion_snapshots(session_id, timestamp);
```

#### **emotion_analytics Table** (Optional, for pre-computed aggregates)

```sql
CREATE TABLE emotion_analytics (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  granularity VARCHAR(20),           -- 'daily', 'weekly', 'monthly'
  session_count INTEGER,
  total_duration_minutes DECIMAL(10,2),
  focus_score DECIMAL(3,2),
  emotion_breakdown JSONB,           -- { focused: 0.68, ... }
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date, granularity)
);
```

### Data Flow: Frontend → Backend

1. **Session Start:** Frontend calls `POST /api/emotion/sessions/start`
   - Stores `sessionId` in memory
   - Begins emotion detection locally

2. **Data Collection:** Every 5 seconds (or as configured), batch send emotion snapshots
   - `POST /api/emotion/sessions/{sessionId}/data` with array of snapshots
   - Reduces network overhead vs. real-time single-snapshot sends

3. **Session End:** When Pomodoro completes or user stops camera
   - `POST /api/emotion/sessions/{sessionId}/end`
   - Server finalizes session, computes analytics

4. **Data Retrieval:** User views analytics dashboard
   - `GET /api/emotion/history` for session list
   - `GET /api/emotion/analytics/trends` for charts/graphs

### Performance Considerations

#### **Batch Data Submission**

- Frontend should collect snapshots at 30 FPS locally
- Send to backend every 5-10 seconds as batch (150-300 snapshots)
- Reduces network overhead by 98%

#### **Time Synchronization**

- Each snapshot includes client-side timestamp
- Server validates timestamps are within session window (±5 min tolerance)
- Handle clock skew gracefully

#### **Database Indexing**

- Index on `(user_id, session_date)` for quick session lookups
- Index on `(session_id, timestamp)` for snapshot retrieval
- Consider partitioning by date for large tables

#### **Aggregation Strategy**

- Compute daily aggregates asynchronously after session ends
- Store pre-computed analytics in `emotion_analytics` table
- Serve aggregates from cache for fast trend queries

### Error Handling

1. **Network Failure During Session**
   - Frontend continues recording locally
   - Retries failed batch submissions every 5 seconds
   - On session end, sends all accumulated data

2. **Session Not Found**
   - Return 404 if session ID invalid or expired
   - Frontend should gracefully handle and create new session

3. **Invalid Emotion Data**
   - Return 400 with error details
   - Validate emotion enum values
   - Validate timestamps are within reasonable bounds

4. **Authentication**
   - All endpoints require valid JWT or session token
   - Enforce user isolation (can't access other users' sessions)

---

## Integration Points

### Current Frontend Integration

#### **Pomodoro Page**

File: `src/app/(app)/pomodoro/page.tsx`

```typescript
<CameraProvider>
  <CVProvider>
    <PomodoroContent
      initialCvMonitoringEnabled={settings.cv_monitoring_enabled}
      // ... other props
    />
  </CVProvider>
</CameraProvider>
```

**Required Modifications:**

1. Hook into CVProvider or PomodoroContent to start/stop sessions
2. Implement session start on Pomodoro begin, end on Pomodoro complete
3. Buffer emotion snapshots and send periodically to backend

#### **CVContext Integration Point**

File: `src/features/camera/context/CVContext.tsx`

**Where Backend Calls Should Go:**

```typescript
// When session starts
const startSession = async () => {
  const response = await fetch('/api/emotion/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ sessionType: 'pomodoro' }),
  });
  const { sessionId } = await response.json();
  // Store sessionId for later use
};

// In the effect that tracks latestCVData
useEffect(() => {
  if (latestCVData && shouldBuffer) {
    bufferSnapshot(latestCVData);
    // When buffer reaches size or time threshold, flush:
    if (buffer.length >= 100) {
      flushEmotionData(sessionId, buffer);
    }
  }
}, [latestCVData]);

// When session ends
const endSession = async () => {
  await fetch(`/api/emotion/sessions/${sessionId}/end`, {
    method: 'POST',
    body: JSON.stringify({ endedAt: new Date().toISOString() }),
  });
};
```

### Settings Integration

File: `src/components/settings/SettingsContent.tsx`

**Add Setting:** `cv_monitoring_enabled` (already present)

- When enabled: activate camera and CV monitoring
- When disabled: stop camera and prevent emotion data collection

### Analytics Dashboard (Future)

**Proposed Location:** `src/app/(app)/analytics/page.tsx`

**Components Needed:**

1. Session history list
2. Focus score trends chart
3. Emotion breakdown pie chart
4. Time-series emotion visualization

---

## Summary of Changes Needed

### Backend Required:

- [ ] Create 7 API endpoints listed in "Proposed Backend API Endpoints"
- [ ] Implement database schema for emotion data storage
- [ ] Add authentication/authorization middleware
- [ ] Compute emotion analytics and trends
- [ ] Error handling and validation
- [ ] Rate limiting for data submission endpoints

### Frontend Required (Future Phase):

- [ ] Modify CVContext to start/end sessions via API
- [ ] Implement snapshot buffering and periodic flushing
- [ ] Add session ID storage in context
- [ ] Handle network failures gracefully
- [ ] Create analytics dashboard components
- [ ] Add UI toggle for emotion monitoring in settings

### Shared Responsibilities:

- [ ] Agree on timestamp format and timezone handling
- [ ] Define rate limits and batch size constraints
- [ ] Plan data retention policy
- [ ] Design error codes and response formats
- [ ] Plan for GDPR compliance (emotion data is personal)

---

## Next Steps

1. **Review & Feedback:** Backend team reviews this spec
2. **API Design Alignment:** Finalize endpoint signatures and response formats
3. **Database Design:** Finalize schema and indexing strategy
4. **Implementation:** Backend builds endpoints, Frontend adds integration
5. **Testing:** E2E tests for emotion recording and retrieval
6. **Deployment:** Beta test with real users, collect feedback on emotion accuracy

---

## Appendix: Current Frontend Code References

### Key Files:

- **Types:** `src/features/camera/types.ts`
- **Hook:** `src/features/camera/hooks/useFaceApiCV.ts`
- **CV Context:** `src/features/camera/context/CVContext.tsx`
- **Camera Context:** `src/features/camera/context/CameraContext.tsx`
- **Pomodoro Integration:** `src/app/(app)/pomodoro/page.tsx`
- **CV Display:** `src/components/cv/CVContent.tsx`

### Model Assets:

- Location: `/public/models/`
- Files needed:
  - `tiny_face_detector_model-weights_manifest.json`
  - `tiny_face_detector_model-shard1`
  - `face_expression_model-weights_manifest.json`
  - `face_expression_model-shard1`

---

**Document End**
