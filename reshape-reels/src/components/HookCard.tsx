import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { InfoPopup } from './InfoPopup';
import { AnimatedLabel } from './AnimatedLabel';

/**
 * Editorial hook. Frames the misconception the video answers, using the
 * creator's own later wording, posed as a question.
 * NOTE: this is the one line of on-screen text not spoken in the audio.
 */
export const HookCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const x = spring({ frame: frame - 6, fps, config: T.spring.pop, durationInFrames: 18 });

  return (
    <InfoPopup durationInFrames={durationInFrames} width={930} x={75} y={435} rail="danger">
      <div style={{ paddingLeft: 14, direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AnimatedLabel delay={3}>
            <div style={{ fontFamily: T.font.body, fontSize: 34, color: T.color.danger }}>الادعاء الشائع</div>
          </AnimatedLabel>
          <div style={{
            width: 46, height: 46, borderRadius: 23, border: `3px solid ${T.color.danger}`,
            background: T.tint.dangerFaint, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `scale(${interpolate(x, [0, 1], [0.5, 1])}) rotate(${interpolate(x, [0, 1], [-40, 0])}deg)`,
            opacity: x,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22">
              <line x1="4" y1="4" x2="18" y2="18" stroke={T.color.danger} strokeWidth="4.5" strokeLinecap="round" />
              <line x1="18" y1="4" x2="4" y2="18" stroke={T.color.danger} strokeWidth="4.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div style={{ height: T.stroke.hair, background: T.color.border, margin: '18px 0' }} />
        <AnimatedLabel delay={9}>
          <div style={{ fontFamily: T.font.display, fontSize: 60, color: T.color.text, lineHeight: 1.3 }}>
            تمرين وزن الجسم<br />ما يبني عضل؟
          </div>
        </AnimatedLabel>
      </div>
    </InfoPopup>
  );
};
