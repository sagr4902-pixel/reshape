import React from 'react';
import {clamp, E} from './math';
import {C, FONT} from './theme';

/**
 * Arabic word reveal: right-to-left wipe + rise + de-blur. Whole words only, so letter shaping stays intact.
 * p = reveal progress 0..1, out = exit progress 0..1.
 */
export const Word: React.FC<{
  text: string; p: number; out?: number; size: number; color?: string; weight?: number; font?: string;
  x: number; y: number; anchor?: 'center' | 'right' | 'left'; letterSpacing?: number; style?: React.CSSProperties; shadow?: boolean;
}> = ({text, p, out = 0, size, color = C.light, weight = 800, font = FONT.display, x, y, anchor = 'center', letterSpacing = 0, style, shadow = true}) => {
  const pe = E.outCubic(clamp(p));
  const oe = E.inCubic(clamp(out));
  if (pe <= 0.001 || oe >= 0.999) return null;
  const tx = anchor === 'center' ? '-50%' : anchor === 'right' ? '-100%' : '0%';
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%) translateY(${(1 - pe) * 26 - oe * 22}px)`,
        fontFamily: font, fontWeight: weight, fontSize: size, color, direction: 'rtl', whiteSpace: 'nowrap', lineHeight: 1.15,
        letterSpacing, opacity: Math.min(1, pe * 1.6) * (1 - oe),
        filter: `blur(${(1 - pe) * 7 + oe * 6}px)`,
        clipPath: `inset(-30% 0 -30% ${(1 - pe) * 100}%)`,
        textShadow: shadow ? '0 6px 30px rgba(0,0,0,0.45)' : undefined,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
