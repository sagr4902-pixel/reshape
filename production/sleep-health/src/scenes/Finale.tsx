import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {BRAND} from '../brand';
import {easeInOut, ramp, useSec} from '../motion';
import {Headline} from '../components/Text';

/** 42:48–48:30 — statement, then an orange light sweep reveals the logo. */
export const FinaleScene: React.FC = () => {
  const t = useSec();
  const sweep = ramp(t, 3.6, 4.9, easeInOut); // light band crosses the logo
  const logoW = 620;
  const x = (1 - sweep) * logoW - 45; // leads the right-to-left reveal edge
  return (
    <AbsoluteFill>
      <Headline text="النوم مو رفاهية…" at={0.2} top={620} size={104} />
      <Headline text="النوم صحة" at={2.45} top={790} size={132} emph={['صحة']} stagger={0.18} />

      <div style={{position: 'absolute', top: 1110, left: 540, width: logoW + 80, padding: '40px 40px', transform: 'translateX(-50%)', opacity: ramp(t, 3.7, 4.0), overflow: 'hidden'}}>
        <div style={{position: 'relative', clipPath: `inset(0 0 0 ${Math.max(0, (1 - sweep) * 100 - 4)}%)`}}>
          <Img src={staticFile('brand/reshape-primary.png')} style={{width: logoW, display: 'block'}} />
        </div>
        {/* light band */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: x + 40,
            width: 90,
            height: logoW * 0.333 + 120,
            background: 'linear-gradient(90deg, transparent, rgba(255,160,110,.85), rgba(255,255,255,.95), rgba(255,160,110,.85), transparent)',
            transform: 'skewX(-18deg)',
            filter: 'blur(6px)',
            opacity: sweep > 0 && sweep < 1 ? 0.75 : 0,
            mixBlendMode: 'screen',
          }}
        />
      </div>
      {/* final glow bloom under the logo */}
      <div style={{position: 'absolute', top: 1050, left: 540, width: 900, height: 500, transform: 'translate(-50%,-50%)', background: 'radial-gradient(50% 50% at 50% 50%, rgba(255,84,32,.22), transparent 70%)', opacity: ramp(t, 4.0, 5.2)}} />
      <div dir="ltr" style={{position: 'absolute', top: 1400, left: 0, right: 0, textAlign: 'center', fontFamily: "'Barlow Semi Condensed'", fontSize: 26, letterSpacing: '.34em', color: BRAND.muted, opacity: ramp(t, 4.6, 5.2)}}>
        SLEEP IS HEALTH
      </div>
    </AbsoluteFill>
  );
};
