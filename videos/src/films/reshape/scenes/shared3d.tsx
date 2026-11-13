import React from 'react';
import {makeProjector, type Cam} from '../../../kit/cam3d';
import {catmull, kf, type V2, type V3} from '../../../kit/math';
import {C} from '../../../kit/theme';

/** Camera keyframes → projector. Keys: [frame, pos, target, fov?]. */
export const camAt = (f: number, keys: Array<[number, V3, V3, number?]>): Cam => {
  const pos = kf<V3>(f, keys.map(([fr, p]) => [fr, p] as [number, V3]));
  const target = kf<V3>(f, keys.map(([fr, , t]) => [fr, t] as [number, V3]));
  const fov = kf<number>(f, keys.map(([fr, , , fv]) => [fr, fv ?? 40] as [number, number]));
  return {pos, target, fov};
};

/** Dense 3D polyline from control points (Catmull-Rom). */
export const spline3 = (ctrl: V3[], n = 14) => catmull(ctrl, n) as V3[];

export const project = (pts: V3[], cam: Cam, wWorld: number, wMin = 2, wMax = 26) => {
  const pr = makeProjector(cam);
  const p2: V2[] = [];
  const w: number[] = [];
  for (const p of pts) {
    const q = pr(p);
    p2.push([q.x, q.y]);
    w.push(Math.max(wMin, Math.min(wMax, wWorld * q.s)));
  }
  return {p2, w};
};

/** Perspective floor grid at y=0. */
export const FloorGrid: React.FC<{cam: Cam; opacity: number; extent?: number; step?: number; center?: V3}> = ({cam, opacity, extent = 500, step = 50, center = [0, 0, 0]}) => {
  if (opacity <= 0.001) return null;
  const pr = makeProjector(cam);
  const lines: React.ReactNode[] = [];
  for (let k = -extent; k <= extent; k += step) {
    for (const axis of [0, 1]) {
      const a: V3 = axis === 0 ? [center[0] + k, 0, center[2] - extent] : [center[0] - extent, 0, center[2] + k];
      const b: V3 = axis === 0 ? [center[0] + k, 0, center[2] + extent] : [center[0] + extent, 0, center[2] + k];
      // split each line into segments so far parts can fade
      const N = 10;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N;
        const p0: V3 = [a[0] + (b[0] - a[0]) * t0, 0, a[2] + (b[2] - a[2]) * t0];
        const p1: V3 = [a[0] + (b[0] - a[0]) * t1, 0, a[2] + (b[2] - a[2]) * t1];
        const q0 = pr(p0), q1 = pr(p1);
        if (!q0.visible || !q1.visible) continue;
        const mid: V3 = [(p0[0] + p1[0]) / 2, 0, (p0[2] + p1[2]) / 2];
        const dist = Math.hypot(mid[0] - center[0], mid[2] - center[2]) / extent;
        const o = opacity * Math.max(0, 1 - dist * 1.1);
        if (o < 0.004) continue;
        lines.push(<line key={`${axis}_${k}_${i}`} x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke={C.light} strokeOpacity={o} strokeWidth={1.2} />);
      }
    }
  }
  return <g>{lines}</g>;
};

/** A projected cylinder (post / bar) with simple cylindrical shading. */
export const Tube: React.FC<{a: V3; b: V3; r: number; cam: Cam; id: string; color?: string; shade?: string; hi?: string; opacity?: number}> = ({a, b, r, cam, id, color = '#55565C', shade = '#1E1F22', hi = '#9C9EA6', opacity = 1}) => {
  const pr = makeProjector(cam);
  const qa = pr(a), qb = pr(b);
  if (!qa.visible || !qb.visible) return null;
  const dx = qb.x - qa.x, dy = qb.y - qa.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const ra = r * qa.s, rb = r * qb.s;
  const d = `M${qa.x + nx * ra} ${qa.y + ny * ra}L${qb.x + nx * rb} ${qb.y + ny * rb}A${rb} ${rb} 0 0 0 ${qb.x - nx * rb} ${qb.y - ny * rb}L${qa.x - nx * ra} ${qa.y - ny * ra}A${ra} ${ra} 0 0 0 ${qa.x + nx * ra} ${qa.y + ny * ra}Z`;
  const mx = (qa.x + qb.x) / 2, my = (qa.y + qb.y) / 2, rm = (ra + rb) / 2;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={mx + nx * rm} y1={my + ny * rm} x2={mx - nx * rm} y2={my - ny * rm}>
          <stop offset="0" stopColor={shade} />
          <stop offset="0.35" stopColor={hi} />
          <stop offset="0.55" stopColor={color} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </g>
  );
};

/** Cumulative 3D arc lengths. */
export const lengths3 = (pts: V3[]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  return L;
};

/** Sub-polyline of a 3D path between arc-length fractions (measured in 3D, so timing is camera-independent). */
export const sub3 = (pts: V3[], L: number[], a: number, b: number): V3[] => {
  const total = L[L.length - 1];
  const la = Math.max(0, Math.min(1, a)) * total, lb = Math.max(0, Math.min(1, b)) * total;
  if (lb - la < 0.01) return [];
  const at = (l: number): V3 => {
    let i = 1;
    while (i < L.length - 1 && L[i] < l) i++;
    const t = Math.max(0, Math.min(1, (l - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1])));
    const p = pts[i - 1], q = pts[i];
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  };
  const out: V3[] = [at(la)];
  for (let i = 0; i < pts.length; i++) if (L[i] > la && L[i] < lb) out.push(pts[i]);
  out.push(at(lb));
  return out;
};
