import React, {useId} from 'react';
import {add2, clamp, cw90, mul2, norm2, sub2, subPolyline, type V2} from './math';
import {C} from './theme';

const f = (n: number) => n.toFixed(1);
export const polyD = (pts: V2[]) => (pts.length ? 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') : '');

/** Filled ribbon with per-point width (lets a stroke taper and swell). */
export const ribbonD = (pts: V2[], width: (t: number, i: number) => number) => {
  const n = pts.length;
  if (n < 2) return '';
  const left: V2[] = [], right: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const t = norm2(sub2(b, a));
    const nn = cw90(t);
    const w = width(i / (n - 1), i) / 2;
    left.push(add2(pts[i], mul2(nn, w)));
    right.push(add2(pts[i], mul2(nn, -w)));
  }
  const w0 = width(0, 0) / 2, w1 = width(1, n - 1) / 2;
  return (
    'M' + left.map((p) => `${f(p[0])} ${f(p[1])}`).join('L') +
    `A${f(w1)} ${f(w1)} 0 0 1 ${f(right[n - 1][0])} ${f(right[n - 1][1])}` +
    'L' + right.reverse().map((p) => `${f(p[0])} ${f(p[1])}`).join('L') +
    `A${f(w0)} ${f(w0)} 0 0 1 ${f(left[0][0])} ${f(left[0][1])}Z`
  );
};

/** Shared glow filters. Put once inside each <svg>. */
export const GlowDefs: React.FC = () => (
  <defs>
    <filter id="glowS" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="5" />
    </filter>
    <filter id="glowM" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
    <filter id="glowL" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="34" />
    </filter>
    <radialGradient id="hotDot">
      <stop offset="0" stopColor="#FFF4EC" />
      <stop offset="0.25" stopColor={C.orangeHot} />
      <stop offset="0.6" stopColor={C.orange} stopOpacity="0.55" />
      <stop offset="1" stopColor={C.orange} stopOpacity="0" />
    </radialGradient>
  </defs>
);

/**
 * The RESHAPE motion path: draws the window [from, to] (arc-length fractions) of a polyline,
 * with an optional tapered comet tail, a soft bloom and a hot leading point.
 */
export const MotionPath: React.FC<{
  pts: V2[]; from?: number; to: number; width?: number; taper?: number; color?: string; glow?: number;
  head?: number; opacity?: number; widthAt?: (t: number) => number;
}> = ({pts, from = 0, to, width = 12, taper = 0, color = C.orange, glow = 0.55, head = 0, opacity = 1, widthAt}) => {
  const a = clamp(from), b = clamp(to);
  if (b - a < 0.0005 || pts.length < 2) return null;
  const sub = subPolyline(pts, a, b);
  if (sub.length < 2) return null;
  const wfn = (t: number) => {
    const base = widthAt ? widthAt(a + (b - a) * t) : width;
    const tail = taper > 0 ? clamp(t / taper) : 1;
    return Math.max(0.6, base * (0.15 + 0.85 * Math.sqrt(tail)));
  };
  const d = ribbonD(sub, (t) => wfn(t));
  const tip = sub[sub.length - 1];
  return (
    <g opacity={opacity}>
      {glow > 0 ? <path d={d} fill={color} opacity={glow} filter="url(#glowM)" /> : null}
      <path d={d} fill={color} />
      <path d={ribbonD(sub, (t) => wfn(t) * 0.32)} fill={C.orangeHot} opacity={0.75} />
      {head > 0 ? (
        <circle cx={tip[0]} cy={tip[1]} r={head} fill="url(#hotDot)" />
      ) : null}
    </g>
  );
};

/** A soft light pool (radial gradient), used for cinematic key/fill lights. */
export const LightPool: React.FC<{x: number; y: number; rx: number; ry: number; color: string; opacity: number}> = ({x, y, rx, ry, color, opacity}) => {
  const id = useId().replace(/[:«»]/g, '');
  return (
    <g>
      <defs>
        <radialGradient id={`lp${id}`}>
          <stop offset="0" stopColor={color} stopOpacity={opacity} />
          <stop offset="0.55" stopColor={color} stopOpacity={opacity * 0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={`url(#lp${id})`} />
    </g>
  );
};

/** Variable-width path window (per-point widths), e.g. a 3D path whose width follows perspective. */
export const MotionPathW: React.FC<{
  pts: V2[]; widths: number[]; from?: number; to: number; taper?: number; color?: string; glow?: number; head?: number; opacity?: number; core?: number;
}> = ({pts, widths, from = 0, to, taper = 0, color = C.orange, glow = 0.55, head = 0, opacity = 1, core = 0.75}) => {
  const a = clamp(from), b = clamp(to);
  if (b - a < 0.0005 || pts.length < 2) return null;
  // carry widths along as a 3rd coordinate so the sub-window interpolates them
  const withW = pts.map((p, i) => [p[0], p[1], widths[i]] as [number, number, number]);
  // arc length must ignore the width channel: compute on 2D then map
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1] || 1;
  const la = a * total, lb = b * total;
  const at = (l: number) => {
    let i = 1;
    while (i < L.length - 1 && L[i] < l) i++;
    const t = clamp((l - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]));
    return withW[i - 1].map((v, d) => v + (withW[i][d] - v) * t) as [number, number, number];
  };
  const sub: Array<[number, number, number]> = [at(la)];
  for (let i = 0; i < pts.length; i++) if (L[i] > la && L[i] < lb) sub.push(withW[i]);
  sub.push(at(lb));
  const p2 = sub.map((p) => [p[0], p[1]] as V2);
  const wf = (t: number, i: number) => {
    const tail = taper > 0 ? clamp(t / taper) : 1;
    return Math.max(0.6, sub[i][2] * (0.15 + 0.85 * Math.sqrt(tail)));
  };
  const d = ribbonD(p2, wf);
  const tip = p2[p2.length - 1];
  return (
    <g opacity={opacity}>
      {glow > 0 ? <path d={d} fill={color} opacity={glow} filter="url(#glowM)" /> : null}
      <path d={d} fill={color} />
      {core > 0 ? <path d={ribbonD(p2, (t, i) => wf(t, i) * 0.32)} fill={C.orangeHot} opacity={core} /> : null}
      {head > 0 ? <circle cx={tip[0]} cy={tip[1]} r={head} fill="url(#hotDot)" /> : null}
    </g>
  );
};
