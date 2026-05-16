# Onboarding Flow Implementation Guide

## Overview

This document describes the complete onboarding flow implementation that integrates with the backend API.

## Architecture

### Backend Endpoints

The implementation assumes your backend has:

- `GET /onboarding/status` - Returns `{ onboarding_completed: boolean }`
- `POST /onboarding/complete` - Accepts preferences object and marks onboarding complete

### Core Components

#### 1. **API Module** (`src/lib/onboarding.ts`)

Provides two main functions:

- `getOnboardingStatus()` - Fetches completion status from backend
- `completeOnboarding(data)` - Submits preferences and marks onboarding complete

**Error Handling:**

- Handles 401 (unauthorized) gracefully - returns null
- Logs errors to console but doesn't throw (non-blocking)
- Fetch errors are caught and logged

#### 2. **Frontend Store** (`src/lib/frontend-store.ts`)

Updated functions:

- `markOnboardingComplete(patch)` - Now async, calls backend API then saves to localStorage
- `checkOnboardingStatusWithBackend()` - Verifies status with backend and syncs localStorage

**Behavior:**

- Saves to localStorage first (optimistic update)
- Calls backend API (non-blocking on error)
- Falls back to localStorage if API fails

#### 3. **Routing & Guards**

**Root Page** (`src/app/page.tsx`)

- Checks if user is authenticated
- Redirects to `/dashboard` if yes, `/auth/sign-up` if no

**App Layout** (`src/app/(app)/layout.tsx`)

- Checks backend onboarding status on mount
- Falls back to localStorage if API fails
- Redirects to `/onboarding/welcome` if not completed
- Shows loading state while checking

**Onboarding Layout** (`src/app/onboarding/layout.tsx`)

- Prevents access to onboarding if already completed
- Checks both localStorage and backend status
- Handles cross-device completion (if user completes on another device)

**Onboarding Pages:**

- `/onboarding/welcome` - Entry point, shows features and "Get Started" button
- `/onboarding/setup` - Multi-step form with 6 steps

## User Flow

### Happy Path

1. User logs in → Redirected to root
2. Root page checks auth → Authenticated, redirects to `/dashboard`
3. App layout checks onboarding status → Not completed, redirects to `/onboarding/welcome`
4. User completes onboarding:
   - Views welcome screen
   - Clicks "Get Started"
   - Goes through 6 setup steps
   - Submits preferences
   - Preferences saved to localStorage
   - Backend API called with preferences
   - Backend marks onboarding complete
   - Redirected to `/dashboard`
   - App layout verifies completion → Allows access

### Skip Flow

1. Same as happy path, but user clicks "Skip for now"
2. Onboarding is marked complete with `skipped: true`
3. Same API call and redirect flow

### Cross-Device Flow

1. User completes onboarding on Device A
2. User navigates to `/onboarding/*` on Device B
3. Onboarding layout checks backend status → Finds completed
4. Redirects to `/dashboard`

## Data Flow

### Completing Onboarding

```
SetupPage.handleComplete()
  ↓
markOnboardingComplete(preferences)
  ↓
saveOnboardingState() [localStorage]
  ↓
completeOnboarding(preferences) [API]
  ↓
saveSettingsProfile() [localStorage]
  ↓
router.push('/dashboard')
```

### Status Check on App Access

```
AppLayout.useEffect()
  ↓
getBackendUser() [Check auth]
  ↓
checkOnboardingStatusWithBackend() [Check backend]
  ↓
readOnboardingState() [Fallback to localStorage]
  ↓
Redirect based on status
```

## Error Handling

### API Errors

- Status endpoint errors are caught and logged (non-blocking)
- Complete endpoint errors are caught and logged (non-blocking)
- Setup/Welcome pages still function if API is down (uses localStorage)
- User sees loading state until API responds or times out

### Failed Submission

If `completeOnboarding()` fails:

1. Error is logged to console
2. Preferences are still saved to localStorage
3. User is still redirected to dashboard
4. Background sync could retry on next app launch

## Environment Variables

Required:

- `NEXT_PUBLIC_BACKEND_URL` - Backend API base URL (e.g., `http://localhost:8000`)

## Testing Checklist

- [ ] User can view welcome page
- [ ] User can navigate through all 6 setup steps
- [ ] User can skip onboarding
- [ ] User can complete onboarding
- [ ] Preferences are saved to localStorage
- [ ] `POST /onboarding/complete` is called with correct data
- [ ] User is redirected to `/dashboard` on completion
- [ ] User cannot access `/onboarding/*` after completion
- [ ] User is redirected to `/onboarding/welcome` if not completed
- [ ] App layout shows loading state while checking status
- [ ] Cross-device completion is detected (if available in backend)
- [ ] API errors don't break the flow (still saves locally)

## Future Enhancements

1. **Toast Notifications**
   - Add success toast on completion
   - Add error toast on API failures (optional user retry)
   - Use `sonner` (already installed) for notifications

2. **Preferences Sync**
   - Add endpoint to fetch preferences for existing users
   - Load saved preferences when returning to setup

3. **Analytics**
   - Track completion rates
   - Track step-by-step drop-off
   - Track time spent in onboarding

4. **Progressive Onboarding**
   - Move some steps to later in the app
   - Create onboarding checklist in dashboard
   - Allow editing preferences later

5. **Validation**
   - Add backend validation for preferences values
   - Handle validation errors from API
   - Show user-friendly error messages

## API Response Examples

### GET /onboarding/status

```json
{
  "onboarding_completed": true
}
```

### POST /onboarding/complete

**Request:**

```json
{
  "privacy_comfort": "visible",
  "expression_tolerance": "neutral",
  "study_block_length": 25,
  "mini_breaks_per_session": 2,
  "recovery_duration": 10,
  "break_mechanic": "relaxed",
  "show_timer": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```
