import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * The one popup shell every panel in the system uses: blood flow, research,
 * end card. Entrance/exit, geometry and chrome live here so panels can never
 * drift apart stylistically.
 */
export const InfoPopup: React.FC<{
  durationInFrames: number;
  width: number;
  x: number;
  y: number;
  accent?: string;
  /** coloured rail on the leading edge; 'none' for a plain panel */
  rail?: 'accent' | 'danger' | 'none';
  children: React.ReactNode;
}> = ({ durationInFrames, width, x, y, accent = T.color.accent, rail = 'none', children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const inSpring = spring({ frame, fps, config: T.spring.panel, durationInFrames: T.dur.cardIn });
  const scale = interpolate(inSpring, [0, 1], [0.92, 1]);
  const rise = interpolate(inSpring, [0, 1], [14, 0]);
  const fadeIn = interpolate(frame, [0, T.dur.fadeIn], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - T.dur.cardOut, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const outScale = interpolate(out, [0, 1], [0.985, 1]);

  const railColour = rail === 'accent' ? accent : rail === 'danger' ? T.color.danger : null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        opacity: fadeIn * out,
        transform: `translateY(${rise}px) scale(${scale * outScale})`,
        transformOrigin: '50% 40%',
        background: T.color.panel,
        border: `${T.stroke.hair}px solid ${T.color.border}`,
        borderRadius: T.radius.card,
        boxShadow: T.shadow,
        overflow: 'hidden',
        backdropFilter: 'blur(2px)',
      }}
    >
      {railColour ? (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: railColour }} />
      ) : null}
      <div style={{ padding: T.space.cardPad }}>{children}</div>
    </div>
  );
};
