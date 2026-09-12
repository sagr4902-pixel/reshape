import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export type Punch = { t0: number; t1: number; t2: number; t3: number; peak: number };

/** Eased ramp: 0 -> peak across t0..t1, hold to t2, back to 0 by t3. */
export const punchAt = (timeS: number, punches: Punch[]) =>
  punches.reduce((z, p) => {
    if (timeS <= p.t0 || timeS >= p.t3) return z;
    const ease = Easing.inOut(Easing.cubic);
    if (timeS < p.t1)
      return z + interpolate(timeS, [p.t0, p.t1], [0, p.peak], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (timeS <= p.t2) return z + p.peak;
    return z + interpolate(timeS, [p.t2, p.t3], [p.peak, 0], { easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }, 0);

/**
 * Programmatic camera punch-in. Scales about a configurable origin so the
 * speaker's face stays framed instead of drifting with the frame centre.
 */
export const PunchZoom: React.FC<{
  punches: Punch[];
  baseScale?: number;
  originY?: string;
  children: React.ReactNode;
}> = ({ punches, baseScale = 1, originY = '46%', children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = baseScale * (1 + punchAt(frame / fps, punches));
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `50% ${originY}` }}>
      {children}
    </AbsoluteFill>
  );
};
