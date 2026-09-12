import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type FocusWindow = { t0: number; t1: number; t2: number; t3: number; amount: number };

/**
 * Depth. While a hero graphic owns the frame, the background is drawn down a
 * little so the graphic sits clearly in front of it. Subtle by design —
 * it should be felt as focus, not seen as a filter.
 */
export const FocusVignette: React.FC<{ windows: FocusWindow[] }> = ({ windows }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const amount = windows.reduce((acc, w) => {
    if (t <= w.t0 || t >= w.t3) return acc;
    if (t < w.t1) return acc + interpolate(t, [w.t0, w.t1], [0, w.amount], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (t <= w.t2) return acc + w.amount;
    return acc + interpolate(t, [w.t2, w.t3], [w.amount, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }, 0);
  if (amount <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 78% at 50% 62%, rgba(0,0,0,0) 34%, rgba(0,0,0,${amount}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};
