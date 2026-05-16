# Backend Requirements for Onboarding Flow

## Overview

The frontend onboarding implementation expects two REST API endpoints. This document details what your backend needs to implement.

## Endpoint 1: GET /onboarding/status

### Purpose

Check if the current user has completed onboarding.

### Requirements

- **Method**: GET
- **Path**: `/onboarding/status`
- **Authentication**: Required (uses session cookies)
- **Content-Type**: application/json

### Request

```bash
curl -X GET http://localhost:8000/onboarding/status \
  -H "Content-Type: application/json" \
  -c cookies.txt  # Include cookies for authentication
```

### Response (Success - 200)

```json
{
  "onboarding_completed": true
}
```

Or if not completed:

```json
{
  "onboarding_completed": false
}
```

### Response (Unauthorized - 401)

```json
{
  "error": "Unauthorized"
}
```

### Notes

- Return 401 if user is not authenticated
- This endpoint should be fast (called on every app load)
- Can optionally cache the result per request

---

## Endpoint 2: POST /onboarding/complete

### Purpose

Mark the user's onboarding as complete and save their initial preferences.

### Requirements

- **Method**: POST
- **Path**: `/onboarding/complete`
- **Authentication**: Required (uses session cookies)
- **Content-Type**: application/json

### Request Body

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

### Request Field Types

| Field                     | Type    | Valid Values                           | Notes                                   |
| ------------------------- | ------- | -------------------------------------- | --------------------------------------- |
| `privacy_comfort`         | string  | `"visible"`, `"hidden"`, `"off"`       | Camera/expression visibility preference |
| `expression_tolerance`    | string  | `"neutral"`, `"intense"`, `"variable"` | Emotion feedback tolerance level        |
| `study_block_length`      | number  | 5-120 (minutes)                        | Duration of focus sessions              |
| `mini_breaks_per_session` | number  | 1-10                                   | Number of short breaks in a session     |
| `recovery_duration`       | number  | 5-30 (minutes)                         | Duration of recovery breaks             |
| `break_mechanic`          | string  | `"relaxed"`, `"accountable"`           | Break monitoring style                  |
| `show_timer`              | boolean | `true` or `false`                      | Whether to show timer during study      |

### Response (Success - 200)

```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

### Response (Validation Error - 400)

```json
{
  "success": false,
  "message": "Invalid input",
  "errors": {
    "study_block_length": "Must be between 5 and 120"
  }
}
```

### Response (Unauthorized - 401)

```json
{
  "error": "Unauthorized"
}
```

### Response (Server Error - 500)

```json
{
  "success": false,
  "message": "Internal server error"
}
```

### Side Effects

This endpoint should:

1. ✅ Save preferences to user's profile
2. ✅ Set `onboarding_completed = true` in database
3. ✅ Record timestamp of completion
4. ✅ Optionally: Send success email to user
5. ✅ Optionally: Log analytics event

### Notes

- Should be idempotent (calling twice with same data should be safe)
- Should return 401 if user is not authenticated
- Validate all input fields before saving
- Should handle concurrent requests gracefully

---

## Database Schema

### Suggested User Profile Fields

```sql
ALTER TABLE users ADD COLUMN (
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP NULL,
  onboarding_skipped BOOLEAN DEFAULT FALSE
);

ALTER TABLE user_preferences ADD COLUMN (
  privacy_comfort VARCHAR(20),           -- 'visible', 'hidden', 'off'
  expression_tolerance VARCHAR(20),      -- 'neutral', 'intense', 'variable'
  study_block_length INT,                -- minutes
  mini_breaks_per_session INT,
  recovery_duration INT,                 -- minutes
  break_mechanic VARCHAR(20),            -- 'relaxed', 'accountable'
  show_timer BOOLEAN DEFAULT TRUE
);
```

---

## Implementation Checklist

- [ ] Create `GET /onboarding/status` endpoint
  - [ ] Check if user is authenticated (401 if not)
  - [ ] Query user's `onboarding_completed` flag
  - [ ] Return boolean response
  - [ ] Keep response time < 100ms

- [ ] Create `POST /onboarding/complete` endpoint
  - [ ] Check if user is authenticated (401 if not)
  - [ ] Validate all input fields
  - [ ] Save preferences to database
  - [ ] Set `onboarding_completed = true`
  - [ ] Return success response
  - [ ] Handle validation errors (400)

- [ ] Test endpoints with curl/Postman
  - [ ] Test with valid data
  - [ ] Test with invalid data
  - [ ] Test without authentication
  - [ ] Test concurrent requests

- [ ] Setup logging
  - [ ] Log completion events
  - [ ] Log errors for debugging

- [ ] Optional enhancements
  - [ ] Add rate limiting
  - [ ] Add request logging
  - [ ] Add metrics/analytics
  - [ ] Add email notification

---

## Testing Endpoints Locally

### Using curl

**Check Status:**

```bash
curl -X GET http://localhost:8000/onboarding/status \
  -H "Content-Type: application/json" \
  -b "session_id=YOUR_SESSION_ID"
```

**Complete Onboarding:**

```bash
curl -X POST http://localhost:8000/onboarding/complete \
  -H "Content-Type: application/json" \
  -b "session_id=YOUR_SESSION_ID" \
  -d '{
    "privacy_comfort": "visible",
    "expression_tolerance": "neutral",
    "study_block_length": 25,
    "mini_breaks_per_session": 2,
    "recovery_duration": 10,
    "break_mechanic": "relaxed",
    "show_timer": true
  }'
```

### Using Postman

1. Create new requests with URLs:
   - `GET http://localhost:8000/onboarding/status`
   - `POST http://localhost:8000/onboarding/complete`

2. Add authentication headers/cookies to match your auth mechanism

3. For POST, add body as JSON (raw)

### Using Python Requests

```python
import requests

# Setup
BASE_URL = "http://localhost:8000"
cookies = {"session_id": "YOUR_SESSION_ID"}

# Check status
response = requests.get(f"{BASE_URL}/onboarding/status", cookies=cookies)
print(response.json())

# Complete onboarding
payload = {
    "privacy_comfort": "visible",
    "expression_tolerance": "neutral",
    "study_block_length": 25,
    "mini_breaks_per_session": 2,
    "recovery_duration": 10,
    "break_mechanic": "relaxed",
    "show_timer": True
}
response = requests.post(f"{BASE_URL}/onboarding/complete", json=payload, cookies=cookies)
print(response.json())
```

---

## Error Handling Expected by Frontend

The frontend gracefully handles:

- ✅ Network timeouts (5+ seconds)
- ✅ 401 Unauthorized responses
- ✅ 500 Server errors
- ✅ Invalid JSON responses
- ✅ Slow API responses

The frontend will:

1. Try to call the endpoint
2. If it fails, fall back to localStorage state
3. Log errors to console
4. Continue app operation

This means your API doesn't need to be perfect, but should follow the response format above.

---

## Security Considerations

1. **Authentication**: Both endpoints require valid user session
2. **CSRF**: Ensure your framework handles CSRF tokens if needed
3. **Rate Limiting**: Optional but recommended
4. **Input Validation**: Validate all fields on backend
5. **Idempotency**: POST should be idempotent
6. **Logging**: Don't log sensitive data

---

## Troubleshooting

### Issue: Frontend showing "Loading..." forever

**Cause**: API endpoint not implemented or not responding
**Solution**:

- Check backend is running on port 8000
- Verify `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`
- Check browser Network tab for request

### Issue: Frontend falls back to localStorage

**Cause**: API returning error or wrong format
**Solution**:

- Check API response format matches expected JSON
- Verify credentials are being sent correctly
- Check browser console for error messages

### Issue: User can't complete onboarding

**Cause**: POST endpoint not implemented or returning error
**Solution**:

- Verify endpoint is returning `{"success": true}`
- Check database saves are working
- Verify user_preferences table has required columns

---

## Next Steps

1. Implement both endpoints in your backend
2. Test with curl/Postman before integrating frontend
3. Run frontend with `npm run dev`
4. Login and test onboarding flow
5. Check browser Network tab to verify both endpoints are called

---

## Support

Questions about the frontend onboarding implementation?

- Check `ONBOARDING_INTEGRATION_GUIDE.md` for frontend testing
- Check `src/lib/ONBOARDING_IMPLEMENTATION.md` for technical details
- Check `src/lib/onboarding.ts` for exact API client implementation
