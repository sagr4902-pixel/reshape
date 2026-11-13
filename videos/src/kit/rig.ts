import {add2, clamp, cw90, dir, len2, mul2, norm2, sub2, type V2} from './math';

/**
 * Side-view 2D character rig (faces +x). Angles are measured from "up", clockwise positive (screen space).
 * Limbs are either FK (absolute angles) or IK (target point + bend side) so hands/feet can stay planted.
 */
export type Props = {
  spine: number; neck: number; headR: number; upper: number; fore: number; handR: number;
  thigh: number; shin: number; foot: number;
  // limb radii [start, end]
  rUpper: V2; rFore: V2; rThigh: V2; rShin: V2; rNeck: V2;
  // torso half-widths (front, back) at stations along the spine
  torso: Array<[s: number, front: number, back: number]>;
  shoulderDrop: number;
};

export const ADULT: Props = {
  spine: 104, neck: 20, headR: 22, upper: 64, fore: 58, handR: 8.5,
  thigh: 90, shin: 88, foot: 27,
  rUpper: [11.5, 8.5], rFore: [8.5, 6.2], rThigh: [15.5, 10.5], rShin: [10.5, 6.8], rNeck: [8, 8],
  torso: [
    [-0.08, 15, 20], [0.0, 18, 24], [0.3, 16, 18], [0.55, 21, 20], [0.78, 25, 23], [0.93, 18, 18], [1.0, 9, 10],
  ],
  shoulderDrop: 10,
};

export const CHILD: Props = {
  spine: 66, neck: 11, headR: 20, upper: 38, fore: 34, handR: 6.5,
  thigh: 54, shin: 52, foot: 19,
  rUpper: [8, 6], rFore: [6, 5], rThigh: [10, 7.5], rShin: [7.5, 5.5], rNeck: [6, 6],
  torso: [
    [-0.08, 12, 14], [0.0, 14, 16], [0.35, 14, 14], [0.7, 15, 14], [0.92, 12, 12], [1.0, 7, 7],
  ],
  shoulderDrop: 7,
};

export type Limb = {ik: V2; bend: 1 | -1} | {fk: [number, number]};
export type PoseCtl = {
  pelvis: V2;
  torso: number; // spine angle (0 = upright)
  head?: number; // head tilt relative to spine
  aN: Limb; aF: Limb; // near / far arm
  lN: Limb; lF: Limb; // near / far leg
  footN?: number; footF?: number; // absolute foot angles (90° = pointing forward, flat)
};

export type Joints = {
  pelvis: V2; neckBase: V2; shoulder: V2; head: V2; torsoA: number; headA: number;
  elbowN: V2; handN: V2; elbowF: V2; handF: V2;
  kneeN: V2; ankleN: V2; kneeF: V2; ankleF: V2; toeN: V2; toeF: V2;
};

/** Two-bone IK. bend=+1 puts the middle joint on the clockwise side of root→target. */
export const ik2 = (root: V2, target: V2, l1: number, l2: number, bend: 1 | -1): [V2, V2] => {
  const v = sub2(target, root);
  const d = clamp(len2(v), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const u = norm2(v);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  const mid = add2(root, add2(mul2(u, l1 * cosA), mul2(cw90(u), bend * l1 * sinA)));
  return [mid, add2(root, mul2(u, d))];
};

const limb = (root: V2, c: Limb, l1: number, l2: number): [V2, V2] => {
  if ('ik' in c) return ik2(root, c.ik, l1, l2, c.bend);
  const mid = add2(root, mul2(dir(c.fk[0]), l1));
  return [mid, add2(mid, mul2(dir(c.fk[1]), l2))];
};

export const solve = (c: PoseCtl, P: Props): Joints => {
  const pelvis = c.pelvis;
  const a = dir(c.torso);
  const neckBase = add2(pelvis, mul2(a, P.spine));
  const shoulder = add2(pelvis, mul2(a, P.spine - P.shoulderDrop));
  const headA = c.torso + (c.head ?? 0);
  const head = add2(neckBase, mul2(dir(headA), P.neck + P.headR * 0.92));
  const [elbowN, handN] = limb(shoulder, c.aN, P.upper, P.fore);
  const [elbowF, handF] = limb(shoulder, c.aF, P.upper, P.fore);
  const [kneeN, ankleN] = limb(pelvis, c.lN, P.thigh, P.shin);
  const [kneeF, ankleF] = limb(pelvis, c.lF, P.thigh, P.shin);
  const toeN = add2(ankleN, mul2(dir(c.footN ?? Math.PI / 2), P.foot));
  const toeF = add2(ankleF, mul2(dir(c.footF ?? Math.PI / 2), P.foot));
  return {pelvis, neckBase, shoulder, head, torsoA: c.torso, headA, elbowN, handN, elbowF, handF, kneeN, ankleN, kneeF, ankleF, toeN, toeF};
};

/** Angle helpers for FK authoring in degrees. */
export const d2r = (deg: number) => (deg * Math.PI) / 180;
