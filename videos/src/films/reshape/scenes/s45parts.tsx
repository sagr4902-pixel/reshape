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
