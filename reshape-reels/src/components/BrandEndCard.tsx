import React from 'react';
import { RESHAPE_THEME as T } from '../theme';
import { InfoPopup } from './InfoPopup';
import { AnimatedLabel } from './AnimatedLabel';

export const BrandEndCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => (
  <InfoPopup durationInFrames={durationInFrames} width={760} x={160} y={485}>
    <div style={{ textAlign: 'center' }}>
      <AnimatedLabel delay={3}>
        <div style={{ fontFamily: T.font.display, fontSize: T.size.brandLg, color: T.color.text, letterSpacing: 4 }}>
          BE STRONG
        </div>
      </AnimatedLabel>
      <AnimatedLabel delay={9}>
        <div style={{ fontFamily: T.font.body, fontSize: T.size.brandSm, color: T.color.accent, letterSpacing: 6, marginTop: 12 }}>
          EASY MONEY
        </div>
      </AnimatedLabel>
    </div>
  </InfoPopup>
);
