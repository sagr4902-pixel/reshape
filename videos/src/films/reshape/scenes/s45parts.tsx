import React from 'react';
import {C, FONT} from '../../../kit/theme';
import {clamp, dir, E, hash, kf, lerp, mul2, seg, sub2, type V2} from '../../../kit/math';
import {ADULT, CHILD, d2r as A, solve, type Joints, type PoseCtl, type Props} from '../../../kit/rig';
import {coachGesture, hop, pullUp, squat, stand, storkBalance, walk} from '../../../kit/poses';
import {ContactShadow, Figure, OUTFITS, type Outfit} from '../../../kit/Figure';
import {LightPool, MotionPath, polyD} from '../../../kit/Path';

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
export const PATH_D = 0.3; // depth of the orange floor path (and of the main action)

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
  [922, ck(-345, 522, 1.28), E.inOutCubic],
  [950, ck(-335, 530, 1.22), E.inOutSine],
  [992, ck(-280, 536, 1.25), E.inOutSine],
  [1058, ck(-262, 540, 1.29), E.inOutSine],
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

/* ───────────────────────── facility composition ───────────────────────── */
export const Facility: React.FC<{f: number; uid: string}> = ({f, uid}) => {
  const cam = camAt(f);
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      {f >= 632 ? <Stage f={f} cam={cam} uid={uid} /> : null}
      <g transform={camT(cam)}>
        <RoomShell r={RA} camX={cam.x} st={ST_A} id={`${uid}A`} />
        <RoomShell r={RK} camX={cam.x} st={ST_K} id={`${uid}K`} />
        <Section />
      </g>
    </svg>
  );
};

export const S4Text: React.FC<{f: number}> = () => null;
export const S5Text: React.FC<{f: number}> = () => null;

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
