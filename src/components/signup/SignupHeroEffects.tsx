'use client';

import { useEffect, useState } from 'react';

import Aurora from '@/components/signup/Aurora';
import FallingText from '@/components/signup/FallingText';

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export default function SignupHeroEffects() {
  const [showFallingText, setShowFallingText] = useState(false);

  useEffect(() => {
    let frameHandle = 0;
    let idleHandle: number | null = null;
    let timeoutHandle: number | null = null;
    let cancelled = false;

    const revealFallingText = () => {
      if (!cancelled) {
        setShowFallingText(true);
      }
    };

    frameHandle = window.requestAnimationFrame(() => {
      frameHandle = window.requestAnimationFrame(() => {
        const idleWindow = window as IdleWindow;

        if (typeof idleWindow.requestIdleCallback === 'function') {
          idleHandle = idleWindow.requestIdleCallback(revealFallingText, {
            timeout: 1200,
          });
          return;
        }

        timeoutHandle = window.setTimeout(revealFallingText, 300);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameHandle);

      if (idleHandle !== null) {
        const idleWindow = window as IdleWindow;
        idleWindow.cancelIdleCallback?.(idleHandle);
      }

      if (timeoutHandle !== null) {
        window.clearTimeout(timeoutHandle);
      }
    };
  }, []);

  return (
    <>
      <Aurora
        colorStops={['#7cff67', '#B19EEF', '#5227FF']}
        blend={0.81}
        amplitude={10.0}
        speed={1}
      />

      {showFallingText ? (
        <FallingText
          text="A state of stability and balance between stress and boredom"
          highlightWords={['stability', 'balance', 'stress', 'boredom']}
          trigger="auto"
          backgroundColor="transparent"
          wireframes={false}
          gravity={0.56}
          fontSize="4rem"
          mouseConstraintStiffness={0.9}
        />
      ) : null}
    </>
  );
}
