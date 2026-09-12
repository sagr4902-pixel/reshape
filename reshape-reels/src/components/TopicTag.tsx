import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * A chapter mark, not a panel: when he says "this topic", this names it.
 * Rule-and-text only, so it reads as typography set into the frame.
 */
export const TopicTag: React.FC<{ durationInFrames: number; kicker: string; title: string }> = ({
  durationInFrames,
  kicker,
  title,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const rule = interpolate(t, [0, 0.42], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const text = interpolate(t, [0.16, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ position: 'absolute', right: T.safe.left + 20, top: 300, opacity: out, direction: 'rtl', textAlign: 'right' }}>
      <div style={{ display: 'flex', gap: 20, justifyContent: 'flex-start' }}>
        <div style={{ width: 5, height: 118 * rule, background: T.color.accent, borderRadius: 3, alignSelf: 'flex-start' }} />
        <div style={{ opacity: text, transform: `translateX(${(1 - text) * -14}px)` }}>
          <div style={{ fontFamily: T.font.body, fontSize: 25, letterSpacing: 2, color: T.color.accent }}>{kicker}</div>
          <div style={{ fontFamily: T.font.display, fontSize: 62, color: T.color.text, lineHeight: 1.28, marginTop: 6,
            textShadow: '0 4px 20px rgba(0,0,0,.6)' }}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};
