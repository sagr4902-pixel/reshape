/** Pure, frame-deterministic helpers. Every value is a function of time — no state between frames. */
export type V2 = [number, number];
export type V3 = [number, number, number];

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const prog = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const mix2 = (a: V2, b: V2, t: number): V2 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add2 = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
export const sub2 = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
export const mul2 = (a: V2, s: number): V2 => [a[0] * s, a[1] * s];
export const len2 = (a: V2) => Math.hypot(a[0], a[1]);
export const norm2 = (a: V2): V2 => {
  const l = len2(a) || 1e-9;
  return [a[0] / l, a[1] / l];
};
/** Rotate 90° clockwise on screen (y down). */
export const cw90 = (a: V2): V2 => [-a[1], a[0]];
/** Direction for an angle measured from "up", clockwise positive, in screen space. */
export const dir = (a: number): V2 => [Math.sin(a), -Math.cos(a)];
export const angleOf = (v: V2) => Math.atan2(v[0], -v[1]);
export const DEG = Math.PI / 180;

export type Ease = (t: number) => number;
export const E = {
  linear: (t: number) => t,
  inSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outQuint: (t: number) => 1 - Math.pow(1 - t, 5),
  inOutQuint: (t: number) => (t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutExpo: (t: number) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  /** Small overshoot only. */
  outBack: (t: number) => {
    const s = 1.15;
    return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  },
};

/** Eased progress of frame f between a and b. */
export const seg = (f: number, a: number, b: number, ease: Ease = E.inOutCubic) => ease(prog(f, a, b));

/** Closed-form damped spring step response (0 → 1). t in seconds since the trigger. */
export const spring01 = (t: number, freq = 2.0, damping = 0.75) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  if (damping >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - damping * damping);
  return 1 - Math.exp(-damping * w * t) * (Math.cos(wd * t) + ((damping * w) / wd) * Math.sin(wd * t));
};

type KF<T> = [frame: number, value: T, ease?: Ease];
const lerpAny = (a: any, b: any, t: number): any => {
  if (typeof a === 'number') return lerp(a, b, t);
  if (Array.isArray(a)) return a.map((v, i) => lerpAny(v, b[i], t));
  if (a && typeof a === 'object') {
    const o: any = {};
    for (const k of Object.keys(a)) o[k] = k in b ? lerpAny(a[k], b[k], t) : a[k];
    return o;
  }
  return t < 0.5 ? a : b;
};
/** Piecewise keyframes; the ease on a key shapes the segment that ENDS at that key. */
export function kf<T>(f: number, keys: KF<T>[]): T {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, ease] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (f <= f1) return lerpAny(v0, v1, (ease ?? E.inOutCubic)((f - f0) / (f1 - f0)));
  }
  return keys[keys.length - 1][1];
}

/** Catmull-Rom spline through points (any dimension), sampled densely. */
export function catmull<T extends number[]>(pts: T[], samplesPerSeg = 16, closed = false): T[] {
  const n = pts.length;
  const out: T[] = [];
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let s = 0; s < samplesPerSeg; s++) {
      const t = s / samplesPerSeg, t2 = t * t, t3 = t2 * t;
      out.push(
        p1.map(
          (_, d) =>
            0.5 *
            (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3),
        ) as T,
      );
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

/** Cumulative arc lengths of a polyline. */
export const arcLengths = (pts: number[][]) => {
  const L = [0];
  for (let i = 1; i < pts.length; i++) {
    let d = 0;
    for (let k = 0; k < pts[i].length; k++) d += (pts[i][k] - pts[i - 1][k]) ** 2;
    L.push(L[i - 1] + Math.sqrt(d));
  }
  return L;
};

/** Sub-polyline between arc-length fractions a..b (0..1), with interpolated end points. */
export function subPolyline<T extends number[]>(pts: T[], a: number, b: number): T[] {
  if (pts.length < 2 || b <= a) return [];
  const L = arcLengths(pts);
  const total = L[L.length - 1];
  const la = a * total, lb = b * total;
  const at = (l: number): T => {
    let i = 1;
    while (i < L.length - 1 && L[i] < l) i++;
    const t = (l - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    return pts[i - 1].map((v, d) => v + (pts[i][d] - v) * clamp(t)) as T;
  };
  const out: T[] = [at(la)];
  for (let i = 0; i < pts.length; i++) if (L[i] > la && L[i] < lb) out.push(pts[i]);
  out.push(at(lb));
  return out;
}

/** Deterministic hash noise in [0,1). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
