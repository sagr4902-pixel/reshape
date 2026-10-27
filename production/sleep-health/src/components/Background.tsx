import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from '../brand';
import {useSec} from '../motion';

export const Background: React.FC<{glow?: number; dark?: boolean}> = ({glow = 1, dark = false}) => {
  const t = useSec();
  const x1 = 50 + Math.sin(t * 0.21) * 14;
  const y1 = 38 + Math.cos(t * 0.17) * 10;
  const x2 = 50 + Math.cos(t * 0.13) * 20;
  const y2 = 78 + Math.sin(t * 0.11) * 8;
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: dark
            ? `radial-gradient(120% 70% at 50% 0%, #141517, ${BRAND.deep} 62%)`
            : `radial-gradient(120% 70% at 50% 0%, #1D1F23, ${BRAND.ink} 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 26% at ${x1}% ${y1}%, rgba(255,84,32,${0.13 * glow}), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 30% at ${x2}% ${y2}%, rgba(63,160,196,${0.05 * glow}), transparent 70%)`,
        }}
      />
      {/* brand streaks (from the site's promo language) */}
      {[190, 1690].map((top, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top,
            left: '-50%',
            width: '200%',
            height: 2,
            opacity: i === 0 ? 0.55 : 0.3,
            background:
              'linear-gradient(90deg, transparent, rgba(255,84,32,.45), transparent)',
            transform: `rotate(-24deg) translateX(${Math.sin(t * 0.3 + i) * 40}px)`,
          }}
        />
      ))}
      {/* grain / texture */}
      <AbsoluteFill
        style={{
          opacity: 0.045,
          backgroundImage:
            'repeating-linear-gradient(115deg, #fff 0 1px, transparent 1px 5px)',
        }}
      />
      {/* vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(80% 60% at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};
