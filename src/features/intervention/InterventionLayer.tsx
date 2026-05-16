'use client';

import { useIntervention } from './useIntervention';
import { MemeResetOverlay } from './MemeResetOverlay';
import { BreakOverlay } from './BreakOverlay';

export function InterventionLayer() {
  const { active, dismiss, complete } = useIntervention();

  if (!active) return null;

  if (active.action === 'MEME_RESET') {
    return <MemeResetOverlay reason={active.reason} onDismiss={dismiss} />;
  }

  return (
    <BreakOverlay
      intervention={active}
      onComplete={complete}
      onSkip={dismiss}
    />
  );
}
