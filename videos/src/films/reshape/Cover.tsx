import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ensureFonts} from '../../kit/fonts';
import {Grain} from '../../kit/Stage';
import {C, FONT} from '../../kit/theme';
import {World} from './scenes/world';

ensureFonts();

/** Instagram Reel cover: key art inside the 3:4 grid-crop safe zone (y 240–1680). */
export const Cover: React.FC = () => (
  <AbsoluteFill style={{background: C.ink}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 55%, rgba(47,48,52,0.85) 0%, ${C.ink} 72%)`}} />
    <World f={249} cam={{pos: [215, 140, -700], target: [0, 150, 0], fov: 40}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,21,24,0.95) 12%, rgba(20,21,24,0) 34%, rgba(20,21,24,0) 74%, rgba(20,21,24,0.92) 90%)'}} />
    <div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', direction: 'rtl', fontFamily: FONT.display, fontWeight: 800, color: C.light, lineHeight: 1.12}}>
      <div style={{fontSize: 104}}>من أول حركة…</div>
      <div style={{fontSize: 104}}>
        إلى <span style={{color: C.orange}}>أقوى</span> نسخة منك
      </div>
    </div>
    <div style={{position: 'absolute', left: 0, right: 0, top: 1600, display: 'flex', justifyContent: 'center'}}>
      <Img src={staticFile('brand/reshape-logo.png')} style={{width: 380, height: 'auto'}} />
    </div>
    <Grain frame={7} opacity={0.06} />
  </AbsoluteFill>
);
