import type { StepMeta } from './types';

export const STEP_META: StepMeta = {
  1: {
    title: 'Camera Privacy',
    subtitle:
      'How comfortable are you with the camera being active during study sessions?',
  },
  2: {
    title: 'Micro-Expression Tolerance',
    subtitle: "What do you typically look like when you're concentrating hard?",
  },
  3: {
    title: 'Study Rhythm',
    subtitle: 'Configure your study block and mini-break structure.',
  },
  4: {
    title: 'Recovery Window',
    subtitle:
      'How long should the app wait before re-engaging after detecting frustration?',
  },
  5: {
    title: 'Break Mechanic',
    subtitle: 'How should breaks work for you?',
  },
  6: {
    title: 'Timer Visibility',
    subtitle: 'Should the Pomodoro countdown be visible during study sessions?',
  },
};

export const PRIVACY_LABELS: Record<string, string> = {
  visible: 'Visible',
  hidden: 'Hidden',
  off: 'Off',
};

export const EXPRESSION_LABELS: Record<string, string> = {
  neutral: 'Neutral',
  intense: 'Intense',
  variable: 'Variable',
};

export const BREAK_LABELS: Record<string, string> = {
  relaxed: 'Relaxed',
  accountable: 'Accountable',
};
