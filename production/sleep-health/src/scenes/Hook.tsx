import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND, FONT} from '../brand';
import {easeInOut, ramp, useSec} from '../motion';
import {Headline} from '../components/Text';
import {Brain} from '../components/Icons';

/** 00:00–05:12 — 3 AM. Someone is still awake. Then: a low-energy brain. */
export const Hook: React.FC = () => {
  const t = useSec();
  const show = ramp(t, 0, 0.6);
  const sweep = ramp(t, 0.05, 1.7, easeInOut); // minute hand sweep
  const minuteDeg = -720 + 720 * sweep; // two turns, lands on 12
  const hourDeg = 30 + 60 * sweep; // from ~1 o'clock to 3 o'clock
  const impact = ramp(t, 0.55, 1.5);
  const toBrain = ramp(t, 3.55, 4.4, easeInOut);
  const dialOp = (1 - toBrain) * show;
  const dialScale = 0.92 + 0.08 * show - 0.3 * toBrain;
  const breathe = 1 + Math.sin(t * 1.8) * 0.012;
  const cx = 540;
  const cy = 960;
  const R = 260;
  return (
    <AbsoluteFill>
      {/* glowing silhouette, still awake with a phone */}
      <svg
        width={1080}
        height={1920}
        style={{position: 'absolute', inset: 0, opacity: show * (1 - toBrain * 0.7)}}
      >
        <defs>
          <filter id="sil" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <linearGradient id="phone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(63,160,196,.55)" />
            <stop offset="100%" stopColor="rgba(63,160,196,0)" />
          </linearGradient>
        </defs>
        <g transform={`translate(540 1130) scale(${breathe})`}>
          <path
            d="M-230 290 C-230 120 -150 40 -70 20 C-100 -20 -110 -90 -70 -140 C-30 -190 30 -190 70 -140 C110 -90 100 -20 70 20 C150 40 230 120 230 290 Z"
            fill="rgba(255,84,32,.35)"
            filter="url(#sil)"
          />
          <path
            d="M-230 290 C-230 120 -150 40 -70 20 C-100 -20 -110 -90 -70 -140 C-30 -190 30 -190 70 -140 C110 -90 100 -20 70 20 C150 40 230 120 230 290 Z"
            fill="#121315"
            stroke="rgba(255,120,70,.55)"
            strokeWidth={2}
          />
          {/* open eyes (awake) */}
          <path d="M-42 -96 q14 -8 28 0" fill="none" stroke={BRAND.orange} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          <path d="M14 -96 q14 -8 28 0" fill="none" stroke={BRAND.orange} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
          {/* phone glow on the chest */}
          <rect x={-46} y={110} width={92} height={150} rx={14} fill="url(#phone)" opacity={0.7 + 0.3 * Math.sin(t * 3)} />
        </g>
      </svg>

      {/* orange impact pulse */}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: '3px solid rgba(255,84,32,.9)',
          transform: `translate(-50%,-50%) scale(${1 + impact * 160})`,
          opacity: (1 - impact) * 0.8,
        }}
      />

      {/* midnight clock */}
      <svg
        width={1080}
        height={1920}
        style={{position: 'absolute', inset: 0, opacity: dialOp, transform: `scale(${dialScale})`, transformOrigin: `${cx}px ${cy}px`}}
      >
        <circle cx={cx} cy={cy} r={R} fill="rgba(23,24,26,.93)" stroke="rgba(255,255,255,.16)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R - 18} fill="none" stroke="rgba(255,84,32,.25)" strokeWidth={1} />
        {Array.from({length: 60}, (_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = R - (major ? 40 : 30);
          const r2 = R - 22;
          return (
            <line
              key={i}
              x1={cx + Math.sin(a) * r1}
              y1={cy - Math.cos(a) * r1}
              x2={cx + Math.sin(a) * r2}
              y2={cy - Math.cos(a) * r2}
              stroke={major ? BRAND.warm : 'rgba(255,255,255,.3)'}
              strokeWidth={major ? 3 : 1.5}
              strokeLinecap="round"
            />
          );
        })}
        <line x1={cx} y1={cy} x2={cx + Math.sin((hourDeg * Math.PI) / 180) * 130} y2={cy - Math.cos((hourDeg * Math.PI) / 180) * 130} stroke={BRAND.strong} strokeWidth={10} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + Math.sin((minuteDeg * Math.PI) / 180) * 200} y2={cy - Math.cos((minuteDeg * Math.PI) / 180) * 200} stroke={BRAND.orange} strokeWidth={6} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 12px rgba(255,84,32,.7))'}} />
        <circle cx={cx} cy={cy} r={12} fill={BRAND.orange} />
        <circle cx={cx} cy={cy} r={5} fill={BRAND.ink} />
      </svg>
      <div
        dir="rtl"
        style={{
          position: 'absolute',
          top: 560,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: FONT.disp,
          fontWeight: 900,
          fontSize: 84,
          color: BRAND.strong,
          opacity: ramp(t, 1.2, 1.7) * (1 - toBrain),
          letterSpacing: '0.02em',
        }}
      >
        ٣:٠٠ <span style={{fontSize: 54, color: BRAND.warm, fontFamily: FONT.ar, fontWeight: 600}}>ص</span>
      </div>

      {/* low-energy brain reveal */}
      <div style={{position: 'absolute', left: 540, top: 980, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * toBrain})`, opacity: toBrain}}>
        <Brain t={t} energy={0.22} size={720} reveal={toBrain} />
      </div>

      <Headline text="تنام قليل… وتحسب أمورك تمام؟" at={0.55} top={280} size={92} emph={['تمام؟']} />
    </AbsoluteFill>
  );
};
