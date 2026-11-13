import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {hash} from './math';

/** Subtle animated film grain over everything (a pre-made noise tile, offset per frame). */
export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 0.07}) => {
  const fr = Math.floor(frame);
  const ox = Math.floor(hash(fr) * 256), oy = Math.floor(hash(fr + 99) * 256);
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -ox, top: -oy, width: 1080 + 512, height: 1920 + 512,
        backgroundImage: `url(${staticFile('tex/grain.png')})`, backgroundRepeat: 'repeat'}} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.55}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: 'none'}} />
);

export const Logo: React.FC<{width: number; style?: React.CSSProperties}> = ({width, style}) => (
  <Img src={staticFile('brand/reshape-logo.png')} style={{width, height: 'auto', ...style}} />
);
