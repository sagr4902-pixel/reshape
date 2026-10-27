import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BRAND, FONT} from './brand';
import {loadBrandFonts} from './fonts';
import {Background} from './components/Background';
import {Brain} from './components/Icons';

/** Vertical cover / thumbnail built from the same design system as the film. */
export const Cover: React.FC = () => {
  loadBrandFonts();
  return (
    <AbsoluteFill style={{background: BRAND.ink}}>
      <Background />
      <div style={{position: 'absolute', top: 160, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 30, letterSpacing: '.34em', color: BRAND.orange}}>THE SCIENCE OF SLEEP</div>
      <div style={{position: 'absolute', left: 540, top: 760, transform: 'translate(-50%,-50%)'}}>
        <Brain t={2.3} energy={0.7} size={820} />
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 1140, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.disp, fontWeight: 900, fontSize: 124, lineHeight: 1.1, color: BRAND.strong, textShadow: '0 4px 40px rgba(0,0,0,.5)'}}>
        النوم <span style={{color: BRAND.orange}}>مو</span> رفاهية
      </div>
      <div dir="rtl" style={{position: 'absolute', top: 1330, left: 0, right: 0, textAlign: 'center', fontFamily: FONT.ar, fontWeight: 600, fontSize: 44, color: BRAND.warm}}>
        دماغك · مناعتك · قلبك — بالأبحاث
      </div>
      <Img src={staticFile('brand/reshape-primary.png')} style={{position: 'absolute', top: 1580, left: 540, width: 420, transform: 'translateX(-50%)'}} />
    </AbsoluteFill>
  );
};
