import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, E, hash, lerp} from '../../kit/math';
import {C, FONT} from '../../kit/theme';

/** Warm light leak (CSS, deterministic): reveals then retracts over p 0→1. */
export const LightLeak: React.FC<{p: number; seed?: number; strength?: number}> = ({p, seed = 1, strength = 1}) => {
  if (p <= 0 || p >= 1) return null;
  const o = Math.sin(p * Math.PI) * strength;
  const x = lerp(-20 + hash(seed) * 30, 70 + hash(seed + 1) * 40, p), y = lerp(10 + hash(seed + 2) * 30, 60 + hash(seed + 3) * 30, p);
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', pointerEvents: 'none', opacity: o}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at ${x}% ${y}%, rgba(255,170,90,0.95) 0%, rgba(255,84,32,0.55) 35%, rgba(255,84,32,0) 70%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse 40% 60% at ${100 - x}% ${100 - y}%, rgba(255,214,140,0.7) 0%, rgba(255,120,60,0.25) 40%, rgba(0,0,0,0) 70%)`}} />
      <AbsoluteFill style={{background: `linear-gradient(${120 + seed * 25}deg, rgba(255,255,255,0) ${lerp(10, 60, p)}%, rgba(255,200,150,0.55) ${lerp(20, 70, p)}%, rgba(255,255,255,0) ${lerp(35, 85, p)}%)`}} />
    </AbsoluteFill>
  );
};

/** Short impact flash. */
export const Flash: React.FC<{f: number; at: number; color?: string; max?: number}> = ({f, at, color = '#FFF4EC', max = 0.75}) => {
  const d = f - at;
  if (d < 0 || d > 6) return null;
  return <AbsoluteFill style={{background: color, opacity: max * Math.exp(-d * 0.7), mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/** Scale punch on impact (returns a multiplier). */
export const punch = (f: number, at: number, amt = 0.08) => {
  const d = f - at;
  if (d < 0) return 1;
  return 1 + amt * Math.exp(-d * 0.35) * Math.cos(d * 0.55);
};

export const Scanlines: React.FC<{o: number; f: number}> = ({o, f}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: o, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)',
    transform: `translateY(${(f * 7) % 5}px)`}} />
);

/** Starburst rays (SVG). */
export const Starburst: React.FC<{p: number; x: number; y: number; color?: string; rays?: number; r0?: number; r1?: number}> = ({p, x, y, color = C.orange, rays = 16, r0 = 60, r1 = 520}) => {
  if (p <= 0 || p >= 1) return null;
  const e = E.outCubic(p);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: rays}, (_, i) => {
        const a = (i / rays) * Math.PI * 2 + (i % 2) * 0.12;
        const ra = lerp(r0, r1 * 0.55, e), rb = lerp(r0 + 40, r1 * (i % 2 ? 0.8 : 1), e);
        return <line key={i} x1={x + Math.cos(a) * ra} y1={y + Math.sin(a) * ra} x2={x + Math.cos(a) * rb} y2={y + Math.sin(a) * rb}
          stroke={color} strokeWidth={lerp(14, 2, e)} strokeLinecap="round" opacity={1 - e} />;
      })}
    </svg>
  );
};

/** Big punchline word(s): slam in with an offset print shadow and a brief chromatic split on impact. */
export const Punch: React.FC<{text: string; f: number; at: number; out?: number; size: number; x?: number; y: number; color?: string; shadow?: string; rot?: number}> = ({text, f, at, out = 1e9, size, x = 540, y, color = C.light, shadow = C.orange, rot = -3}) => {
  const d = f - at;
  if (d < -1 || f > out + 8) return null;
  const pin = E.outBack(clamp((d + 1) / 6));
  const po = E.inCubic(clamp((f - out) / 8));
  const chroma = Math.max(0, 1 - d / 5) * 12;
  const off = size * 0.045;
  const shadows = [`${off}px ${off}px 0 ${shadow}`];
  if (chroma > 0.5) shadows.push(`${-chroma}px 0 0 rgba(255,40,80,0.85)`, `${chroma}px 0 0 rgba(40,220,255,0.85)`);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${lerp(1.6, 1, pin) * (1 - po * 0.3)})`,
      fontFamily: FONT.display, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap', direction: 'rtl', lineHeight: 1.05,
      opacity: clamp(pin * 2) * (1 - po), textShadow: shadows.join(', ')}}>
      {text}
    </div>
  );
};

/** Liquid-glass pill (prompt 006): frosted body, top sheen, bright rim, soft lift shadow. */
export const GlassPill: React.FC<{text: string; p: number; x: number; y: number; size?: number; tint?: string; color?: string}> = ({text, p, x, y, size = 64, tint = 'rgba(255,255,255,0.14)', color = '#FFFFFF'}) => {
  if (p <= 0) return null;
  const e = E.outBack(clamp(p));
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, e)})`, opacity: clamp(p * 2)}}>
      <div style={{position: 'relative', padding: `${size * 0.28}px ${size * 0.7}px`, borderRadius: size, background: tint,
        backdropFilter: 'blur(16px) saturate(1.4)', WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        border: '2px solid rgba(255,255,255,0.45)', boxShadow: '0 18px 40px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.55), inset 0 -10px 24px rgba(255,255,255,0.08)',
        fontFamily: FONT.display, fontWeight: 800, fontSize: size, color, direction: 'rtl', whiteSpace: 'nowrap', lineHeight: 1.1, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: '48%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0))', borderRadius: `${size}px ${size}px 0 0`}} />
        <span style={{position: 'relative'}}>{text}</span>
      </div>
    </div>
  );
};

/** UI cursor (prompt 001): an arrow that can press. */
export const Cursor: React.FC<{x: number; y: number; press?: number; o?: number}> = ({x, y, press = 0, o = 1}) => (
  <svg width={80} height={90} style={{position: 'absolute', left: x - 8, top: y - 6, opacity: o, transform: `scale(${1 - press * 0.15})`, transformOrigin: '8px 6px', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.35))'}}>
    <path d="M8 6 L8 66 L24 52 L36 78 L48 72 L36 47 L58 47 Z" fill="#FFFFFF" stroke="#111" strokeWidth={4} strokeLinejoin="round" />
  </svg>
);

/** The orange ball (prompt 005) with a short motion trail. */
export const Ball: React.FC<{pos: (f: number) => [number, number]; f: number; r?: number; squash?: number}> = ({pos, f, r = 30, squash = 0}) => {
  const p = pos(f);
  const trail = [1, 2, 3, 4, 5].map((k) => pos(f - k * 0.8));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible'}}>
      {trail.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r={r * (1 - i * 0.15)} fill={C.orange} opacity={0.18 - i * 0.03} />)}
      <circle cx={p[0]} cy={p[1]} r={r * 1.8} fill={C.orange} opacity={0.18} />
      <ellipse cx={p[0]} cy={p[1]} rx={r * (1 + squash * 0.35)} ry={r * (1 - squash * 0.35)} fill={C.orange} />
      <circle cx={p[0] - r * 0.3} cy={p[1] - r * 0.35} r={r * 0.28} fill="#FFB08A" opacity={0.8} />
    </svg>
  );
};
