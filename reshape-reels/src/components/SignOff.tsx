import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/** Brand sign-off as a hairline lockup, not another filled panel. */
export const SignOff: React.FC<{ durationInFrames: number; top?: number }> = ({ durationInFrames, top = 396 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rule = interpolate(t, [0, 0.5], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const txt = interpolate(t, [0.18, 0.55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: out }}>
      <div style={{ width: `${rule * 46}%`, height: 2, background: T.color.border, margin: '0 auto 22px' }} />
      <div style={{ fontFamily: T.font.display, fontSize: 66, letterSpacing: 6, color: T.color.text, opacity: txt,
        textShadow: '0 4px 22px rgba(0,0,0,.6)' }}>
        BE STRONG
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 25, letterSpacing: 8, color: T.color.accent, marginTop: 14, opacity: txt }}>
        EASY MONEY
      </div>
      <div style={{ width: `${rule * 46}%`, height: 2, background: T.color.border, margin: '22px auto 0' }} />
    </div>
  );
};
