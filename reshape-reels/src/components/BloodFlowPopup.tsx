import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { InfoPopup } from './InfoPopup';
import { AnimatedLabel } from './AnimatedLabel';
import { ResearchBadge } from './ResearchBadge';
import { BloodFlowDiagram } from './BloodFlowDiagram';

/**
 * The Reel's main motion-graphics moment. Everything is built natively:
 * the vessels draw on, cells flow, the muscle answers, labels stagger in.
 *
 * Wording is deliberately descriptive — flow *increases* during exercise.
 * It never claims a pump causes growth.
 */
export const BloodFlowPopup: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const arrow = spring({ frame: frame - 10, fps, config: T.spring.pop, durationInFrames: 18 });

  return (
    <InfoPopup durationInFrames={durationInFrames} width={430} x={590} y={355}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <AnimatedLabel delay={3}><ResearchBadge text="Sports Science" /></AnimatedLabel>
          <AnimatedLabel delay={6}>
            <div style={{ fontFamily: T.font.display, fontSize: T.size.cardTitle, color: T.color.text, marginTop: 4 }}>
              BLOOD FLOW
            </div>
          </AnimatedLabel>
        </div>
        <div style={{
          width: 58, height: 52, borderRadius: T.radius.pill,
          border: `2px solid ${T.tint.accentEdge}`, background: T.tint.accentFaint,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${interpolate(arrow, [0, 1], [0.6, 1])})`,
          opacity: arrow,
        }}>
          <svg width="26" height="22" viewBox="0 0 26 22">
            <polygon points="13,3 24,19 2,19" fill={T.color.accent} />
          </svg>
        </div>
      </div>

      <div style={{ height: T.stroke.hair, background: T.color.border, margin: '16px 0 10px' }} />
      <BloodFlowDiagram width={370} height={150} />
      <div style={{ height: T.stroke.hair, background: T.color.border, margin: '10px 0 12px' }} />

      <AnimatedLabel delay={16}>
        <div style={{ fontFamily: T.font.body, fontSize: 23, color: T.color.accent }}>Exercise hyperemia</div>
      </AnimatedLabel>
      {['Working muscle demand rises', 'Local blood flow increases'].map((s, i) => (
        <AnimatedLabel key={s} delay={21 + i * 4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T.tint.accentDot }} />
            <div style={{ fontFamily: T.font.body, fontSize: 18, color: T.color.sub }}>{s}</div>
          </div>
        </AnimatedLabel>
      ))}
    </InfoPopup>
  );
};
