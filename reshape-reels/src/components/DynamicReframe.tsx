import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type Reframe = { t0: number; t1: number; t2: number; t3: number; dx: number };

/**
 * Editorial reframing: eases the speaker aside while a panel occupies the
 * opposite side, then returns him to centre. Composition, not just overlay.
 */
export const DynamicReframe: React.FC<{ reframes: Reframe[]; children: React.ReactNode }> = ({
  reframes,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const ease = Easing.inOut(Easing.cubic);
  const dx = reframes.reduce((acc, r) => {
    if (t <= r.t0 || t >= r.t3) return acc;
    if (t < r.t1) return acc + interpolate(t, [r.t0, r.t1], [0, r.dx], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (t <= r.t2) return acc + r.dx;
    return acc + interpolate(t, [r.t2, r.t3], [r.dx, 0], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }, 0);
  return <AbsoluteFill style={{ transform: `translateX(${dx}px)` }}>{children}</AbsoluteFill>;
};
