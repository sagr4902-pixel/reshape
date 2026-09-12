import React from 'react';
import { evolvePath } from '@remotion/paths';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * An annotation that points at the speaker. He tells you to "check out Abu
 * Saqr" — so a hairline reaches over and tags him with his own name. Light and
 * brief on purpose: this section is mostly meant to breathe.
 */
export const PointerTag: React.FC<{
  label: string;
  /** tag box position */
  x: number;
  y: number;
  /** elbow path from the tag to the subject, in 1080x1920 space */
  d: string;
  /** where the pointer lands */
  dot: [number, number];
  durationInFrames: number;
}> = ({ label, x, y, d, dot, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const text = interpolate(t, [0, 0.26], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const draw = interpolate(t, [0.18, 0.62], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dotIn = interpolate(t, [0.58, 0.78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 9, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ev = evolvePath(draw, d);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: out }}>
      <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <path d={d} stroke={T.color.accent} strokeWidth={2.5} fill="none" strokeLinecap="round"
          strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} opacity={0.9} />
        <circle cx={dot[0]} cy={dot[1]} r={7} fill="none" stroke={T.color.accent} strokeWidth={2.5}
          opacity={dotIn} />
        <circle cx={dot[0]} cy={dot[1]} r={2.5} fill={T.color.accent} opacity={dotIn} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          direction: 'rtl',
          fontFamily: T.font.display,
          fontSize: 44,
          color: T.color.accent,
          opacity: text,
          transform: `translateY(${(1 - text) * 8}px)`,
          textShadow: '0 2px 16px rgba(0,0,0,.95)',
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
};
