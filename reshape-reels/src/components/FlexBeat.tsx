import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { plateToScreen } from '../plate';

/**
 * The pose, treated as a highlight scene.
 *
 * The plate is frozen on the peak double-biceps frame (a real inter-word gap,
 * so nothing is cut mid-syllable). Over that held frame: a flash on the impact,
 * rings leaving the chest, and BICEPS labels pinned to the arm centroids the
 * segmentation actually tracked — not guessed positions.
 */
export const FlexBeat: React.FC<{
  durationInFrames: number;
  /** arm centroids in plate pixels, from track_v3.json at the frozen frame */
  L: [number, number];
  R: [number, number];
  punch: number;
  dx: number;
}> = ({ durationInFrames, L, R, punch, dx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const [lx, ly] = plateToScreen(L[0], L[1], punch, dx);
  const [rx, ry] = plateToScreen(R[0], R[1], punch, dx);
  const [cxp, cyp] = plateToScreen((L[0] + R[0]) / 2, (L[1] + R[1]) / 2 + 90, punch, dx);

  const flash = interpolate(t, [0, 0.05, 0.20], [0, 0.5, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 5, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const Ring: React.FC<{ delay: number }> = ({ delay }) => {
    const p = interpolate(t, [delay, delay + 0.78], [0, 1], {
      easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    if (p <= 0) return null;
    const r = 60 + p * 600;
    return (
      <div style={{
        position: 'absolute', left: cxp - r, top: cyp - r, width: r * 2, height: r * 2,
        borderRadius: '50%', border: `${interpolate(p, [0, 1], [5, 1])}px solid ${T.color.accent}`,
        opacity: interpolate(p, [0, 0.15, 1], [0, 0.72, 0]),
      }} />
    );
  };

  const Label: React.FC<{ x: number; y: number; delay: number; side: 'l' | 'r' }> = ({ x, y, delay, side }) => {
    const s = spring({ frame: frame - delay * fps, fps, config: T.spring.pop, durationInFrames: 16 });
    const w = 118 * s;
    return (
      <div style={{ position: 'absolute', left: x, top: y, opacity: s }}>
        <div style={{
          position: 'absolute', top: 0, [side === 'l' ? 'right' : 'left']: 0, width: w, height: 3,
          background: T.color.accent, boxShadow: `0 0 12px ${T.color.accent}`,
        } as React.CSSProperties} />
        <div style={{
          position: 'absolute', top: -46, [side === 'l' ? 'right' : 'left']: 0,
          fontFamily: T.font.display, fontSize: 34, letterSpacing: 4, color: T.color.accent,
          textShadow: '0 2px 16px rgba(0,0,0,.95)', transform: `translateY(${(1 - s) * 8}px)`,
          whiteSpace: 'nowrap',
        } as React.CSSProperties}>
          BICEPS
        </div>
        <div style={{
          position: 'absolute', left: -6, top: -6, width: 12, height: 12, borderRadius: 6,
          background: T.color.accent, boxShadow: `0 0 14px ${T.color.accent}`,
        }} />
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <Ring delay={0.04} />
      <Ring delay={0.26} />
      <Label x={lx} y={ly} delay={0.24} side="l" />
      <Label x={rx} y={ry} delay={0.30} side="r" />
    </AbsoluteFill>
  );
};
