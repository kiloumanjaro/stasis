# Pomodoro Timer — Bug Report

---

## Bug 1 — Timer stalls at 00:00 if widget is unmounted at expiry

File: [TimerWidget.tsx:199-216](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

`handleTimerComplete` is only invoked from inside the `setInterval` tick. If the user navigates away from `/pomodoro` (e.g. to `/dashboard`) and the timer's `endTime` passes while the widget is unmounted, the interval is cleared and completion never fires. On return, `displayTime` correctly computes as `0`, but:

- `mode` stays at `focus`
- `sessionsCompleted` is not incremented
- `currentSession` is not advanced
- No mode transition to break

The user sees a stuck `00:00` in focus mode.

### Steps to reproduce

1. Set focus duration to 1 minute.
2. Press Start.
3. Immediately navigate to `/dashboard`.
4. Wait 90 seconds.
5. Navigate back to `/pomodoro`.

Expected: Timer should be in short-break mode with break time loaded; sessions counter incremented.
Actual: Timer shows `00:00` in focus mode; counter unchanged.

### Suggested fix

On mount, before starting the interval, check whether `isRunning && endTime && endTime <= Date.now()` and call `handleTimerComplete()` immediately.

---

## Bug 2 — Auto-transition to break does not auto-start the break

File: [TimerWidget.tsx:158-196](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

Spec: _"On focus session end, timer automatically transitions to short break."_

Current behavior: `handleTimerComplete` flips `mode` and loads the break duration into `pausedTimeRemaining`/`displayTime`, but explicitly sets `isRunning = false`. The user must press Play again to actually start the break.

### Suggested fix

Decide product intent — either:

- (a) auto-start the break by computing `endTime` and setting `isRunning = true`, or
- (b) update the spec wording to "transitions to break mode, ready to start."

If (a), wrap the auto-start in a setting (`autoStartBreaks: true`) for opt-out.

---

## Bug 3 — No Stop button (only Reset)

File: [TimerWidget.tsx:343-383](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

Spec references Start, Pause, and Stop as distinct controls. The widget exposes only Start/Pause (toggled) and Reset. There is no way to end the entire pomodoro cycle — Reset only resets the current mode's timer.

### Suggested fix

Either:

- Add an explicit Stop button that resets the timer **and** the cycle (`currentSession`, `mode → focus`).
- Or rename Reset to Stop and have it perform that combined action.

---

## Bug 4 — Reset does not reset the session cycle

File: [TimerWidget.tsx:242-248](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

Spec: _"Pomodoro count display resets to 0 if the user manually resets the session cycle."_

`handleReset` only resets `displayTime` and `pausedTimeRemaining` for the current mode. It does not touch:

- `sessionsCompleted`
- `currentSession`
- `mode` (stays on whichever mode was active)
- `totalFocusTime` / `totalBreakTime`

### Suggested fix

Tie the cycle reset to the Stop control proposed in Bug 3 (clear separation: Reset = current timer, Stop = whole cycle). Or add a separate "Reset cycle" affordance in the settings panel.

---

## Bug 5 — Touch targets below 44×44px on mobile

File: [TimerWidget.tsx:347, 376](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

WCAG / iOS HIG minimum touch target is 44×44px. Current sizes:

- Play / Pause: `h-12 w-12` = 48px
- Reset: `h-10 w-10` = 40px
- Settings: `h-10 w-10` = 40px

### Suggested fix

Bump Reset and Settings to `h-11 w-11` (44px) at minimum, or `h-12 w-12` for visual consistency with Play/Pause.

---

## Bug 6 — Notification permission requested mid-Start

File: [TimerWidget.tsx:226-228](../src/components/pomodoro/widgets/TimerWidget.tsx)

### Description

`Notification.requestPermission()` is called inside `handlePlay`, which means the browser permission prompt appears the moment the user clicks Start. This interrupts the focus-session intent at the worst possible moment.

### Suggested fix

Move the permission request to either:

- Widget mount (less intrusive, but still prompts unrequested), or
- Defer until the first time a notification would actually fire (modern browsers handle deferred permission gracefully — call `requestPermission` lazily and skip the notification on first session if denied).

A settings toggle ("Enable session-end notifications") with an explicit user-driven prompt is best.

---

## Regression checklist verdict (current state)

| #   | Test                                                                           | Result                                              | Notes |
| --- | ------------------------------------------------------------------------------ | --------------------------------------------------- | ----- |
| 1   | Start → Pause → Resume → complete → short break auto-starts                    | Mode transitions; break does not auto-start (Bug 2) |
| 2   | Start → Stop → Start again from configured duration                            | Works via Reset; no real Stop (Bug 3)               |
| 3   | 4 focus sessions in sequence → long break on 5th transition                    |                                                     |
| 4   | Adjust focus duration in settings → start new session → correct duration loads |                                                     |
