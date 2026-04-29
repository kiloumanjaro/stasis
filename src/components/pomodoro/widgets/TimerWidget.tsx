'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  ChevronUp,
  Coffee,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCameraContextSafe } from '@/features/camera/context/CameraContext';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

let persistedState: {
  settings: TimerSettings;
  mode: TimerMode;
  endTime: number | null;
  pausedTimeRemaining: number | null;
  isRunning: boolean;
  currentSession: number;
  sessionsCompleted: number;
  totalFocusTime: number;
  totalBreakTime: number;
} | null = null;

export function TimerWidget() {
  // Initialize from persisted state or defaults
  const getInitialState = () => {
    if (persistedState) {
      return persistedState;
    }
    return {
      settings: DEFAULT_SETTINGS,
      mode: 'focus' as TimerMode,
      endTime: null,
      pausedTimeRemaining: DEFAULT_SETTINGS.focusDuration * 60,
      isRunning: false,
      currentSession: 1,
      sessionsCompleted: 0,
      totalFocusTime: 0,
      totalBreakTime: 0,
    };
  };

  const initialState = getInitialState();

  // Timer state
  const [settings, setSettings] = useState<TimerSettings>(
    initialState.settings
  );
  const [mode, setMode] = useState<TimerMode>(initialState.mode);
  const [endTime, setEndTime] = useState<number | null>(initialState.endTime);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(
    initialState.pausedTimeRemaining
  );
  const [isRunning, setIsRunning] = useState(initialState.isRunning);
  const [currentSession, setCurrentSession] = useState(
    initialState.currentSession
  );
  const [showSettings, setShowSettings] = useState(false);

  // Stats
  const [sessionsCompleted, setSessionsCompleted] = useState(
    initialState.sessionsCompleted
  );
  const [totalFocusTime, setTotalFocusTime] = useState(
    initialState.totalFocusTime
  );
  const [totalBreakTime, setTotalBreakTime] = useState(
    initialState.totalBreakTime
  );

  // Display time (calculated from endTime or pausedTimeRemaining)
  const [displayTime, setDisplayTime] = useState(() => {
    if (initialState.isRunning && initialState.endTime) {
      const remaining = Math.max(
        0,
        Math.ceil((initialState.endTime - Date.now()) / 1000)
      );
      return remaining;
    }
    return (
      initialState.pausedTimeRemaining ?? DEFAULT_SETTINGS.focusDuration * 60
    );
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref keeps the effect deps stable so a CameraProvider re-render doesn't
  // toggle the stream off/on and flicker the feed.
  const camera = useCameraContextSafe();
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  useEffect(() => {
    cameraRef.current?.setSessionActive(isRunning && mode === 'focus');
  }, [isRunning, mode]);

  useEffect(() => {
    return () => {
      cameraRef.current?.setSessionActive(false);
    };
  }, []);

  // Persist state to module-level variable
  useEffect(() => {
    persistedState = {
      settings,
      mode,
      endTime,
      pausedTimeRemaining,
      isRunning,
      currentSession,
      sessionsCompleted,
      totalFocusTime,
      totalBreakTime,
    };
  }, [
    settings,
    mode,
    endTime,
    pausedTimeRemaining,
    isRunning,
    currentSession,
    sessionsCompleted,
    totalFocusTime,
    totalBreakTime,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get duration for current mode
  const getDurationForMode = useCallback(
    (timerMode: TimerMode): number => {
      switch (timerMode) {
        case 'focus':
          return settings.focusDuration * 60;
        case 'shortBreak':
          return settings.shortBreakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setEndTime(null);

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusTime((prev) => prev + settings.focusDuration * 60);

      // Determine next break type
      if (currentSession >= settings.sessionsBeforeLongBreak) {
        setMode('longBreak');
        setPausedTimeRemaining(settings.longBreakDuration * 60);
        setDisplayTime(settings.longBreakDuration * 60);
        setCurrentSession(1);
      } else {
        setMode('shortBreak');
        setPausedTimeRemaining(settings.shortBreakDuration * 60);
        setDisplayTime(settings.shortBreakDuration * 60);
        setCurrentSession((prev) => prev + 1);
      }
    } else {
      // Break completed
      const breakDuration =
        mode === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration;
      setTotalBreakTime((prev) => prev + breakDuration * 60);
      setMode('focus');
      setPausedTimeRemaining(settings.focusDuration * 60);
      setDisplayTime(settings.focusDuration * 60);
    }

    // Play notification sound (browser API)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(
        mode === 'focus' ? 'Focus session complete!' : 'Break is over!'
      );
    }
  }, [mode, currentSession, settings]);

  // Timer effect - uses endTime for accurate time tracking
  useEffect(() => {
    if (isRunning && endTime) {
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setDisplayTime(remaining);

        if (remaining <= 0) {
          handleTimerComplete();
        }
      }, 100); // Check more frequently for accuracy
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, endTime, handleTimerComplete]);

  // Controls
  const handlePlay = () => {
    // Calculate end time based on current remaining time
    const timeToUse = pausedTimeRemaining ?? getDurationForMode(mode);
    setEndTime(Date.now() + timeToUse * 1000);
    setPausedTimeRemaining(null);
    setIsRunning(true);
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handlePause = () => {
    // Store the remaining time when pausing
    if (endTime) {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setPausedTimeRemaining(remaining);
      setDisplayTime(remaining);
    }
    setEndTime(null);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setEndTime(null);
    const duration = getDurationForMode(mode);
    setPausedTimeRemaining(duration);
    setDisplayTime(duration);
  };

  // Settings handlers
  const handleSettingChange = (key: keyof TimerSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Update time remaining if not running and on affected mode
    if (!isRunning) {
      if (key === 'focusDuration' && mode === 'focus') {
        setPausedTimeRemaining(value * 60);
        setDisplayTime(value * 60);
      } else if (key === 'shortBreakDuration' && mode === 'shortBreak') {
        setPausedTimeRemaining(value * 60);
        setDisplayTime(value * 60);
      } else if (key === 'longBreakDuration' && mode === 'longBreak') {
        setPausedTimeRemaining(value * 60);
        setDisplayTime(value * 60);
      }
    }
  };

  // Format stats time
  const formatStatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate progress percentage
  const totalDuration = getDurationForMode(mode);
  const progress = ((totalDuration - displayTime) / totalDuration) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Mode Indicator */}
      <div className="flex items-center justify-center gap-2">
        {mode === 'focus' ? (
          <Target className="h-4 w-4 text-primary" />
        ) : (
          <Coffee className="h-4 w-4 text-green-500" />
        )}
        <span className="text-sm font-medium capitalize">
          {mode === 'focus'
            ? 'Focus Time'
            : mode === 'shortBreak'
              ? 'Short Break'
              : 'Long Break'}
        </span>
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative flex h-40 w-40 items-center justify-center rounded-full bg-muted"
          style={{
            background: `conic-gradient(
              hsl(var(--primary)) ${progress}%, 
              hsl(var(--muted)) ${progress}%
            )`,
          }}
        >
          <div className="flex h-36 w-36 items-center justify-center rounded-full bg-background">
            <span className="font-mono text-3xl font-bold">
              {formatTime(displayTime)}
            </span>
          </div>
        </div>

        {/* Session Counter */}
        <div className="flex items-center gap-1">
          {Array.from({ length: settings.sessionsBeforeLongBreak }).map(
            (_, i) => (
              <div
                key={i}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  i < currentSession - 1 ||
                    (mode !== 'focus' && i < currentSession)
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                )}
              />
            )
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Session {currentSession} of {settings.sessionsBeforeLongBreak}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-full"
          onClick={handleReset}
          title="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {isRunning ? (
          <Button
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handlePause}
            title="Pause"
          >
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handlePlay}
            title="Start"
          >
            <Play className="ml-0.5 h-5 w-5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className={cn('h-11 w-11 rounded-full', showSettings && 'bg-accent')}
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapsible Settings */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          showSettings ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 border-t border-border/50 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Settings</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setShowSettings(false)}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Focus (min)</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={settings.focusDuration}
                onChange={(e) =>
                  handleSettingChange('focusDuration', Number(e.target.value))
                }
                className="h-7 w-16 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Short Break (min)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={settings.shortBreakDuration}
                onChange={(e) =>
                  handleSettingChange(
                    'shortBreakDuration',
                    Number(e.target.value)
                  )
                }
                className="h-7 w-16 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Long Break (min)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={settings.longBreakDuration}
                onChange={(e) =>
                  handleSettingChange(
                    'longBreakDuration',
                    Number(e.target.value)
                  )
                }
                className="h-7 w-16 text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">Sessions before long break</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) =>
                  handleSettingChange(
                    'sessionsBeforeLongBreak',
                    Number(e.target.value)
                  )
                }
                className="h-7 w-16 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="space-y-2 border-t border-border/50 pt-5">
        <p className="text-xs font-medium text-muted-foreground">
          Today&apos;s Stats
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-semibold">{sessionsCompleted}</p>
            <p className="text-[10px] text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {formatStatTime(totalFocusTime)}
            </p>
            <p className="text-[10px] text-muted-foreground">Focus</p>
          </div>
          <div>
            <p className="text-lg font-semibold">
              {formatStatTime(totalBreakTime)}
            </p>
            <p className="text-[10px] text-muted-foreground">Break</p>
          </div>
        </div>
      </div>
    </div>
  );
}
