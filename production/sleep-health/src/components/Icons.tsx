import React from 'react';
import {BRAND} from '../brand';
import {rnd} from '../motion';

/* ---------- Brain: vector outline + neural network with travelling pulses ---------- */
const BRAIN_OUTLINE =
  'M200 62 C158 24 78 40 62 112 C18 124 14 196 56 220 C48 266 110 294 152 268 C172 302 232 302 252 268 C294 294 354 266 346 220 C388 196 384 124 340 112 C324 40 244 24 200 62 Z';
const GYRI = [
  'M200 62 C188 130 214 200 196 288',
  'M92 130 C120 150 150 118 170 150',
  'M100 212 C130 190 160 226 150 252',
  'M232 118 C262 100 296 134 318 118',
  'M240 212 C270 236 304 198 326 220',
  'M122 180 C96 196 118 240 100 244',
];
type Node = {x: number; y: number};
const NODES: Node[] = Array.from({length: 30}, (_, i) => {
  const a = rnd(i * 3 + 1) * Math.PI * 2;
  const r = Math.sqrt(rnd(i * 3 + 2));
  return {x: 200 + Math.cos(a) * r * 128, y: 166 + Math.sin(a) * r * 92};
});
const EDGES: Array<[number, number]> = [];
NODES.forEach((n, i) => {
  const d = NODES.map((m, j) => ({j, d: Math.hypot(m.x - n.x, m.y - n.y)}))
    .filter((o) => o.j !== i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  d.forEach((o) => {
    if (!EDGES.some(([a, b]) => (a === i && b === o.j) || (a === o.j && b === i))) EDGES.push([i, o.j]);
  });
});

/** energy 0..1 — lower energy = fewer, slower, dimmer pulses (metaphor, not a scan). */
export const Brain: React.FC<{t: number; energy: number; size?: number; reveal?: number}> = ({t, energy, size = 700, reveal = 1}) => {
  const len = 1400;
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 400 320" style={{overflow: 'visible'}}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bfill" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgba(255,84,32,0.16)" />
          <stop offset="100%" stopColor="rgba(255,84,32,0.02)" />
        </radialGradient>
      </defs>
      <path d={BRAIN_OUTLINE} fill="url(#bfill)" opacity={reveal * (0.4 + 0.6 * energy)} />
      <path
        d={BRAIN_OUTLINE}
        fill="none"
        stroke={BRAND.orange}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - reveal)}
        opacity={0.5 + 0.5 * energy}
        style={{filter: 'drop-shadow(0 0 10px rgba(255,84,32,.5))'}}
      />
      {GYRI.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,.22)" strokeWidth={1.6} strokeLinecap="round" strokeDasharray={300} strokeDashoffset={300 * (1 - Math.min(1, reveal * 1.3 - i * 0.05))} />
      ))}
      {EDGES.map(([a, b], i) => {
        const on = rnd(i * 7 + 3) < 0.25 + 0.75 * energy;
        return <line key={i} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} stroke="rgba(255,255,255,.14)" strokeWidth={1} opacity={reveal * (on ? 1 : 0.35)} />;
      })}
      {NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={2.6} fill="#fff" opacity={reveal * (0.25 + 0.55 * energy) * (0.6 + 0.4 * Math.sin(t * 2 + i))} />
      ))}
      {EDGES.map(([a, b], i) => {
        const active = rnd(i * 11 + 5) < 0.2 + 0.8 * energy;
        if (!active) return null;
        const period = 1.2 + rnd(i) * 1.4 + (1 - energy) * 2.2;
        const ph = ((t + rnd(i * 13) * period) % period) / period;
        const flicker = energy < 0.6 && rnd(i * 17) < 0.5 ? 0.5 + 0.5 * Math.sin(t * 9 + i) : 1;
        const x = NODES[a].x + (NODES[b].x - NODES[a].x) * ph;
        const y = NODES[a].y + (NODES[b].y - NODES[a].y) * ph;
        return <circle key={'p' + i} cx={x} cy={y} r={3.2} fill={BRAND.orange} filter="url(#glow)" opacity={reveal * flicker * (0.5 + 0.5 * energy) * Math.sin(ph * Math.PI)} />;
      })}
    </svg>
  );
};

/* ---------- Heart: anatomical-inspired icon with restrained orange glow ---------- */
const HEART =
  'M200 338 C118 276 40 214 40 132 C40 72 88 38 134 38 C166 38 190 58 200 84 C210 58 234 38 266 38 C312 38 360 72 360 132 C360 214 282 276 200 338 Z';
export const Heart: React.FC<{beat: number; size?: number; reveal?: number}> = ({beat, size = 420, reveal = 1}) => {
  const s = 1 + beat * 0.055;
  return (
    <svg width={size} height={size} viewBox="0 0 400 380" style={{overflow: 'visible'}}>
      <defs>
        <radialGradient id="hfill" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgba(255,84,32,0.55)" />
          <stop offset="60%" stopColor="rgba(255,84,32,0.18)" />
          <stop offset="100%" stopColor="rgba(255,84,32,0.05)" />
        </radialGradient>
      </defs>
      <g transform={`translate(200 200) scale(${s}) translate(-200 -200)`} opacity={reveal}>
        <path d={HEART} fill="url(#hfill)" style={{filter: `drop-shadow(0 0 ${30 + beat * 40}px rgba(255,84,32,${0.35 + beat * 0.4}))`}} />
        <path d={HEART} fill="none" stroke={BRAND.orange} strokeWidth={3} strokeDasharray={1200} strokeDashoffset={1200 * (1 - reveal)} />
        {/* vessels + inner contour (stylised, not anatomical claim) */}
        <path d="M214 76 C214 46 240 30 256 52" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={2.4} strokeLinecap="round" opacity={reveal} />
        <path d="M176 82 C170 52 142 44 134 64" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth={2.4} strokeLinecap="round" opacity={reveal} />
        <path d="M150 120 C190 150 230 200 250 290" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={2} strokeLinecap="round" opacity={reveal} />
        <path d="M250 110 C236 150 240 190 226 228" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={2} strokeLinecap="round" opacity={reveal} />
      </g>
    </svg>
  );
};

/* ---------- Shield (immune metaphor) ---------- */
export const Shield: React.FC<{size?: number; integrity: number; t: number; reveal?: number}> = ({size = 520, integrity, t, reveal = 1}) => (
  <svg width={size} height={size} viewBox="0 0 400 400" style={{overflow: 'visible'}}>
    {[1, 2, 3].map((k) => (
      <circle key={k} cx={200} cy={200} r={120 + k * 40} fill="none" stroke={BRAND.orange} strokeWidth={1} opacity={reveal * (0.04 + 0.1 * integrity) * (0.6 + 0.4 * Math.sin(t * 1.6 - k))} />
    ))}
    <path
      d="M200 48 L318 94 V190 C318 262 266 318 200 352 C134 318 82 262 82 190 V94 Z"
      fill={`rgba(255,84,32,${0.05 + 0.14 * integrity})`}
      stroke={BRAND.orange}
      strokeWidth={3}
      strokeDasharray={1000}
      strokeDashoffset={1000 * (1 - reveal)}
      opacity={0.45 + 0.55 * integrity}
      style={{filter: `drop-shadow(0 0 ${16 + 26 * integrity}px rgba(255,84,32,${0.25 + 0.4 * integrity}))`}}
    />
    <path d="M200 70 L298 108 V190 C298 250 254 298 200 328" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={1.5} opacity={reveal} />
    <path d="M158 196 L190 228 L248 164" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={160} strokeDashoffset={160 * (1 - reveal)} opacity={0.5 + 0.5 * integrity} />
  </svg>
);

export const Moon: React.FC<{size?: number; color?: string; style?: React.CSSProperties}> = ({size = 48, color = BRAND.orange, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <path d="M62 10 A42 42 0 1 0 90 62 A32 32 0 1 1 62 10 Z" fill={color} />
  </svg>
);

export const Cup: React.FC<{size?: number; p: number}> = ({size = 90, p}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
    <path d="M18 36 H70 V66 A18 18 0 0 1 52 84 H36 A18 18 0 0 1 18 66 Z" fill="none" stroke={BRAND.orange} strokeWidth={5} strokeLinejoin="round" />
    <path d="M70 44 H78 A10 10 0 0 1 78 66 H70" fill="none" stroke={BRAND.orange} strokeWidth={5} />
    {[32, 44, 56].map((x, i) => (
      <path key={i} d={`M${x} 26 C${x - 4} 20 ${x + 4} 14 ${x} 8`} fill="none" stroke={BRAND.warm} strokeWidth={3.5} strokeLinecap="round" opacity={0.7 * (1 - p)} />
    ))}
    <line x1={12} y1={90} x2={88} y2={14} stroke={BRAND.strong} strokeWidth={6} strokeLinecap="round" strokeDasharray={110} strokeDashoffset={110 * (1 - p)} />
  </svg>
);

export const Repeat: React.FC<{size?: number; p: number}> = ({size = 90, p}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
    <g transform={`rotate(${p * 360} 50 50)`}>
      <path d="M22 50 A28 28 0 0 1 72 32" fill="none" stroke={BRAND.orange} strokeWidth={6} strokeLinecap="round" />
      <path d="M78 50 A28 28 0 0 1 28 68" fill="none" stroke={BRAND.orange} strokeWidth={6} strokeLinecap="round" />
      <path d="M64 20 L76 32 L62 40" fill="none" stroke={BRAND.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 80 L24 68 L38 60" fill="none" stroke={BRAND.orange} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx={50} cy={50} r={7} fill={BRAND.strong} opacity={p} />
  </svg>
);

export const ClockIcon: React.FC<{size?: number; p: number}> = ({size = 90, p}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <circle cx={50} cy={50} r={38} fill="none" stroke={BRAND.orange} strokeWidth={5} />
    <line x1={50} y1={50} x2={50 + 22 * Math.sin((p * 270 * Math.PI) / 180)} y2={50 - 22 * Math.cos((p * 270 * Math.PI) / 180)} stroke={BRAND.strong} strokeWidth={5} strokeLinecap="round" />
    <line x1={50} y1={50} x2={50 + 14 * Math.sin((p * 60 * Math.PI) / 180)} y2={50 - 14 * Math.cos((p * 60 * Math.PI) / 180)} stroke={BRAND.warm} strokeWidth={5} strokeLinecap="round" />
    <circle cx={50} cy={50} r={3.5} fill={BRAND.orange} />
  </svg>
);
