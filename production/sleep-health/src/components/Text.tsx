import React from 'react';
import {BRAND, FONT} from '../brand';
import {easeOut, ramp, useSec} from '../motion';

type HeadlineProps = {
  text: string;
  at: number;
  size?: number;
  emph?: string[];
  color?: string;
  weight?: number;
  width?: number;
  top?: number;
  stagger?: number;
  lineHeight?: number;
  exitAt?: number;
};

/** Kinetic RTL headline: words rise, un-blur and settle one by one. */
export const Headline: React.FC<HeadlineProps> = ({
  text,
  at,
  size = 86,
  emph = [],
  color = BRAND.strong,
  weight = 900,
  width = 940,
  top,
  stagger = 0.085,
  lineHeight = 1.3,
  exitAt,
}) => {
  const t = useSec();
  const words = text.split(' ');
  const exit = exitAt ? 1 - ramp(t, exitAt, exitAt + 0.3) : 1;
  return (
    <div
      dir="rtl"
      style={{
        position: top === undefined ? 'relative' : 'absolute',
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        width,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: '0.28em',
        fontFamily: FONT.disp,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        color,
        textAlign: 'center',
        opacity: exit,
      }}
    >
      {words.map((w, i) => {
        const p = ramp(t, at + i * stagger, at + i * stagger + 0.55, easeOut);
        const isEm = emph.some((e) => w.replace(/[،.…؟]/g, '') === e.replace(/[،.…؟]/g, ''));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 34}px) scale(${0.96 + 0.04 * p})`,
              filter: `blur(${(1 - p) * 8}px)`,
              color: isEm ? BRAND.orange : color,
              textShadow: isEm ? '0 0 32px rgba(255,84,32,.45)' : '0 2px 24px rgba(0,0,0,.35)',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{text: string; at: number; top: number; color?: string; size?: number}> = ({text, at, top, color = BRAND.orange, size = 26}) => {
  const t = useSec();
  const p = ramp(t, at, at + 0.5);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: FONT.data,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '0.32em',
        textTransform: 'uppercase',
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** Research chip: `VAN DONGEN ET AL. — SLEEP, 2003` */
export const StudyLabel: React.FC<{text: string; at: number; top: number}> = ({text, at, top}) => {
  const t = useSec();
  const p = ramp(t, at, at + 0.6);
  return (
    <div
      dir="ltr"
      style={{
        position: 'absolute',
        top,
        left: '50%',
        transform: `translateX(-50%) translateY(${(1 - p) * 10}px)`,
        opacity: p,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 26px 12px 20px',
        borderRadius: 999,
        border: '1px solid rgba(255,255,255,.14)',
        background: 'linear-gradient(160deg, rgba(255,255,255,.10), rgba(255,255,255,.03))',
        backdropFilter: 'blur(16px)',
        fontFamily: FONT.data,
        fontWeight: 600,
        fontSize: 26,
        letterSpacing: '0.14em',
        color: BRAND.warm,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          background: BRAND.orange,
          boxShadow: '0 0 14px rgba(255,84,32,.8)',
          transform: `scale(${0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4))})`,
        }}
      />
      <span style={{clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{text}</span>
    </div>
  );
};

/** Small Arabic caption chip (e.g. a label on a chart). */
export const Chip: React.FC<{text: string; at: number; style?: React.CSSProperties; accent?: boolean}> = ({text, at, style, accent}) => {
  const t = useSec();
  const p = ramp(t, at, at + 0.45);
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        opacity: p,
        transform: `translateY(${(1 - p) * 10}px)`,
        padding: '8px 20px',
        borderRadius: 999,
        border: `1px solid ${accent ? 'rgba(255,84,32,.45)' : 'rgba(255,255,255,.14)'}`,
        background: accent ? BRAND.orangeDim : 'rgba(255,255,255,.05)',
        fontFamily: FONT.ar,
        fontWeight: 600,
        fontSize: 28,
        color: accent ? BRAND.orange : BRAND.warm,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </div>
  );
};
