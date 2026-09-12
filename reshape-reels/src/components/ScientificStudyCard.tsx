import React from 'react';
import { RESHAPE_THEME as T } from '../theme';
import { InfoPopup } from './InfoPopup';
import { AnimatedLabel } from './AnimatedLabel';
import { ResearchBadge } from './ResearchBadge';

/**
 * Verified citation only. Hierarchy is author/year -> finding -> journal,
 * because the viewer has about two seconds.
 */
export const ScientificStudyCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => (
  <InfoPopup durationInFrames={durationInFrames} width={880} x={100} y={318} rail="accent">
    <div style={{ paddingLeft: 14 }}>
      <AnimatedLabel delay={3}><ResearchBadge text="Peer-reviewed research" /></AnimatedLabel>
      <AnimatedLabel delay={4}>
        <div style={{ fontFamily: T.font.display, fontSize: T.size.cardTitleLg, color: T.color.text, marginTop: 8, lineHeight: 1.22 }}>
          Schoenfeld, Grgic, Ogborn<br />&amp; Krieger (2017)
        </div>
      </AnimatedLabel>
      <AnimatedLabel delay={7}>
        <div style={{ fontFamily: T.font.body, fontSize: T.size.cardMeta, color: T.color.sub, marginTop: 12 }}>
          J Strength Cond Res 31(12): 3508–3523
        </div>
      </AnimatedLabel>
      <div style={{ height: T.stroke.hair, background: T.color.border, margin: '16px 0' }} />
      <AnimatedLabel delay={10}>
        <div style={{ fontFamily: T.font.body, fontSize: T.size.cardBody, color: T.tint.textSoft, lineHeight: 1.36 }}>
          Meta-analysis: when sets are taken to failure,
          muscle hypertrophy was similar across low and high loads.
        </div>
      </AnimatedLabel>
      <AnimatedLabel delay={14}>
        <div style={{ fontFamily: T.font.body, fontSize: T.size.cardNote, color: T.color.sub, marginTop: 14 }}>
          Max strength still favours heavy loads.
        </div>
      </AnimatedLabel>
    </div>
  </InfoPopup>
);
