'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  onInterventionTrigger,
  offInterventionTrigger,
  emitInterventionFeedback,
  type InterventionTrigger,
} from '@/lib/emotion-socket';

export type { InterventionTrigger };

export function useIntervention() {
  const [active, setActive] = useState<InterventionTrigger | null>(null);
  // Ref mirrors state so callbacks can read current value without stale closures
  // and without triggering side effects inside state updaters.
  const activeRef = useRef<InterventionTrigger | null>(null);
  activeRef.current = active;

  useEffect(() => {
    const handler = (trigger: InterventionTrigger) => {
      setActive((prev) => {
        if (!prev) return trigger;
        const rank: Record<string, number> = {
          MEME_RESET: 0,
          SHORT_BREAK: 1,
          LONG_BREAK: 2,
        };
        return (rank[trigger.action] ?? 0) >= (rank[prev.action] ?? 0)
          ? trigger
          : prev;
      });
    };

    onInterventionTrigger(handler);
    return () => offInterventionTrigger(handler);
  }, []);

  const dismiss = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    emitInterventionFeedback({
      interventionId: current.interventionId,
      sessionId: current.sessionId,
      action: current.action,
      outcome: 'dismissed',
      timestamp: Date.now(),
    });
    setActive(null);
  }, []);

  const complete = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    emitInterventionFeedback({
      interventionId: current.interventionId,
      sessionId: current.sessionId,
      action: current.action,
      outcome: 'completed',
      timestamp: Date.now(),
    });
    setActive(null);
  }, []);

  return { active, dismiss, complete };
}
