'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getBackendUser } from '@/lib/backend-auth';
import {
  clearFrontendAppState,
  DEFAULT_SETTINGS_PROFILE,
  readOnboardingState,
  readPreferenceSummary,
  readSettingsProfile,
  saveSettingsProfile,
  type CompletionSound,
  type DefaultCardSort,
  type GazeSensitivity,
  type SettingsProfile,
} from '@/lib/frontend-store';

type StatusType = 'idle' | 'success' | 'error';

const sortOptions: Array<{ value: DefaultCardSort; label: string }> = [
  { value: 'due_date', label: 'Due Date' },
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'random', label: 'Random' },
];

const gazeOptions: Array<{ value: GazeSensitivity; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const completionSoundOptions: Array<{ value: CompletionSound; label: string }> =
  [
    { value: 'none', label: 'None' },
    { value: 'soft_chime', label: 'Soft chime' },
    { value: 'bell', label: 'Bell' },
  ];

function toBool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function toNum(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createInitialSettingsState(): SettingsProfile {
  return {
    focus_goal_minutes: toNum(DEFAULT_SETTINGS_PROFILE.focus_goal_minutes, 25),
    break_duration_minutes: toNum(
      DEFAULT_SETTINGS_PROFILE.break_duration_minutes,
      5
    ),
    long_break_duration_minutes: toNum(
      DEFAULT_SETTINGS_PROFILE.long_break_duration_minutes,
      20
    ),
    daily_goal_cards: toNum(DEFAULT_SETTINGS_PROFILE.daily_goal_cards, 20),
    default_card_sort: (DEFAULT_SETTINGS_PROFILE.default_card_sort ??
      'due_date') as DefaultCardSort,
    shortcuts_enabled: toBool(DEFAULT_SETTINGS_PROFILE.shortcuts_enabled, true),
    cv_monitoring_enabled: toBool(
      DEFAULT_SETTINGS_PROFILE.cv_monitoring_enabled,
      false
    ),
    burnout_threshold_minutes: toNum(
      DEFAULT_SETTINGS_PROFILE.burnout_threshold_minutes,
      10
    ),
    gaze_sensitivity: (DEFAULT_SETTINGS_PROFILE.gaze_sensitivity ??
      'medium') as GazeSensitivity,
    display_name: (DEFAULT_SETTINGS_PROFILE.display_name ?? '').slice(0, 40),
    heatmap_range_days: (DEFAULT_SETTINGS_PROFILE.heatmap_range_days ?? 30) as
      | 30
      | 60
      | 90,
    card_animation_enabled: toBool(
      DEFAULT_SETTINGS_PROFILE.card_animation_enabled,
      true
    ),
    completion_sound: (DEFAULT_SETTINGS_PROFILE.completion_sound ??
      'soft_chime') as CompletionSound,
    reminder_enabled: toBool(DEFAULT_SETTINGS_PROFILE.reminder_enabled, false),
    reminder_time: DEFAULT_SETTINGS_PROFILE.reminder_time ?? '08:00',
    email: DEFAULT_SETTINGS_PROFILE.email ?? null,
  };
}

export function SettingsContent() {
  const [settings, setSettings] = useState<SettingsProfile>(
    createInitialSettingsState()
  );
  const [status, setStatus] = useState<{ type: StatusType; message: string }>({
    type: 'idle',
    message: '',
  });
  const [password, setPassword] = useState('');
  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'requesting' | 'active' | 'blocked'
  >('idle');
  const [isSaving, startSaving] = useTransition();
  const [isChangingPassword, startChangingPassword] = useTransition();
  const [isExporting, startExporting] = useTransition();
  const [isDeletingAccount, startDeletingAccount] = useTransition();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const storedSettings = readSettingsProfile();

    setSettings((prev) => ({
      ...prev,
      ...storedSettings,
      display_name: (storedSettings.display_name ?? '').slice(0, 40),
    }));

    void getBackendUser().then((user) => {
      if (!isMounted || !user) {
        return;
      }

      setSettings((prev) => ({
        ...prev,
        id: user.id,
        email: user.email,
        display_name:
          prev.display_name && prev.display_name.trim().length > 0
            ? prev.display_name
            : user.name,
      }));
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const showCameraPreview = settings.cv_monitoring_enabled;

  useEffect(() => {
    const ensurePreview = async () => {
      if (!showCameraPreview) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        setCameraStatus('idle');
        return;
      }

      if (streamRef.current) {
        setCameraStatus('active');
        return;
      }

      try {
        setCameraStatus('requesting');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraStatus('active');
      } catch (error) {
        console.error('Unable to start webcam preview:', error);
        setCameraStatus('blocked');
      }
    };

    void ensurePreview();
  }, [showCameraPreview]);

  const statusTone = useMemo(() => {
    if (status.type === 'error') return 'destructive' as const;
    return 'default' as const;
  }, [status.type]);

  const setField = <K extends keyof SettingsProfile>(
    key: K,
    value: SettingsProfile[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveAllSettings = () => {
    setStatus({ type: 'idle', message: '' });

    startSaving(async () => {
      const nextSettings = saveSettingsProfile(settings);
      setSettings(nextSettings);
      setStatus({
        type: 'success',
        message: 'Settings updated locally on this device.',
      });
    });
  };

  const saveDisplayName = () => {
    startSaving(async () => {
      const nextSettings = saveSettingsProfile({
        display_name: settings.display_name ?? '',
      });
      setSettings((prev) => ({ ...prev, ...nextSettings }));
      setStatus({
        type: 'success',
        message: 'Display name updated locally.',
      });
    });
  };

  const revokeCameraAccess = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setField('cv_monitoring_enabled', false);
    setCameraStatus('idle');

    startSaving(async () => {
      const nextSettings = saveSettingsProfile({
        ...settings,
        cv_monitoring_enabled: false,
      });
      setSettings(nextSettings);
      setStatus({
        type: 'success',
        message: 'Camera access revoked and monitoring disabled locally.',
      });
    });
  };

  const updatePassword = () => {
    startChangingPassword(async () => {
      setStatus({
        type: 'error',
        message:
          'Password changes are managed by your Google account, not this frontend-only app.',
      });
      setPassword('');
    });
  };

  const exportData = () => {
    startExporting(async () => {
      const exportPayload = {
        exported_at: new Date().toISOString(),
        settings: readSettingsProfile(),
        onboarding: readOnboardingState(),
        preferenceSummary: readPreferenceSummary(),
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, '-');
      anchor.href = url;
      anchor.download = `stasis-data-export-${timestamp}.json`;
      anchor.click();
      URL.revokeObjectURL(url);

      setStatus({
        type: 'success',
        message: 'Local app data export downloaded.',
      });
    });
  };

  const deleteAccount = () => {
    const confirmed = window.confirm(
      'Clear local Stasis data stored in this browser? Your Google account will not be deleted.'
    );

    if (!confirmed) {
      return;
    }

    startDeletingAccount(async () => {
      clearFrontendAppState();
      setSettings((prev) => ({
        ...createInitialSettingsState(),
        email: prev.email ?? null,
      }));
      setStatus({
        type: 'success',
        message:
          'Local study data cleared. Your authenticated account is unchanged.',
      });
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#f0f0eb]">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage study behavior, camera monitoring, reminders, and account
            details.
          </p>
        </div>
        <Button
          onClick={saveAllSettings}
          disabled={isSaving || isDeletingAccount}
        >
          {isSaving ? 'Saving...' : 'Save all changes'}
        </Button>
      </div>

      {status.type !== 'idle' && (
        <Alert variant={statusTone}>
          <AlertTitle>
            {status.type === 'success' ? 'Success' : 'Update failed'}
          </AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <Card className="bg-[#242322]">
        <CardHeader>
          <CardTitle>Study Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="focusGoal">Focus session length (minutes)</Label>
            <Input
              id="focusGoal"
              type="number"
              min={5}
              max={120}
              value={settings.focus_goal_minutes ?? 25}
              onChange={(e) =>
                setField('focus_goal_minutes', Number(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortBreak">Short break length (minutes)</Label>
            <Input
              id="shortBreak"
              type="number"
              min={1}
              max={30}
              value={settings.break_duration_minutes ?? 5}
              onChange={(e) =>
                setField('break_duration_minutes', Number(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="longBreak">Long break length (minutes)</Label>
            <Input
              id="longBreak"
              type="number"
              min={10}
              max={60}
              value={settings.long_break_duration_minutes ?? 20}
              onChange={(e) =>
                setField('long_break_duration_minutes', Number(e.target.value))
              }
            />
            <p className="text-xs text-muted-foreground">
              Triggers after every 4 Pomodoros.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyGoal">Daily card review goal</Label>
            <Input
              id="dailyGoal"
              type="number"
              min={5}
              max={200}
              value={settings.daily_goal_cards ?? 20}
              onChange={(e) =>
                setField('daily_goal_cards', Number(e.target.value))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardSort">Default card sort order</Label>
            <select
              id="cardSort"
              value={settings.default_card_sort ?? 'due_date'}
              onChange={(e) =>
                setField('default_card_sort', e.target.value as DefaultCardSort)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#242322]"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-[#3d3c3b] p-3">
            <Checkbox
              id="shortcutsEnabled"
              checked={settings.shortcuts_enabled ?? true}
              onCheckedChange={(checked) =>
                setField('shortcuts_enabled', checked === true)
              }
            />
            <div>
              <Label htmlFor="shortcutsEnabled">
                Enable keyboard shortcuts for card review
              </Label>
              <p className="text-xs text-muted-foreground">
                Supports 1-4 number key answers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#242322]">
        <CardHeader>
          <CardTitle>CV Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3 rounded-md border border-[#3d3c3b] p-3">
            <Checkbox
              id="cvMonitoring"
              checked={settings.cv_monitoring_enabled ?? false}
              onCheckedChange={(checked) =>
                setField('cv_monitoring_enabled', checked === true)
              }
            />
            <Label htmlFor="cvMonitoring">Enable webcam monitoring</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Video stays local in your browser. When monitoring is enabled,
            mapped emotion labels may be synced during active focus sessions.
          </p>

          {showCameraPreview && (
            <div className="space-y-2">
              <Label>Live webcam preview</Label>
              <video
                ref={videoRef}
                className="h-56 w-full rounded-md border border-[#3d3c3b] bg-black object-cover"
                autoPlay
                muted
                playsInline
              />
              <p className="text-xs text-muted-foreground">
                {cameraStatus === 'requesting' && 'Requesting camera access...'}
                {cameraStatus === 'active' &&
                  'Camera connected. Video stays local; only mapped emotion labels may sync during focus sessions.'}
                {cameraStatus === 'blocked' &&
                  'Camera access blocked. Check browser permission settings.'}
              </p>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Burnout detection threshold (
                {settings.burnout_threshold_minutes} min)
              </Label>
              <Slider
                min={5}
                max={20}
                step={1}
                value={[settings.burnout_threshold_minutes ?? 10]}
                onValueChange={(v) =>
                  setField('burnout_threshold_minutes', v[0])
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gazeSensitivity">Gaze tracking sensitivity</Label>
              <select
                id="gazeSensitivity"
                value={settings.gaze_sensitivity ?? 'medium'}
                onChange={(e) =>
                  setField(
                    'gaze_sensitivity',
                    e.target.value as GazeSensitivity
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {gazeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="bg-[#242322]"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={revokeCameraAccess}
            disabled={isSaving || isDeletingAccount}
          >
            Revoke Camera Access
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#242322]">
        <CardHeader>
          <CardTitle>Appearance & Experience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="greetingName">Dashboard greeting name</Label>
            <div className="flex gap-2">
              <Input
                id="greetingName"
                maxLength={40}
                value={settings.display_name ?? ''}
                onChange={(e) =>
                  setField('display_name', e.target.value.slice(0, 40))
                }
              />
              <Button
                onClick={saveDisplayName}
                disabled={isSaving || isDeletingAccount}
              >
                Save
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatmapRange">Streak heatmap date range</Label>
            <select
              id="heatmapRange"
              value={settings.heatmap_range_days ?? 30}
              onChange={(e) =>
                setField(
                  'heatmap_range_days',
                  Number(e.target.value) as 30 | 60 | 90
                )
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={30} className="bg-[#242322]">
                30 days
              </option>
              <option value={60} className="bg-[#242322]">
                60 days
              </option>
              <option value={90} className="bg-[#242322]">
                90 days
              </option>
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-md border border-[#3d3c3b] p-3">
            <Checkbox
              id="cardAnimation"
              checked={settings.card_animation_enabled ?? true}
              onCheckedChange={(checked) =>
                setField('card_animation_enabled', checked === true)
              }
            />
            <Label htmlFor="cardAnimation">Card flip animation</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionSound">Session completion sound</Label>
            <select
              id="completionSound"
              value={settings.completion_sound ?? 'soft_chime'}
              onChange={(e) =>
                setField('completion_sound', e.target.value as CompletionSound)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {completionSoundOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-[#242322]"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#242322]">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md border border-[#3d3c3b] p-3">
            <Checkbox
              id="dailyReminder"
              checked={settings.reminder_enabled ?? false}
              onCheckedChange={(checked) =>
                setField('reminder_enabled', checked === true)
              }
            />
            <Label htmlFor="dailyReminder">Daily review reminder</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder time</Label>
            <Input
              id="reminderTime"
              type="time"
              value={settings.reminder_time ?? '08:00'}
              onChange={(e) => setField('reminder_time', e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground md:col-span-2">
            Browser notifications require Stasis to be open.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-[#242322]">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <Label>Email (read-only)</Label>
            <Input value={settings.email ?? ''} readOnly />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountDisplayName">Change display name</Label>
            <Input
              id="accountDisplayName"
              maxLength={40}
              value={settings.display_name ?? ''}
              onChange={(e) =>
                setField('display_name', e.target.value.slice(0, 40))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Change password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
              />
              <Button
                onClick={updatePassword}
                disabled={isChangingPassword || isDeletingAccount}
              >
                {isChangingPassword ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={exportData}
              disabled={isExporting || isDeletingAccount}
            >
              {isExporting ? 'Preparing export...' : 'Export data'}
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount
                ? 'Clearing local data...'
                : 'Clear local data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
