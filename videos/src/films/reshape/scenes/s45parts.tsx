import React from 'react';
import {C, FONT} from '../../../kit/theme';
import {clamp, dir, E, hash, kf, lerp, mul2, seg, sub2, type V2} from '../../../kit/math';
import {ADULT, CHILD, d2r as A, ik2, solve, type Joints, type PoseCtl, type Props} from '../../../kit/rig';
import {coachGesture, hop, pullUp, squat, stand, storkBalance, walk} from '../../../kit/poses';
import {ContactShadow, Figure, OUTFITS, type Outfit} from '../../../kit/Figure';
import {LightPool, MotionPath} from '../../../kit/Path';
import {wordAt} from '../timeline';

/**
 * Shared world for S4 (split → facility) and S5 (facility). Everything is a pure function of the absolute
 * film frame f, so S4's last frames and S5's first frames are the same drawing by construction.
 *
 * World = a 2-storey cutaway building in "front-plane" units. At zoom 1 with the camera centred on (540, 960)
 * the world maps 1:1 to the 1080×1920 frame (that is S4's split view: adults upstairs, kids downstairs).
 * Depth inside a room is a one-point projection toward a per-room vanishing point (x follows the camera).
 */

/* ───────────────────────── world geometry ───────────────────────── */
export const WX0 = -800, WX1 = 1100, WALL = 36;
export type Room = {ceil: number; floor: number};
export const RA: Room = {ceil: -40, floor: 850}; // adults (upper floor)
export const RK: Room = {ceil: 960, floor: 1780}; // kids (lower floor)
export const ROOF_TOP = -150, BASE_BOT = 1915;
export const BCX = (WX0 - WALL + WX1 + WALL) / 2, BCY = (ROOF_TOP + BASE_BOT) / 2;
const EYE = 400; // vanishing point height above each floor
const KB = 0.76; // scale of the back plane
export const kd = (d: number) => 1 - (1 - KB) * d;
/** Front-plane point (x, y) of a room pushed to depth d (0 = section cut, 1 = back wall). */
export const pr = (r: Room, camX: number, x: number, y: number, d: number): V2 => {
  const k = kd(d), vy = r.floor - EYE;
  return [camX + (x - camX) * k, vy + (y - vy) * k];
};
export const PATH_D = 0.2; // depth of the orange floor path (drawn in front of the action)
export const ACT_D = 0.3; // depth of the main action

/* ───────────────────────── camera ───────────────────────── */
export type Cam = {x: number; y: number; z: number};
type CK = [number, number, number];
const ck = (x: number, y: number, z: number): CK => [x, y, Math.log(z)];
const CAM_KEYS: Array<[number, CK, ((t: number) => number)?]> = [
  [596, ck(540, 960, 1)],
  [630, ck(540, 960, 1)],
  [700, ck(540, 930, 1.035), E.inOutSine],
  [728, ck(540, 990, 1.04), E.inOutCubic],
  [818, ck(540, 1002, 1.055), E.inOutSine],
  [874, ck(BCX, BCY - 6, 0.475), E.inOutCubic],
  [888, ck(BCX, BCY - 4, 0.468), E.outSine],
  // S5: push into the upper floor
  [922, ck(-300, 640, 1.55), E.inOutCubic],
  [950, ck(-292, 646, 1.5), E.inOutSine],
  [992, ck(-262, 650, 1.52), E.inOutSine],
  [1058, ck(-240, 652, 1.56), E.inOutSine],
  [1092, ck(BCX, BCY - 10, 0.338), E.inOutCubic],
  [1100, ck(BCX, BCY - 10, 0.334), E.outSine],
];
export const camAt = (f: number): Cam => {
  const k = kf<CK>(f, CAM_KEYS);
  return {x: k[0], y: k[1], z: Math.exp(k[2])};
};
export const toScreen = (c: Cam, p: V2): V2 => [(p[0] - c.x) * c.z + 540, (p[1] - c.y) * c.z + 960];
export const camT = (c: Cam) => `translate(540 960) scale(${c.z.toFixed(5)}) translate(${(-c.x).toFixed(3)} ${(-c.y).toFixed(3)})`;

/* ───────────────────────── small utils ───────────────────────── */
export const pts = (a: V2[]) => a.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
export const quad = (a: V2, b: V2, c: V2, d: V2) => pts([a, b, c, d]);
const ramp = (f: number, a: number, b: number) => clamp((f - a) / (b - a));
export const pulse = (f: number, a: number, b: number, c: number, d: number) => Math.min(ramp(f, a, b), 1 - ramp(f, c, d));

/** Joint-space blend (used to ease in/out of gaits without popping). */
export const mixJ = (a: Joints, b: Joints, t: number): Joints => {
  const o: Record<string, unknown> = {};
  for (const k of Object.keys(a) as Array<keyof Joints>) {
    const va = a[k] as number | V2, vb = b[k] as number | V2;
    o[k] = Array.isArray(va) ? [lerp(va[0], (vb as V2)[0], t), lerp(va[1], (vb as V2)[1], t)] : lerp(va, vb as number, t);
  }
  return o as Joints;
};
export const shiftJ = (j: Joints, dx: number, dy: number): Joints => {
  const o: Record<string, unknown> = {};
  for (const k of Object.keys(j) as Array<keyof Joints>) {
    const v = j[k] as number | V2;
    o[k] = Array.isArray(v) ? [v[0] + dx, v[1] + dy] : v;
  }
  return o as Joints;
};

/* ───────────────────────── text ───────────────────────── */
/** Arabic phrase: whole words, each revealed right→left at its own voice-over frame (same style as kit Word). */
export const Phrase: React.FC<{
  f: number; words: Array<{t: string; at: number; color?: string}>; outAt: number; size: number; x: number; y: number;
  color?: string; gap?: number; shadow?: boolean;
}> = ({f, words, outAt, size, x, y, color = C.light, gap = 0.28, shadow = true}) => {
  const oe = E.inCubic(clamp((f - outAt) / 11));
  if (oe >= 0.999 || f < words[0].at) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', display: 'flex', direction: 'rtl',
      gap: size * gap, whiteSpace: 'nowrap', pointerEvents: 'none'}}>
      {words.map((w, i) => {
        const pe = E.outCubic(clamp((f - w.at) / 15));
        return (
          <span key={i} style={{
            fontFamily: FONT.display, fontWeight: 800, fontSize: size, lineHeight: 1.15, color: w.color ?? color,
            display: 'inline-block', visibility: pe <= 0.001 ? 'hidden' : 'visible',
            opacity: Math.min(1, pe * 1.6) * (1 - oe),
            transform: `translateY(${(1 - pe) * 26 - oe * 22}px)`,
            filter: `blur(${(1 - pe) * 7 + oe * 6}px)`,
            clipPath: `inset(-30% 0 -30% ${(1 - pe) * 100}%)`,
            textShadow: shadow ? '0 6px 30px rgba(0,0,0,0.45)' : undefined,
          }}>{w.t}</span>
        );
      })}
    </div>
  );
};

/* ───────────────────────── rooms & building ───────────────────────── */
type RoomStyle = {wallTop: string; wallBot: string; floorBack: string; floorFront: string; ceil: string; side: string; lip: string; ao: string};
const ST_A: RoomStyle = {wallTop: '#202125', wallBot: '#36373C', floorBack: '#2B2C30', floorFront: '#3E3F44', ceil: '#18191C', side: '#1D1E21', lip: '#55565C', ao: '#000000'};
const ST_K: RoomStyle = {wallTop: '#EEE5DF', wallBot: '#DDD1C9', floorBack: '#C8BAB1', floorFront: '#DCCFC7', ceil: '#E4DAD3', side: '#D2C5BD', lip: '#F1E9E4', ao: '#6B5A50'};
const SECTION = '#141518';

const RoomShell: React.FC<{r: Room; camX: number; st: RoomStyle; id: string}> = ({r, camX, st, id}) => {
  const P = (x: number, y: number, d: number) => pr(r, camX, x, y, d);
  const fl = [P(WX0, r.floor, 0), P(WX1, r.floor, 0), P(WX1, r.floor, 1), P(WX0, r.floor, 1)];
  const ce = [P(WX0, r.ceil, 0), P(WX1, r.ceil, 0), P(WX1, r.ceil, 1), P(WX0, r.ceil, 1)];
  const bw = [P(WX0, r.ceil, 1), P(WX1, r.ceil, 1), P(WX1, r.floor, 1), P(WX0, r.floor, 1)];
  const lw = [P(WX0, r.ceil, 0), P(WX0, r.ceil, 1), P(WX0, r.floor, 1), P(WX0, r.floor, 0)];
  const rw = [P(WX1, r.ceil, 0), P(WX1, r.ceil, 1), P(WX1, r.floor, 1), P(WX1, r.floor, 0)];
  const yb0 = bw[0][1], yb1 = bw[2][1];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1={yb0} x2="0" y2={yb1} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={st.wallTop} />
          <stop offset="1" stopColor={st.wallBot} />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1={yb1} x2="0" y2={r.floor} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={st.floorBack} />
          <stop offset="1" stopColor={st.floorFront} />
        </linearGradient>
        <linearGradient id={`${id}ao`} x1="0" y1={yb1 - 90} x2="0" y2={yb1} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={st.ao} stopOpacity={0} />
          <stop offset="1" stopColor={st.ao} stopOpacity={0.22} />
        </linearGradient>
        <linearGradient id={`${id}c`} x1="0" y1={r.ceil} x2="0" y2={yb0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={st.ceil} />
          <stop offset="1" stopColor={st.wallTop} />
        </linearGradient>
      </defs>
      <polygon points={pts(bw)} fill={`url(#${id}w)`} />
      <rect x={bw[0][0]} y={yb1 - 90} width={bw[1][0] - bw[0][0]} height={90} fill={`url(#${id}ao)`} />
      <polygon points={pts(ce)} fill={`url(#${id}c)`} />
      <polygon points={pts(lw)} fill={st.side} />
      <polygon points={pts(rw)} fill={st.side} />
      <polygon points={pts(fl)} fill={`url(#${id}f)`} />
      <line x1={fl[3][0]} y1={fl[3][1]} x2={fl[2][0]} y2={fl[2][1]} stroke={st.ao} strokeOpacity={0.25} strokeWidth={2} />
    </g>
  );
};

/** The cut section of the building (roof, slab between floors, base, outer walls) — one even-odd shape. */
const Section: React.FC = () => {
  const ox0 = WX0 - WALL, ox1 = WX1 + WALL;
  const rect = (x0: number, y0: number, x1: number, y1: number) => `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
  const d = rect(ox0, ROOF_TOP, ox1, BASE_BOT) + rect(WX0, RA.ceil, WX1, RA.floor) + rect(WX0, RK.ceil, WX1, RK.floor);
  return (
    <g>
      <path d={d} fillRule="evenodd" fill={SECTION} />
      <path d={d} fillRule="evenodd" fill="none" stroke="#3A3B40" strokeWidth={2} />
      <line x1={WX0} x2={WX1} y1={RA.floor + 1.5} y2={RA.floor + 1.5} stroke={ST_A.lip} strokeWidth={3} />
      <line x1={WX0} x2={WX1} y1={RK.floor + 1.5} y2={RK.floor + 1.5} stroke="#8F8178" strokeWidth={3} />
    </g>
  );
};

/* ───────────────────────── facility (skeleton; detailed layers added below) ───────────────────────── */
export const Stage: React.FC<{f: number; cam: Cam; uid: string}> = ({cam, uid}) => {
  const c = toScreen(cam, [BCX, BCY]);
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}stg`} cx={c[0]} cy={c[1]} r={1150} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2A2B30" />
          <stop offset="0.55" stopColor="#1A1B1F" />
          <stop offset="1" stopColor={C.ink} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill={`url(#${uid}stg)`} />
    </g>
  );
};

/* ───────────────────────── poses & gaits ───────────────────────── */
const legLen = (P: Props) => P.thigh + P.shin;
const ankleY = (P: Props) => -(P.rShin[1] + 2.6);

/** Parallel-bar dip. Grip (bar top under the hands) at (0,0). d: 0 arms locked → 1 bottom (elbows back). */
export const dipPose = (d: number, P: Props = ADULT, sway = 0): PoseCtl => {
  const e = E.inOutSine(clamp(d));
  const sh: V2 = [lerp(-4, 30, e), lerp(-(P.upper + P.fore - 6), -70, e)];
  const torso = A(lerp(4, 24, e));
  const pelvis = sub2(sh, mul2(dir(torso), P.spine - P.shoulderDrop));
  const th = lerp(170, 160, e) + sway, sn = lerp(252, 244, e) + sway * 0.6;
  return {
    pelvis, torso, head: A(lerp(-2, -16, e)),
    aN: {ik: [0, -P.handR], bend: 1}, aF: {ik: [-2, -P.handR - 3], bend: 1},
    lN: {fk: [A(th), A(sn)]}, lF: {fk: [A(th + 5), A(sn + 6)]},
    footN: A(sn - 48), footF: A(sn - 44),
  };
};

/** Body x of a walk at phase ph (cycles) so the stance foot stays planted; 0 at ph = 0. Footfall m lands at m·step. */
export const walkX = (ph: number, P: Props, stride: number) => {
  const L = legLen(P), sS = Math.sin(A(stride)), step = 2 * L * sS;
  const n = Math.floor((ph - 0.25) * 2);
  const inner = L * Math.sin(A(stride) * Math.sin(ph * Math.PI * 2));
  const odd = ((n % 2) + 2) % 2 === 1;
  return n * step + L * sS + (odd ? inner : -inner) + (step - L * sS);
};
export const stepLen = (P: Props, stride: number) => 2 * legLen(P) * Math.sin(A(stride));

export type Gait = {stride?: number; hBase?: number; hurdles?: number[]; hurdleH?: number; armsOut?: number;
  beam?: [number, number, number]};
/** Planted-foot IK walk (rig space, facing +x, ground y = 0). Swing feet follow arcs that clear hurdles / step onto a beam. */
export const ikWalk = (ph: number, P: Props, o: Gait = {}): Joints => {
  const stride = o.stride ?? 18, L = legLen(P), step = stepLen(P, stride);
  const bx = walkX(ph, P, stride);
  const base = walk(ph, P, {stride});
  const arms = o.armsOut ? walk(ph, P, {stride, armsOut: true}) : base;
  const aw = o.armsOut ?? 0;
  const ay = ankleY(P);
  const surf = (x: number) => (o.beam && x >= o.beam[0] && x <= o.beam[1] ? o.beam[2] : 0);
  const m = Math.round(2 * ph);
  const u = clamp((ph - (m / 2 - 0.25)) / 0.5);
  const stanceX = m * step, from = (m - 1) * step, to = (m + 1) * step;
  const ue = E.inOutSine(u);
  let h = (o.hBase ?? 0.1 * L) * Math.sin(Math.PI * u);
  for (const hx of o.hurdles ?? []) if (hx > from && hx < to) h += ((o.hurdleH ?? 0) + 0.12 * L) * Math.pow(Math.sin(Math.PI * u), 0.55);
  const swingY = lerp(surf(from), surf(to), E.inOutSine(clamp((u - 0.15) / 0.7)));
  let lift = 0;
  if (o.beam) {
    const [b0, b1, bh] = o.beam;
    const sm = (a: number, b: number, x: number) => E.inOutSine(clamp((x - a) / (b - a)));
    lift = bh * sm(b0 - step * 0.5, b0 + step * 0.5, bx) * (1 - sm(b1 - step * 0.5, b1 + step * 0.5, bx));
  }
  const s = Math.sin(ph * Math.PI * 2);
  const pelvisY = ay - L * Math.cos(A(stride * Math.abs(s))) + 4 - lift;
  const stanceT: V2 = [stanceX, ay - surf(stanceX)];
  const swingT: V2 = [lerp(from, to, ue), ay - swingY - h];
  const nearStance = ((m % 2) + 2) % 2 === 1;
  const swingFoot = A(90 + 26 * Math.sin(Math.PI * u));
  const pose: PoseCtl = {
    pelvis: [bx, pelvisY], torso: base.torso, head: base.head,
    aN: aw > 0 ? lerpLimb(base.aN, arms.aN, aw) : base.aN, aF: aw > 0 ? lerpLimb(base.aF, arms.aF, aw) : base.aF,
    lN: {ik: nearStance ? stanceT : swingT, bend: -1}, lF: {ik: nearStance ? swingT : stanceT, bend: -1},
    footN: nearStance ? A(90) : swingFoot, footF: nearStance ? swingFoot : A(90),
  };
  return solve(pose, P);
};
const lerpLimb = (a: PoseCtl['aN'], b: PoseCtl['aN'], t: number): PoseCtl['aN'] =>
  'fk' in a && 'fk' in b ? {fk: [lerp(a.fk[0], b.fk[0], t), lerp(a.fk[1], b.fk[1], t)]} : t < 0.5 ? a : b;

/** Trapezoidal-velocity progress 0→1 (accelerates over fraction a, cruises, decelerates over a). */
export const trap = (f: number, f0: number, f1: number, a = 0.2) => {
  const t = clamp((f - f0) / (f1 - f0));
  const v = 1 / (1 - a);
  if (t < a) return (v * t * t) / (2 * a);
  if (t > 1 - a) return 1 - (v * (1 - t) * (1 - t)) / (2 * a);
  return v * (t - a / 2);
};

/** A walk from standing (ph 0) to standing (ph = phEnd, a multiple of 0.5) with joint-space ease in/out. */
export const walker = (ph: number, phEnd: number, P: Props, o: Gait, idleT: number): {j: Joints; bx: number} => {
  const stride = o.stride ?? 18;
  const bx = walkX(ph, P, stride);
  const w = E.inOutSine(Math.min(clamp(ph / 0.3), clamp((phEnd - ph) / 0.3)));
  const st = shiftJ(solve(stand(P, idleT), P), bx, 0);
  if (w >= 0.999) return {j: ikWalk(ph, P, o), bx};
  if (w <= 0.001) return {j: st, bx};
  return {j: mixJ(st, ikWalk(ph, P, o), w), bx};
};

/* ───────────────────────── actors (S4 cast; they keep living through S5 in the background) ───────────────────────── */
export type Actor = {
  key: string; j: Joints; P: Props; o: Outfit; room: Room; x: number; oy?: number; d: number; base: number;
  flip?: boolean; rim?: number; haze?: number; shadow?: number; dy?: number;
};
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Replace one arm with FK angles (deg, absolute) blended in by w. */
const armTo = (j: Joints, P: Props, which: 'N' | 'F', a1: number, a2: number, w: number): Joints => {
  if (w <= 0.001) return j;
  const el = [j.shoulder[0] + Math.sin(A(a1)) * P.upper, j.shoulder[1] - Math.cos(A(a1)) * P.upper] as V2;
  const ha = [el[0] + Math.sin(A(a2)) * P.fore, el[1] - Math.cos(A(a2)) * P.fore] as V2;
  const o = {...j};
  if (which === 'N') {
    o.elbowN = [lerp(j.elbowN[0], el[0], w), lerp(j.elbowN[1], el[1], w)];
    o.handN = [lerp(j.handN[0], ha[0], w), lerp(j.handN[1], ha[1], w)];
  } else {
    o.elbowF = [lerp(j.elbowF[0], el[0], w), lerp(j.elbowF[1], el[1], w)];
    o.handF = [lerp(j.handF[0], ha[0], w), lerp(j.handF[1], ha[1], w)];
  }
  return o;
};

// Upper floor stations (all at world x ≥ 300: the left part of the upper floor belongs to S5).
export const AD_S = 1.3; // adult figure scale (front plane)
export const DIP = {x0: 325, x1: 546, grip: 430, h: 292, d: 0.35, dn: 0.27, df: 0.43};
export const PULL = {x0: 664, x1: 976, grip: 820, h: 572, d: 0.72};
// Kids course (rig units along the child's walk, child faces −x; world x = KID_X0 − rig·KID_S)
export const KID_X0 = 1030, KID_S = 1.35, KID_STEP = stepLen(CHILD, 18);
export const HURDLES = [1.5 * KID_STEP, 3.5 * KID_STEP];
export const HURDLE_H = 26;
export const BEAM: [number, number, number] = [4.5 * KID_STEP, 6.5 * KID_STEP, 22];
export const HOP = 54;
export const RINGS = [7 * KID_STEP + HOP, 7 * KID_STEP + 2 * HOP, 7 * KID_STEP + 3 * HOP];
const COACH_X0 = 930, COACH_STEPS = 5;

const dipDepth = (f: number) => {
  const t = mod(f - 588, 46);
  if (t < 17) return E.inOutSine(t / 17);
  if (t < 21) return 1;
  if (t < 35) return 1 - E.inOutSine((t - 21) / 14);
  return 0;
};
const pullH = (f: number) => {
  const t = mod(f - 600, 62);
  if (t < 22) return E.inOutSine(t / 22);
  if (t < 28) return 1;
  if (t < 50) return 1 - E.inOutSine((t - 28) / 22);
  return 0;
};

/** Child: idle → hurdles + beam (planted IK walk) → three hops through the rings → high-five → idle.
 *  Returned joints include the forward travel (rig units), so the actor origin stays fixed at KID_X0. */
const childState = (f: number): {j: Joints; air: number} => {
  const t = f / 30;
  const P = CHILD;
  if (f < 676) {
    const b = pulse(f, 648, 656, 660, 668);
    return {j: solve(b > 0 ? squat(0.16 * E.inOutSine(b), P) : stand(P, t), P), air: 0};
  }
  if (f < 762) {
    const ph = 3.5 * trap(f, 676, 760, 0.14);
    const arms = clamp((ph - 2.0) / 0.4) * (1 - clamp((ph - 3.2) / 0.3));
    return {j: walker(ph, 3.5, P, {stride: 18, hurdles: HURDLES, hurdleH: HURDLE_H, beam: BEAM, armsOut: arms, hBase: 9}, t).j, air: 0};
  }
  const endWalk = 7 * KID_STEP;
  if (f < 801) {
    const i = Math.min(2, Math.floor((f - 762) / 13));
    const ph = clamp((f - 762 - i * 13) / 13);
    const h = hop(ph, P);
    return {j: shiftJ(solve(h.pose, P), endWalk + (i + h.dx) * HOP, h.dy), air: clamp(-h.dy / 20)};
  }
  const up = pulse(f, 800, 807, 818, 828);
  let j = solve(stand(P, t), P);
  j = armTo(j, P, 'F', -24, -10, E.inOutSine(up));
  const toes = E.inOutSine(pulse(f, 803, 808, 816, 822)) * 4;
  return {j: shiftJ(j, endWalk + 3 * HOP, -toes), air: 0};
};

/** Coach: points the way, walks alongside (arms out with the child on the beam), crouches for the high-five. */
const coachState = (f: number): Joints => {
  const t = f / 30 + 1.3;
  const P = ADULT;
  if (f < 654) return solve(coachGesture(E.inOutSine(pulse(f, 624, 636, 644, 654)), t, P), P);
  const end = COACH_STEPS / 2;
  if (f < 770) {
    const ph = end * trap(f, 654, 770, 0.12);
    const arms = 0.7 * E.inOutSine(pulse(f, 714, 724, 742, 752));
    let {j} = walker(ph, end, P, {stride: 16, armsOut: arms}, t);
    j = armTo(j, P, 'N', 84, 78, E.inOutSine(pulse(f, 668, 678, 694, 704)) * 0.9);
    return j;
  }
  const c = E.inOutSine(pulse(f, 798, 806, 820, 832));
  return shiftJ(solve(squat(0.16 * c, P), P), stepLen(P, 16) * COACH_STEPS, 0);
};
/** High-five: the coach's near hand meets the child's raised hand exactly (IK in the coach's rig space). */
const highFive = (coach: Actor, child: Actor, camX: number, f: number): Joints => {
  const c = E.inOutSine(pulse(f, 801, 808, 818, 830));
  if (c <= 0.001) return coach.j;
  const W = (a: Actor, p: V2): V2 => {
    const s = a.base * kd(a.d), o = pr(a.room, camX, a.x, a.oy ?? a.room.floor, a.d);
    return [o[0] + (a.flip ? -1 : 1) * p[0] * s, o[1] + p[1] * s];
  };
  const hw = W(child, child.j.handF);
  const s = coach.base * kd(coach.d), o = pr(coach.room, camX, coach.x, coach.room.floor, coach.d);
  const target: V2 = [((hw[0] - o[0]) / s) * (coach.flip ? -1 : 1), (hw[1] - o[1]) / s - 6];
  const [el, ha] = ik2(coach.j.shoulder, target, ADULT.upper, ADULT.fore, 1);
  return {...coach.j, elbowN: [lerp(coach.j.elbowN[0], el[0], c), lerp(coach.j.elbowN[1], el[1], c)],
    handN: [lerp(coach.j.handN[0], ha[0], c), lerp(coach.j.handN[1], ha[1], c)]};
};

export const actors = (f: number, camX: number): Actor[] => {
  const t = f / 30;
  const out: Actor[] = [];
  // upper floor
  const dd = dipDepth(f);
  out.push({key: 'dip', j: solve(dipPose(dd, ADULT, 3 * Math.sin(((f - 588) / 46) * Math.PI * 2 + 1.1)), ADULT), P: ADULT,
    o: OUTFITS.athlete, room: RA, x: DIP.grip, oy: RA.floor - DIP.h, d: DIP.d, base: AD_S, rim: 0.6, shadow: 0});
  out.push({key: 'pull', j: solve(pullUp(pullH(f), ADULT, 2.2 * Math.sin(((f - 600) / 62) * Math.PI * 2)), ADULT), P: ADULT,
    o: OUTFITS.athlete2, room: RA, x: PULL.grip, oy: RA.floor - PULL.h, d: PULL.d, base: AD_S, rim: 0.35, haze: 0.3, shadow: 0});
  // lower floor
  const ch = childState(f);
  out.push({key: 'child', j: ch.j, P: CHILD, o: OUTFITS.kidB, room: RK, x: KID_X0, d: ACT_D, base: KID_S,
    flip: true, shadow: 1 - 0.5 * ch.air});
  const coach: Actor = {key: 'coach', j: coachState(f), P: ADULT, o: OUTFITS.coach, room: RK, x: COACH_X0, d: 0.64, base: AD_S, flip: true, shadow: 1, haze: 0.07};
  coach.j = highFive(coach, out[out.length - 1], camX, f);
  out.push(coach);
  const sl = mod(f - 560, 132);
  const raise = E.inOutSine(pulse(sl, 0, 16, 104, 120));
  out.push({key: 'stork', j: solve(storkBalance(t + 4, CHILD, 0.25 + 0.75 * raise), CHILD), P: CHILD, o: OUTFITS.kidA, room: RK,
    x: 700, d: 0.86, base: KID_S, shadow: 0.8, haze: 0.2});
  return out;
};

/* ───────────────────────── equipment & lights ───────────────────────── */
const ln = (a: V2, b: V2, w: number, c: string, op = 1, cap: 'round' | 'butt' = 'round') => (
  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap={cap} opacity={op} />
);
const METAL = '#D3C7BF', METAL_HI = '#F2EBE6', POST = '#5D5E65', POST_D = '#3B3C42';

/** Parallel bars at one depth (posts + bar). */
const DipBar: React.FC<{camX: number; d: number; dim?: number}> = ({camX, d, dim = 1}) => {
  const P = (x: number, h: number, dd = d) => pr(RA, camX, x, RA.floor - h, dd);
  const k = kd(d), xa = DIP.x0 + 28, xb = DIP.x1 - 28;
  return (
    <g opacity={dim}>
      {ln(P(xa, 0), P(xa, DIP.h - 4), 14 * k, POST)}
      {ln(P(xb, 0), P(xb, DIP.h - 4), 14 * k, POST)}
      {ln(P(DIP.x0, DIP.h), P(DIP.x1, DIP.h), 12.5 * k, METAL)}
      {ln(add(P(DIP.x0 + 7, DIP.h), [0, -2.8 * k]), add(P(DIP.x1 - 7, DIP.h), [0, -2.8 * k]), 3.6 * k, METAL_HI, 0.8)}
    </g>
  );
};
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const DipBase: React.FC<{camX: number}> = ({camX}) => {
  const P = (x: number, d: number) => pr(RA, camX, x, RA.floor - 4, d);
  return (
    <g>
      {[DIP.x0 + 28, DIP.x1 - 28].map((x) => (
        <g key={x}>{ln(P(x, DIP.dn - 0.06), P(x, DIP.df + 0.06), 11, POST_D)}</g>
      ))}
    </g>
  );
};
const PullRig: React.FC<{camX: number}> = ({camX}) => {
  const d = PULL.d, k = kd(d);
  const P = (x: number, h: number, dd = d) => pr(RA, camX, x, RA.floor - h, dd);
  return (
    <g>
      {[PULL.x0, PULL.x1].map((x) => (
        <g key={x}>
          {ln(P(x, 3, d - 0.13), P(x, 3, d + 0.13), 12 * k, POST_D)}
          {ln(P(x, 0), P(x, PULL.h + 22), 16 * k, POST)}
        </g>
      ))}
      {ln(P(PULL.x0 - 10, PULL.h + 14), P(PULL.x1 + 10, PULL.h + 14), 15 * k, POST, 1, 'butt')}
      {ln(P(PULL.x0 + 36, PULL.h), P(PULL.x1 - 36, PULL.h), 10 * k, METAL)}
      {ln(P(PULL.x0 + 40, PULL.h + 2.5), P(PULL.x1 - 40, PULL.h + 2.5), 3 * k, METAL_HI, 0.8)}
    </g>
  );
};
/** Orange trace that runs from the floor path up and over a piece of equipment (lights it). */
const traceLines = (camX: number): Array<{pts: V2[]; at: number; dur: number}> => {
  const D = (x: number, h: number, d: number) => pr(RA, camX, x, RA.floor - h, d);
  const dip = (d: number): V2[] => [D(DIP.x0 + 28, 0, d), D(DIP.x0 + 28, DIP.h, d), D(DIP.x1 - 28, DIP.h, d), D(DIP.x1 - 28, 0, d)];
  return [
    {pts: dip(DIP.df), at: 663, dur: 16},
    {pts: dip(DIP.dn), at: 665, dur: 16},
    {pts: [D(PULL.x0, 0, PULL.d), D(PULL.x0, PULL.h + 14, PULL.d), D(PULL.x1, PULL.h + 14, PULL.d), D(PULL.x1, 0, PULL.d)], at: 671, dur: 20},
  ];
};

const Hurdle: React.FC<{camX: number; rx: number; part: 'far' | 'near'}> = ({camX, rx, part}) => {
  const x = KID_X0 - rx * KID_S, h = HURDLE_H * KID_S, q = KID_S;
  const P = (hh: number, d: number) => pr(RK, camX, x, RK.floor - hh, d);
  const d0 = part === 'far' ? 0.44 : 0.14, dm = ACT_D;
  const k = kd(d0);
  return (
    <g>
      {ln(add(P(0, d0), [-11 * k * q, 0]), add(P(0, d0), [11 * k * q, 0]), 4.5 * k * q, '#A8998F')}
      {ln(P(0, d0), P(h, d0), 6 * k * q, '#B9AAA0')}
      {ln(P(h, d0), P(h, dm), 7 * k * q, C.orange)}
    </g>
  );
};
const Beam: React.FC<{camX: number}> = ({camX}) => {
  const xa = KID_X0 - BEAM[1] * KID_S, xb = KID_X0 - BEAM[0] * KID_S, h = BEAM[2] * KID_S;
  const P = (x: number, hh: number, d: number) => pr(RK, camX, x, RK.floor - hh, d);
  const top = [P(xa, h, 0.25), P(xb, h, 0.25), P(xb, h, 0.35), P(xa, h, 0.35)];
  const front = [P(xa, h, 0.25), P(xb, h, 0.25), P(xb, 6, 0.25), P(xa, 6, 0.25)];
  return (
    <g>
      {[xa + 22, xb - 22].map((x) => <polygon key={x} points={quad(P(x - 10, 7, 0.22), P(x + 10, 7, 0.22), P(x + 14, 0, 0.22), P(x - 14, 0, 0.22))} fill="#A99B91" />)}
      <polygon points={pts(front)} fill="#CDBFB6" />
      <polygon points={pts(top)} fill="#F4EEEA" />
      {ln(front[0], front[1], 2.2, C.orange, 0.9, 'butt')}
    </g>
  );
};
const Rings: React.FC<{camX: number}> = ({camX}) => (
  <g>
    {RINGS.map((r) => {
      const c = pr(RK, camX, KID_X0 - r * KID_S, RK.floor, 0.26);
      const ry = (EYE * (kd(0.14) - kd(0.38))) / 2;
      return <ellipse key={r} cx={c[0]} cy={c[1]} rx={34 * KID_S * kd(0.26)} ry={ry} fill="none" stroke="#3B3C41" strokeOpacity={0.55} strokeWidth={4.5} />;
    })}
  </g>
);
/** Kids-floor back-wall details (left part, seen in the wide shot): wall bars and a soft mat. */
const KidsDecor: React.FC<{camX: number}> = ({camX}) => {
  const W = (x: number, h: number) => pr(RK, camX, x, RK.floor - h, 1);
  const rails = [-600, -540, -480, -420];
  return (
    <g>
      {rails.map((x) => <g key={x}>{ln(W(x, 0), W(x, 470), 7, '#C2B3A9')}</g>)}
      {Array.from({length: 9}, (_, i) => 40 + i * 50).map((h) => <g key={h}>{ln(W(-600, h), W(-420, h), 4, '#CBBDB4')}</g>)}
      <polygon points={quad(pr(RK, camX, -760, RK.floor, 0.45), pr(RK, camX, -300, RK.floor, 0.45), pr(RK, camX, -300, RK.floor, 0.85), pr(RK, camX, -760, RK.floor, 0.85))} fill="#BFB0A6" opacity={0.6} />
    </g>
  );
};
const Pendant: React.FC<{camX: number; x: number; e: number; uid: string}> = ({camX, x, e, uid}) => {
  const d = 0.5;
  const top = pr(RA, camX, x, RA.ceil, d), lamp = pr(RA, camX, x, RA.ceil + 150, d), k = kd(d);
  const fl = pr(RA, camX, x, RA.floor, 0.45);
  const id = `${uid}cone${x}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={lamp[1]} x2="0" y2={fl[1]} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF1E6" stopOpacity={0.16 * e} />
          <stop offset="1" stopColor="#FFF1E6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={pts([add(lamp, [-26 * k, 10]), add(lamp, [26 * k, 10]), add(fl, [190, 0]), add(fl, [-190, 0])])} fill={`url(#${id})`} />
      {ln(top, lamp, 2, '#3A3B40')}
      <polygon points={pts([add(lamp, [-10 * k, -4]), add(lamp, [10 * k, -4]), add(lamp, [30 * k, 14 * k]), add(lamp, [-30 * k, 14 * k])])} fill="#2A2B2F" />
      <ellipse cx={lamp[0]} cy={lamp[1] + 14 * k} rx={24 * k} ry={4 * k} fill="#FFE9D9" opacity={0.5 + 0.5 * e} />
      <LightPool x={fl[0]} y={fl[1]} rx={330} ry={46} color="#FFE6D6" opacity={0.17 * e} />
    </g>
  );
};

/* ───────────────────────── the orange path ───────────────────────── */
export const XC = 1040, PR = 46, UL = 108, KL_START = -300, KL_END = -700;
export const YU = RA.floor - EYE + EYE * kd(PATH_D), YK = RK.floor - EYE + EYE * kd(PATH_D);
const pxAt = (camX: number, x: number) => camX + (x - camX) * kd(PATH_D);
const arcPts = (c: V2, r: number, fn: (t: number) => V2, n = 10): V2[] =>
  Array.from({length: n + 1}, (_, i) => {
    const v = fn((i / n) * (Math.PI / 2));
    return [c[0] + r * v[0], c[1] + r * v[1]] as V2;
  });
const polyLen = (p: V2[]) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);

/** The single movement path through the building (projected coords for a camera x). */
export const onePath = (camX: number) => {
  const xl = pxAt(camX, UL), xc = pxAt(camX, XC), xk = pxAt(camX, KL_END);
  const top = arcPts([xc - PR, YU + PR], PR, (t) => [Math.sin(t), -Math.cos(t)]);
  const bot = arcPts([xc - PR, YK - PR], PR, (t) => [Math.cos(t), Math.sin(t)]);
  const ptsAll: V2[] = [[xl, YU], ...top, ...bot, [xk, YK]];
  const sCT0 = xc - PR - xl, sV0 = sCT0 + (Math.PI * PR) / 2, sV1 = sV0 + (YK - YU - 2 * PR), sCB1 = sV1 + (Math.PI * PR) / 2;
  const sK = (x: number) => sCB1 + (xc - PR - pxAt(camX, x));
  return {pts: ptsAll, total: polyLen(ptsAll), sCT0, sV0, sV1, sCB1, sK, sMeet: (sV0 + sV1) / 2};
};

/** Entry branches (S4 f596–632): one path drops from the top centre and forks into the two floor lines. */
const ENTRY = (() => {
  const xl = pxAt(540, UL), xc = pxAt(540, XC), xk = pxAt(540, KL_START);
  const bez = (p0: V2, p1: V2, p2: V2, p3: V2, n = 28): V2[] =>
    Array.from({length: n + 1}, (_, i) => {
      const t = i / n, u = 1 - t;
      return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]] as V2;
    });
  const stem: V2[] = [[540, -70], [540, 190]];
  const a: V2[] = [...stem, ...bez([540, 190], [540, 390], [xl - PR, 380], [xl - PR, 610]).slice(1),
    ...arcPts([xl, YU - PR], PR, (t) => [-Math.cos(t), Math.sin(t)]), [xc - PR, YU]];
  const b: V2[] = [...stem, ...bez([540, 190], [540, 390], [xc, 380], [xc, 610]).slice(1),
    ...arcPts([xc - PR, YK - PR], PR, (t) => [Math.cos(t), Math.sin(t)]), [xk, YK]];
  const la = polyLen(a), lb = polyLen(b);
  return {a, b, la, lb, fa: la - (xc - PR - xl), fb: lb - (xc - PR - xk), xl, xc};
})();
const ENTRY_A = [596, 616] as const, ENTRY_B = [596, 625] as const, TAIL = 620;
/** Path ribbon width in world units for a camera zoom (keeps ~10px on screen at zoom 1, thicker when pulled back). */
export const pathW = (z: number) => 10 / Math.pow(z, 0.55);

/** Reveal polygon for a room during the entry: it opens vertically around its floor line, following the branch head. */
const revealPoly = (open: (x: number) => number, yLine: number, up: number, down: number): string => {
  const xs = Array.from({length: 41}, (_, i) => -80 + i * 31);
  const topP = xs.map((x) => [x, yLine - open(x) * up] as V2);
  const botP = xs.slice().reverse().map((x) => [x, yLine + open(x) * down] as V2);
  return pts([...topP, ...botP]);
};
const entryOpen = (f: number) => {
  const hA = ENTRY.la * trap(f, ENTRY_A[0], ENTRY_A[1], 0.12) + Math.max(0, f - ENTRY_A[1] + 3) * 70;
  const hB = ENTRY.lb * trap(f, ENTRY_B[0], ENTRY_B[1], 0.12) + Math.max(0, f - ENTRY_B[1] + 3) * 70;
  const RAMP = 330;
  const sA = (x: number) => ENTRY.fa + Math.max(0, x - ENTRY.xl);
  const sB = (x: number) => ENTRY.fb + Math.max(0, ENTRY.xc - PR - x);
  const a = (x: number) => E.outCubic(clamp((hA - sA(x)) / RAMP));
  const b = (x: number) => E.outCubic(clamp((hB - sB(x)) / RAMP));
  const mean = (fn: (x: number) => number) => {
    let m = 0;
    for (let i = 0; i <= 10; i++) m += fn(i * 108);
    return E.outCubic(m / 11);
  };
  return {a, b, ma: mean(a), mb: mean(b)};
};

/* ───────────────────────── composition ───────────────────────── */
const hazeFilter = (id: string, h: number, rgb: [number, number, number]) => (
  <filter id={id} colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
    <feColorMatrix type="matrix" values={`${1 - h} 0 0 0 ${h * rgb[0]} 0 ${1 - h} 0 0 ${h * rgb[1]} 0 0 ${1 - h} 0 ${h * rgb[2]} 0 0 0 1 0`} />
  </filter>
);
const ActorFig: React.FC<{a: Actor; camX: number; uid: string}> = ({a, camX, uid}) => {
  const s = a.base * kd(a.d);
  const o = pr(a.room, camX, a.x, a.oy ?? a.room.floor, a.d);
  const sg = a.flip ? -1 : 1;
  const fl = pr(a.room, camX, a.x, a.room.floor, a.d);
  const footX = o[0] + (sg * s * (a.j.ankleN[0] + a.j.ankleF[0])) / 2;
  const dark = a.room === RA;
  const id = `${uid}hz_${a.key}`;
  const fig = (
    <Figure j={a.j} P={a.P} o={a.o} x={o[0]} y={o[1] + (a.dy ?? 0) * s} scale={s} flip={a.flip}
      rim={a.rim ? {color: C.orange, dx: 1.6, dy: 2.2, opacity: a.rim} : null} />
  );
  return (
    <g>
      {a.shadow ? <ContactShadow x={footX} y={fl[1]} w={(a.P === CHILD ? 96 : 124) * s} opacity={(dark ? 0.6 : 0.34) * a.shadow} /> : null}
      {a.haze ? (
        <>
          <defs>{hazeFilter(id, a.haze, dark ? [0.18, 0.184, 0.204] : [0.89, 0.847, 0.82])}</defs>
          <g filter={`url(#${id})`}>{fig}</g>
        </>
      ) : fig}
    </g>
  );
};

const emphA = (f: number) => kf(f, [[600, 1], [700, 1], [716, 0.6], [816, 0.6], [852, 0.92], [892, 1]]);
const emphK = (f: number) => kf(f, [[600, 0.66], [692, 0.66], [708, 1], [816, 1], [852, 0.92], [905, 0.72]]);
const traceAlpha = (f: number) => kf(f, [[686, 0.5], [712, 0.17], [818, 0.17], [850, 0.22]]);

const Trace: React.FC<{f: number; camX: number}> = ({f, camX}) => (
  <g>
    {traceLines(camX).map((t, i) => {
      const p = seg(f, t.at, t.at + t.dur, E.inOutSine);
      if (p <= 0) return null;
      const settle = p >= 1 ? traceAlpha(f) : 1;
      return <MotionPath key={i} pts={t.pts} to={p} width={2.2} glow={0.6} head={p < 1 ? 7 : 0} opacity={settle} />;
    })}
  </g>
);

const UpperRoom: React.FC<{f: number; cam: Cam; acts: Actor[]; uid: string}> = ({f, cam, acts, uid}) => {
  const cx = cam.x, e = emphA(f);
  const a = (k: string) => acts.find((q) => q.key === k)!;
  const wall = (x: number, h: number) => pr(RA, cx, x, RA.floor - h, 1);
  const pDip = wall(DIP.grip, 300), pPull = wall(PULL.grip, 330);
  return (
    <g>
      <RoomShell r={RA} camX={cx} st={ST_A} id={`${uid}A`} />
      <LightPool x={pDip[0]} y={pDip[1]} rx={310} ry={290} color="#9A8D85" opacity={0.2 * e} />
      <LightPool x={pPull[0]} y={pPull[1]} rx={270} ry={290} color="#9A8D85" opacity={0.15 * e} />
      <Pendant camX={cx} x={DIP.grip} e={e} uid={uid} />
      <Pendant camX={cx} x={PULL.grip} e={e * 0.85} uid={uid} />
      <PullRig camX={cx} />
      <ActorFig a={a('pull')} camX={cx} uid={uid} />
      <DipBase camX={cx} />
      <DipBar camX={cx} d={DIP.df} dim={0.82} />
      <ActorFig a={a('dip')} camX={cx} uid={uid} />
      <DipBar camX={cx} d={DIP.dn} />
      <Trace f={f} camX={cx} />
      <rect x={WX0} y={RA.ceil} width={WX1 - WX0} height={RA.floor - RA.ceil} fill="#000" opacity={(1 - e) * 0.55} />
    </g>
  );
};
const LowerRoom: React.FC<{f: number; cam: Cam; acts: Actor[]; uid: string}> = ({f, cam, acts, uid}) => {
  const cx = cam.x, e = emphK(f);
  const a = (k: string) => acts.find((q) => q.key === k)!;
  const wallC = pr(RK, cx, 560, RK.floor - 420, 1), floorC = pr(RK, cx, 520, RK.floor, 0.42);
  return (
    <g>
      <RoomShell r={RK} camX={cx} st={ST_K} id={`${uid}K`} />
      <polygon points={quad(pr(RK, cx, 420, RK.floor - 540, 1), pr(RK, cx, 1040, RK.floor - 540, 1), pr(RK, cx, 1040, RK.floor - 640, 1), pr(RK, cx, 420, RK.floor - 640, 1))} fill="#FBF8F6" opacity={0.9} />
      {[420, 544, 668, 792, 916, 1040].map((x) => <g key={x}>{ln(pr(RK, cx, x, RK.floor - 540, 1), pr(RK, cx, x, RK.floor - 640, 1), 5, '#DDD1C9')}</g>)}
      {ln(pr(RK, cx, 420, RK.floor - 540, 1), pr(RK, cx, 1040, RK.floor - 540, 1), 5, '#DDD1C9')}
      <polygon points={quad(pr(RK, cx, WX0, RK.floor - 150, 1), pr(RK, cx, WX1, RK.floor - 150, 1), pr(RK, cx, WX1, RK.floor, 1), pr(RK, cx, WX0, RK.floor, 1))} fill="#D6C9C0" opacity={0.75} />
      {ln(pr(RK, cx, WX0, RK.floor - 150, 1), pr(RK, cx, WX1, RK.floor - 150, 1), 3, '#EFE7E1')}
      <LightPool x={wallC[0]} y={wallC[1]} rx={760} ry={420} color="#FFFFFF" opacity={0.42 * e} />
      <LightPool x={floorC[0]} y={floorC[1]} rx={700} ry={70} color="#FFFFFF" opacity={0.4 * e} />
      <KidsDecor camX={cx} />
      <ActorFig a={a('stork')} camX={cx} uid={uid} />
      <ActorFig a={a('coach')} camX={cx} uid={uid} />
      <Rings camX={cx} />
      <Beam camX={cx} />
      {HURDLES.map((h) => <Hurdle key={h} camX={cx} rx={h} part="far" />)}
      <ActorFig a={a('child')} camX={cx} uid={uid} />
      <rect x={WX0} y={RK.ceil} width={WX1 - WX0} height={RK.floor - RK.ceil} fill="#1B1C20" opacity={(1 - e) * 0.5} />
    </g>
  );
};

/** The orange path: entry fork (f < 632), then the two floor lines, then the reconnected single path. */
const PathLayer: React.FC<{f: number; cam: Cam}> = ({f, cam}) => {
  const w = pathW(cam.z);
  if (f < 632) {
    const sA = ENTRY.la * trap(f, ENTRY_A[0], ENTRY_A[1], 0.12), sB = ENTRY.lb * trap(f, ENTRY_B[0], ENTRY_B[1], 0.12);
    const fromA = Math.min(Math.max(0, sA - TAIL), ENTRY.fa), fromB = Math.min(Math.max(0, sB - TAIL), ENTRY.fb);
    const tapA = 0.5 * clamp((ENTRY.fa - (sA - TAIL)) / 260), tapB = 0.5 * clamp((ENTRY.fb - (sB - TAIL)) / 260);
    const hA = 13 * (1 - clamp((f - ENTRY_A[1] + 2) / 8)), hB = 13 * (1 - clamp((f - ENTRY_B[1] + 2) / 8));
    return (
      <g>
        <MotionPath pts={ENTRY.b} from={fromB / ENTRY.lb} to={sB / ENTRY.lb} width={w} taper={tapB} head={hB} />
        <MotionPath pts={ENTRY.a} from={fromA / ENTRY.la} to={sA / ENTRY.la} width={w} taper={tapA} head={hA} />
      </g>
    );
  }
  const P = onePath(cam.x);
  const g = seg(f, 822, 846, E.inOutCubic);
  const uEnd = lerp(P.sCT0, P.sMeet, g), kStart = lerp(P.sCB1, P.sMeet, g);
  const kEnd = lerp(P.sK(KL_START), P.sK(KL_END), seg(f, 826, 862, E.inOutCubic));
  const F = (s: number) => s / P.total;
  const at = (s: number): V2 => {
    const q = P.pts; let acc = 0;
    for (let i = 1; i < q.length; i++) {
      const L = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
      if (acc + L >= s) { const t = (s - acc) / L; return [lerp(q[i - 1][0], q[i][0], t), lerp(q[i - 1][1], q[i][1], t)]; }
      acc += L;
    }
    return q[q.length - 1];
  };
  const moving = g > 0 && g < 1;
  const flash = Math.sin(Math.PI * clamp((f - 844) / 16));
  const meet = at(P.sMeet);
  const kp = at(kStart);
  // glints: adults' line lights the equipment, kids' line lights the course
  const gA = seg(f, 650, 668, E.inOutSine), gK = seg(f, 701, 731, E.inOutSine);
  return (
    <g>
      {g < 1 ? (
        <>
          <MotionPath pts={P.pts} from={0} to={F(uEnd)} width={w} head={moving ? 9 : 0} />
          <MotionPath pts={P.pts} from={F(kStart)} to={F(kEnd)} width={w} />
          {moving ? <circle cx={kp[0]} cy={kp[1]} r={9} fill="url(#hotDot)" /> : null}
        </>
      ) : (
        <MotionPath pts={P.pts} from={0} to={F(kEnd)} width={w} />
      )}
      {flash > 0 ? <circle cx={meet[0]} cy={meet[1]} r={10 + 26 * flash} fill="url(#hotDot)" opacity={0.85 * flash} /> : null}
      {gA > 0 && gA < 1 ? (
        <MotionPath pts={P.pts} from={F(Math.max(0, gA * P.sCT0 - 200))} to={F(gA * P.sCT0)} width={w * 1.5} taper={0.9} glow={0.9}
          color={C.orangeHot} head={8} opacity={Math.sin(Math.PI * gA)} />
      ) : null}
      {gK > 0 && gK < 1 ? (
        <MotionPath pts={P.pts} from={F(P.sCB1 + gK * (P.sK(KL_START) - P.sCB1) - 220)} to={F(P.sCB1 + gK * (P.sK(KL_START) - P.sCB1))}
          width={w * 1.5} taper={0.9} glow={0.9} color={C.orangeHot} head={8} opacity={Math.sin(Math.PI * gK)} />
      ) : null}
    </g>
  );
};

export const Facility: React.FC<{f: number; uid: string}> = ({f, uid}) => {
  const cam = camAt(f);
  const acts = actors(f, cam.x);
  const entry = f < 632;
  const op = entry ? entryOpen(f) : null;
  const dimX = E.inOutSine(clamp((f - 1058) / 32));
  const upper = <UpperRoom f={f} cam={cam} acts={acts} uid={uid} />;
  const lower = <LowerRoom f={f} cam={cam} acts={acts} uid={uid} />;
  const nearPosts = <g>{HURDLES.map((h) => <Hurdle key={h} camX={cam.x} rx={h} part="near" />)}</g>;
  const bw = WX1 - WX0 + 2 * WALL;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <GlowDefsLocal />
      {!entry ? <Stage f={f} cam={cam} uid={uid} /> : null}
      <g transform={camT(cam)}>
        {!entry ? <ContactShadow x={BCX} y={BASE_BOT + 6} w={bw * 1.08} h={46} opacity={0.75} /> : null}
        {entry && op ? (
          <>
            <defs>
              <clipPath id={`${uid}cA`}><polygon points={revealPoly(op.a, YU, YU + 220, 912 - YU)} /></clipPath>
              <clipPath id={`${uid}cK`}><polygon points={revealPoly(op.b, YK, YK - 900, 2000 - YK)} /></clipPath>
            </defs>
            <g clipPath={`url(#${uid}cA)`}>
              <g transform={`translate(0 ${YU}) scale(1 ${lerp(0.9, 1, op.ma)}) translate(0 ${-YU})`}>{upper}</g>
              <Section />
            </g>
            <g clipPath={`url(#${uid}cK)`}>
              <g transform={`translate(0 ${YK}) scale(1 ${lerp(0.9, 1, op.mb)}) translate(0 ${-YK})`}>{lower}</g>
              <Section />
            </g>
          </>
        ) : (
          <>
            {upper}
            {lower}
            <Section />
          </>
        )}
        {dimX > 0 ? <rect x={WX0 - WALL - 4} y={ROOF_TOP - 4} width={bw + 8} height={BASE_BOT - ROOF_TOP + 8} fill={C.ink} opacity={0.64 * dimX} /> : null}
        <PathLayer f={f} cam={cam} />
        {entry && op ? <g clipPath={`url(#${uid}cK)`}>{nearPosts}</g> : <g opacity={1 - 0.64 * dimX}>{nearPosts}</g>}
      </g>
    </svg>
  );
};
/** Same filters as kit GlowDefs (kept local so both scenes' SVGs carry identical definitions). */
const GlowDefsLocal: React.FC = () => (
  <defs>
    <filter id="glowM" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
    <radialGradient id="hotDot">
      <stop offset="0" stopColor="#FFF4EC" />
      <stop offset="0.25" stopColor={C.orangeHot} />
      <stop offset="0.6" stopColor={C.orange} stopOpacity="0.55" />
      <stop offset="1" stopColor={C.orange} stopOpacity="0" />
    </radialGradient>
  </defs>
);

export const S4Text: React.FC<{f: number}> = ({f}) => {
  const cam = camAt(f);
  const pA = toScreen(cam, [205, 470]), pK = toScreen(cam, [215, 1185]);
  return (
    <>
      <Phrase f={f} words={[{t: 'للكبار', at: wordAt('L4', 0)}]} outAt={812} size={92} x={pA[0]} y={pA[1]} />
      <Phrase f={f} words={[{t: 'للصغار', at: wordAt('L4', 5)}]} outAt={814} size={92} x={pK[0]} y={pK[1]} color={C.dark} shadow={false} />
    </>
  );
};
