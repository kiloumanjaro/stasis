# Onboarding Flow Integration Testing Guide

## What Was Implemented

### 1. Backend API Integration

- **File**: `src/lib/onboarding.ts`
- **Functions**:
  - `getOnboardingStatus()` - Fetches onboarding completion status
  - `completeOnboarding(data)` - Submits preferences and marks onboarding complete

### 2. Frontend Store Updates

- **File**: `src/lib/frontend-store.ts`
- **Changes**:
  - `markOnboardingComplete()` - Now async, calls backend API
  - `checkOnboardingStatusWithBackend()` - New function to verify status with backend

### 3. Route Guards & Integration

- **App Layout** (`src/app/(app)/layout.tsx`):
  - Checks onboarding status from backend on mount
  - Falls back to localStorage if API fails
  - Shows loading spinner while checking

- **Onboarding Layout** (`src/app/onboarding/layout.tsx`):
  - Prevents access if onboarding is complete
  - Checks both backend and localStorage
  - Handles cross-device completion

- **Setup Page** (`src/app/onboarding/setup/page.tsx`):
  - Updated to await `markOnboardingComplete()`
  - Better error handling

- **Welcome Page** (`src/app/onboarding/welcome/page.tsx`):
  - Updated to await `markOnboardingComplete()`
  - Skip flow improved with error handling

## Before You Test

Ensure your backend has these endpoints implemented:

### Endpoint 1: GET /onboarding/status

```bash
curl -X GET http://localhost:8000/onboarding/status \
  -H "Content-Type: application/json" \
  --cookie "session_id=YOUR_SESSION_ID"
```

**Expected Response:**

```json
{
  "onboarding_completed": boolean
}
```

### Endpoint 2: POST /onboarding/complete

```bash
curl -X POST http://localhost:8000/onboarding/complete \
  -H "Content-Type: application/json" \
  --cookie "session_id=YOUR_SESSION_ID" \
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

**Expected Response:**

```json
{
  "success": true,
  "message": "Onboarding completed successfully"
}
```

## Testing Scenarios

### Scenario 1: Happy Path (First Time User)

1. Start fresh browser session (clear localStorage)
2. Log in
3. Should be redirected to `/onboarding/welcome`
4. Click "Get Started"
5. Fill all 6 steps
6. Click "Go to Dashboard" on summary
7. Should see preferences submitted to backend
8. Should be redirected to `/dashboard`
9. Check Network tab for `POST /onboarding/complete` call

**Expected Behavior:**

- ✅ No onboarding bypass
- ✅ All steps are accessible
- ✅ Preferences saved locally and to backend
- ✅ User reaches dashboard

### Scenario 2: Skip Onboarding

1. Start fresh browser session
2. Log in → See welcome page
3. Click "Skip for now"
4. Should save `skipped: true` to backend
5. Should be redirected to `/dashboard`

**Expected Behavior:**

- ✅ Onboarding marked complete
- ✅ Backend API called
- ✅ User reaches dashboard

### Scenario 3: Already Completed (Same Device)

1. Complete onboarding (Scenario 1)
2. Clear cookies but keep localStorage
3. Log in again
4. Should go directly to `/dashboard`
5. Try manually accessing `/onboarding/welcome`
6. Should be redirected to `/dashboard`

**Expected Behavior:**

- ✅ No re-onboarding
- ✅ Quick redirect to dashboard
- ✅ No API call needed (uses localStorage)

### Scenario 4: API Failure Resilience

1. Start with backend API unreachable
2. Log in
3. Should see loading spinner for ~5 seconds
4. Should either:
   - Timeout and fall back to localStorage check
   - Or still load if backend is slow
5. Continue to onboarding or dashboard
6. Complete onboarding
7. Should save locally even if API fails

**Expected Behavior:**

- ✅ App doesn't crash
- ✅ Falls back to localStorage
- ✅ User can still complete onboarding
- ✅ Preferences saved locally

### Scenario 5: Cross-Device Completion

1. Complete onboarding on Device A
2. On Device B, try accessing `/onboarding/welcome`
3. Backend returns `onboarding_completed: true`
4. Should redirect to `/dashboard`

**Expected Behavior:**

- ✅ Cross-device detection works
- ✅ User can't access onboarding pages
- ✅ Proper redirect

## Testing Commands

### Check localStorage

Open browser DevTools → Application → Local Storage → Look for:

- `stasis-onboarding` - Should contain `"completed": true` after onboarding
- `stasis-settings-profile` - Should contain all preference settings

### Monitor Network Requests

1. Open DevTools → Network tab
2. Start the app
3. Log in
4. Look for:
   - `GET /onboarding/status` (during app layout check)
   - `POST /onboarding/complete` (when finishing onboarding)

### Check Console Logs

Look for success or error messages:

- `"Error fetching onboarding status: ..."` - API failures logged
- `"Failed to complete onboarding on backend: ..."` - Completion API failures

## Troubleshooting

### Issue: Type Error in TypeScript

```
Solution: Run `npm run type-check` to verify, or rebuild with `rm -r .next && npm run build`
```

### Issue: 401 Unauthorized on API Calls

```
Solution: Ensure user is properly authenticated. Check:
1. Auth cookies are being sent (credentials: 'include')
2. Backend auth is validating correctly
3. User session is valid
```

### Issue: Redirect Loop Between Onboarding and Dashboard

```
Solution: Check backend onboarding status endpoint:
1. Verify it's returning correct status
2. Check localStorage vs backend agreement
3. Clear localStorage and test fresh
```

### Issue: "Loading..." spinner doesn't disappear

```
Solution: This means API is stuck/slow. Check:
1. Backend connection (ping localhost:8000)
2. Network tab for hanging requests
3. Browser console for errors
```

## Files Modified

1. **Created:**
   - `src/lib/onboarding.ts` - API endpoints
   - `src/lib/ONBOARDING_IMPLEMENTATION.md` - Technical docs

2. **Updated:**
   - `src/lib/frontend-store.ts` - Backend integration
   - `src/app/(app)/layout.tsx` - Backend status check
   - `src/app/onboarding/layout.tsx` - Cross-device detection
   - `src/app/onboarding/setup/page.tsx` - Async handling
   - `src/app/onboarding/welcome/page.tsx` - Async handling

## Environment Setup

Ensure `.env.local` has:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Next Steps

1. **Implement Backend Endpoints**
   - Add `GET /onboarding/status`
   - Add `POST /onboarding/complete`
   - Ensure they return correct response format

2. **Test Locally**
   - Run frontend: `npm run dev`
   - Run backend on port 8000
   - Follow testing scenarios above

3. **Error Handling Enhancement** (Optional)
   - Add toast notifications using `sonner`
   - Show user-friendly error messages
   - Implement retry logic

4. **Analytics** (Optional)
   - Track completion rates
   - Monitor time spent in onboarding
   - Track which steps are dropped

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review `src/lib/ONBOARDING_IMPLEMENTATION.md`
3. Check browser console for errors
4. Check network tab for failed requests
