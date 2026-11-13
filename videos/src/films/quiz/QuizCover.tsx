import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ensureFonts} from '../../kit/fonts';
import {Grain} from '../../kit/Stage';
import {Chip} from './kit';
import {Hook} from './sections';
import {Q} from './style';
import {wordAt} from './timeline';

ensureFonts();

/** Reel cover for v2: the تمرين؟ / تقدُّم؟ split, a "quick test" chip and the official logo (inside the 3:4 safe zone). */
export const QuizCover: React.FC = () => (
  <AbsoluteFill style={{background: Q.paper}}>
    <Hook f={Math.round(wordAt('H3', 4)) + 16} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}>
      <Chip text="اختبار سريع" fill={Q.cream} color={Q.ink} size={60} style={{boxShadow: `6px 6px 0 ${Q.ink}`}} />
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1480, height: 200, background: Q.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 -10px 30px rgba(0,0,0,0.15)'}}>
      <Img src={staticFile('brand/reshape-logo.png')} style={{width: 420, height: 'auto'}} />
    </div>
    <Grain frame={3} opacity={0.1} />
  </AbsoluteFill>
);
