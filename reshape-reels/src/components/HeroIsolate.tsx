import React from 'react';
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

export type Window4 = { t0: number; t1: number; t2: number; t3: number; amount: number };

export const windowAmount = (t: number, ws: Window4[]) =>
  ws.reduce((acc, w) => {
    if (t <= w.t0 || t >= w.t3) return acc;
    if (t < w.t1) return acc + interpolate(t, [w.t0, w.t1], [0, w.amount], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (t <= w.t2) return acc + w.amount;
    return acc + interpolate(t, [w.t2, w.t3], [w.amount, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  }, 0);

/**
 * Depth separation. `isolate_v3.mp4` is the same plate with the world dimmed
 * and desaturated behind a per-frame subject matte; crossfading to it makes him
 * step forward out of the park without touching his exposure.
 */
export const HeroIsolate: React.FC<{ windows: Window4[]; children?: React.ReactNode }> = ({ windows }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const a = windowAmount(frame / fps, windows);
  if (a <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity: a }}>
      <OffthreadVideo
        src={staticFile('isolate_v3.mp4')}
        muted
        style={{ position: 'absolute', width: 1350, height: 2400, left: (width - 1350) / 2, top: (height - 2400) / 2 }}
      />
    </AbsoluteFill>
  );
};

/** Silhouette contour, screen-blended and tinted — a rim light that tracks him. */
export const EdgeGlow: React.FC<{ windows: Window4[]; tint?: string }> = ({ windows, tint = T.color.accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const a = windowAmount(frame / fps, windows);
  if (a <= 0.001) return null;
  return (
    <AbsoluteFill style={{ opacity: a, mixBlendMode: 'screen', pointerEvents: 'none' }}>
      <AbsoluteFill style={{ filter: `saturate(0)` }}>
        <OffthreadVideo
          src={staticFile('edge_v3.mp4')}
          muted
          style={{ position: 'absolute', width: 1350, height: 2400, left: (width - 1350) / 2, top: (height - 2400) / 2 }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: tint, mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  );
};
