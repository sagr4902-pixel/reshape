import {clamp, dir, E, lerp, mul2, sub2, type V2} from './math';
import {ADULT, d2r as A, type PoseCtl, type Props} from './rig';

/**
 * Exercise pose library. Rig space: y down, ground at y = 0 unless stated, facing +x.
 * Every function is a pure function of its phase/time arguments.
 */
const ankleY = (P: Props) => -(P.rShin[1] + 2.6);
const legLen = (P: Props) => P.thigh + P.shin;
const armLen = (P: Props) => P.upper + P.fore;
const sd = (P: Props) => P.spine - P.shoulderDrop;
const lerpA = (a: number, b: number, t: number) => A(lerp(a, b, t));

export const stand = (P: Props = ADULT, t = 0): PoseCtl => {
  const b = Math.sin(t * 2.1);
  return {
    pelvis: [0, ankleY(P) - legLen(P) + 3 + b * 0.6],
    torso: A(2 + b * 0.4), head: A(-1),
    aN: {fk: [A(174 + b * 0.8), A(164)]}, aF: {fk: [A(186), A(174)]},
    lN: {ik: [7, ankleY(P)], bend: -1}, lF: {ik: [-9, ankleY(P)], bend: -1},
  };
};

/** Air squat, d: 0 standing → 1 bottom (thighs parallel). */
export const squat = (d: number, P: Props = ADULT): PoseCtl => {
  const L = legLen(P), ay = ankleY(P);
  return {
    pelvis: [lerp(0, -0.27 * L, d), lerp(ay - L + 3, ay - 0.53 * L, d)],
    torso: lerpA(2, 40, d), head: lerpA(-1, -26, d),
    aN: {fk: [lerpA(174, 94, d), lerpA(164, 90, d)]}, aF: {fk: [lerpA(186, 98, d), lerpA(174, 94, d)]},
    lN: {ik: [7, ay], bend: -1}, lF: {ik: [-9, ay], bend: -1},
  };
};

/** Pull-up. Grip point at (0,0). h: 0 dead hang → 1 chin over bar. */
export const pullUp = (h: number, P: Props = ADULT, swing = 0, tuck = 0): PoseCtl => {
  const arm = armLen(P);
  const he = E.inOutSine(clamp(h));
  const sh: V2 = [lerp(-5, -28, he), lerp(arm - 3, 30, he)];
  const torso = A(lerp(-3, -15, he) + swing);
  const pelvis = sub2(sh, mul2(dir(torso), sd(P)));
  const legA = lerp(176, 164, he) + swing * 0.6;
  return {
    pelvis, torso, head: lerpA(2, -8, he),
    aN: {ik: [5, 0], bend: 1}, aF: {ik: [-5, 0], bend: 1},
    lN: {fk: [A(legA - tuck * 60), A(legA + 8 + tuck * 40)]}, lF: {fk: [A(legA + 5 - tuck * 55), A(legA + 13 + tuck * 45)]},
    footN: A(150), footF: A(155),
  };
};

/** Push-up. Hands planted at (0,0) on the floor. d: 0 top → 1 bottom. */
export const pushUp = (d: number, P: Props = ADULT): PoseCtl => {
  const hand: V2 = [0, -P.handR];
  const sh: V2 = [lerp(2, 16, d), lerp(-P.handR - armLen(P) + 0.5, -P.handR - 40, E.inOutSine(d))];
  const bodyLen = legLen(P) + sd(P);
  const ankle = -12;
  const theta = Math.asin(clamp((ankle - sh[1]) / bodyLen, -1, 1));
  const torso = A(90) - theta;
  const pelvis = sub2(sh, mul2(dir(torso), sd(P)));
  const legA = torso + Math.PI;
  return {
    pelvis, torso, head: A(-4),
    aN: {ik: hand, bend: 1}, aF: {ik: [hand[0] - 5, hand[1]], bend: 1},
    lN: {fk: [legA - A(1), legA]}, lF: {fk: [legA + A(1), legA + A(2)]},
    footN: legA - A(82), footF: legA - A(80),
  };
};

/**
 * Crow → handstand press. Hands planted at (0,0). k: 0 crow, 1 tuck, 2 straddle-ish, 3 handstand.
 * sway: small balance correction in degrees.
 */
export const pressHandstand = (k: number, P: Props = ADULT, sway = 0): PoseCtl => {
  const hand: V2 = [0, -P.handR];
  // torso angle, hip flexion, knee flexion (thigh = torso + 180 - hip, shin = thigh + knee)
  const keys: Array<{arm: number; reach: number; torso: number; hip: number; knee: number; head: number}> = [
    {arm: 26, reach: 0.86, torso: 108, hip: 156, knee: 150, head: -26}, // crow
    {arm: 12, reach: 0.97, torso: 150, hip: 140, knee: 140, head: -16}, // hips rising, tucked
    {arm: 3, reach: 0.995, torso: 179, hip: 95, knee: 118, head: -8}, // tuck handstand
    {arm: 0, reach: 1, torso: 180, hip: 0, knee: 0, head: -6}, // handstand
  ];
  const i = clamp(Math.floor(k), 0, 2);
  const t = E.inOutSine(clamp(k - i));
  const a = keys[i], b = keys[i + 1];
  const g = (x: keyof typeof a) => lerp(a[x], b[x], t);
  const armA = A(g('arm') + sway * 0.6);
  const sh: V2 = [hand[0] + Math.sin(armA) * armLen(P) * g('reach'), hand[1] - Math.cos(armA) * armLen(P) * g('reach')];
  const torsoDeg = g('torso') + sway;
  const torso = A(torsoDeg);
  const pelvis = sub2(sh, mul2(dir(torso), sd(P)));
  const thigh = torsoDeg + 180 - g('hip') + sway * 0.8;
  const shin = thigh + g('knee');
  return {
    pelvis, torso, head: A(g('head')),
    aN: {ik: hand, bend: 1}, aF: {ik: [hand[0] - 6, hand[1]], bend: 1},
    lN: {fk: [A(thigh), A(shin)]},
    lF: {fk: [A(thigh + 3), A(shin + 5)]},
    footN: A(shin + 25), footF: A(shin + 28),
  };
};

/** Front lever progression on a bar. Grip at (0,0). s: 0 tuck, 1 advanced tuck, 2 one leg, 3 full lever. */
export const frontLever = (s: number, P: Props = ADULT, hang = 0): PoseCtl => {
  const keys = [
    {thighN: -40, shinN: 105, thighF: -36, shinF: 108},
    {thighN: 10, shinN: 115, thighF: 14, shinF: 118},
    {thighN: 90, shinN: 90, thighF: 18, shinF: 120},
    {thighN: 90, shinN: 90, thighF: 92, shinF: 92},
  ];
  const i = clamp(Math.floor(s), 0, 2);
  const t = E.inOutSine(clamp(s - i));
  const a = keys[i], b = keys[i + 1];
  const g = (x: keyof typeof a) => lerp(a[x], b[x], t);
  const armA = A(lerp(204, 180, hang));
  const sh: V2 = [Math.sin(armA) * armLen(P), -Math.cos(armA) * armLen(P)];
  const torso = A(lerp(-90, -8, hang));
  const pelvis = sub2(sh, mul2(dir(torso), sd(P)));
  return {
    pelvis, torso, head: lerpA(10, 0, hang),
    aN: {ik: [4, 0], bend: 1}, aF: {ik: [-4, 0], bend: 1},
    lN: {fk: [A(g('thighN')), A(g('shinN'))]}, lF: {fk: [A(g('thighF')), A(g('shinF'))]},
    footN: A(g('shinN') + 70), footF: A(g('shinF') + 70),
  };
};

/** Generic walk / step cycle. ph in cycles. lift raises the knee (hurdle steps). */
export const walk = (ph: number, P: Props = ADULT, o: {stride?: number; lift?: number; arms?: number; armsOut?: boolean} = {}): PoseCtl => {
  const stride = o.stride ?? 24, lift = o.lift ?? 1, arms = o.arms ?? 20;
  const w = ph * Math.PI * 2;
  const s = Math.sin(w), c = Math.cos(w);
  const L = legLen(P);
  const tN = 180 - stride * s, tF = 180 + stride * s;
  const fN = Math.pow(Math.max(0, c), 1.4) * 62 * lift, fF = Math.pow(Math.max(0, -c), 1.4) * 62 * lift;
  const liftN = Math.pow(Math.max(0, c), 2) * 26 * (lift - 1), liftF = Math.pow(Math.max(0, -c), 2) * 26 * (lift - 1);
  const pelvisY = ankleY(P) - L * Math.cos(A(stride * Math.abs(s) * 0.8)) + 2;
  const armN = o.armsOut ? 112 + 8 * s : 180 + arms * s;
  const armF = o.armsOut ? 248 - 8 * s : 180 - arms * s;
  return {
    pelvis: [0, pelvisY], torso: A(4), head: A(-2),
    aN: {fk: [A(armN), A(armN - (o.armsOut ? 4 : 18))]}, aF: {fk: [A(armF), A(armF - (o.armsOut ? -4 : 18))]},
    lN: {fk: [A(tN - liftN), A(tN - liftN + fN)]}, lF: {fk: [A(tF - liftF), A(tF - liftF + fF)]},
    footN: A(90 + fN * 0.35), footF: A(90 + fF * 0.35),
  };
};

/** Single-leg balance (stork) with gentle sway. */
export const storkBalance = (t: number, P: Props = ADULT, raise = 1): PoseCtl => {
  const sway = Math.sin(t * 2.4) * 2.2 + Math.sin(t * 5.3) * 0.8;
  const ay = ankleY(P);
  return {
    pelvis: [sway * 0.6, ay - legLen(P) + 2], torso: A(1 + sway * 0.5), head: A(-2),
    aN: {fk: [A(lerp(175, 105, raise) + sway), A(lerp(165, 100, raise) + sway)]},
    aF: {fk: [A(lerp(185, 252, raise) - sway), A(lerp(175, 258, raise) - sway)]},
    lN: {ik: [4, ay], bend: -1},
    lF: {fk: [A(lerp(182, 95, raise)), A(lerp(176, 175, raise))]},
    footF: A(lerp(90, 150, raise)),
  };
};

/** Two-foot hop: ph 0..1 (crouch → air → land). Returns pose and vertical offset (rig units, negative = up). */
export const hop = (ph: number, P: Props = ADULT): {pose: PoseCtl; dy: number; dx: number} => {
  const ay = ankleY(P);
  const L = legLen(P);
  const crouch = ph < 0.2 ? E.inOutSine(ph / 0.2) : ph < 0.32 ? 1 - E.outCubic((ph - 0.2) / 0.12) : ph > 0.82 ? Math.sin(((ph - 0.82) / 0.18) * Math.PI) * 0.8 : 0;
  const air = ph >= 0.3 && ph <= 0.84 ? Math.sin(((ph - 0.3) / 0.54) * Math.PI) : 0;
  const tuckIn = air * 0.5;
  const dy = -air * L * 0.32;
  const dx = ph < 0.3 ? 0 : ph > 0.84 ? 1 : (ph - 0.3) / 0.54;
  const d = crouch * 0.75 + tuckIn * 0.3;
  const armSwing = ph < 0.25 ? lerp(180, 230, E.inOutSine(ph / 0.25)) : ph < 0.5 ? lerp(230, 70, E.inOutSine((ph - 0.25) / 0.25)) : lerp(70, 160, E.inOutSine((ph - 0.5) / 0.5));
  const base = squat(d, P);
  return {
    pose: {
      ...base,
      aN: {fk: [A(armSwing), A(armSwing - 12)]}, aF: {fk: [A(armSwing + 8), A(armSwing - 4)]},
      lN: air > 0.02 ? {fk: [A(160 - tuckIn * 40), A(190 + tuckIn * 30)]} : base.lN,
      lF: air > 0.02 ? {fk: [A(166 - tuckIn * 40), A(196 + tuckIn * 30)]} : base.lF,
      footN: A(air > 0.02 ? 120 : 90), footF: A(air > 0.02 ? 125 : 90),
    },
    dy, dx,
  };
};

/** Coach guiding: walking-ready stance with an arm gesture (g: 0 down → 1 pointing forward, 2 high-five up). */
export const coachGesture = (g: number, t: number, P: Props = ADULT): PoseCtl => {
  const base = stand(P, t);
  const point = clamp(g), five = clamp(g - 1);
  const upA = lerp(lerp(174, 82, E.inOutSine(point)), 28, E.inOutSine(five));
  const foA = lerp(lerp(164, 76, E.inOutSine(point)), 18, E.inOutSine(five));
  return {...base, torso: A(4 + point * 4 - five * 2), aN: {fk: [A(upA), A(foA)]}};
};

export const lerpPose = (a: PoseCtl, b: PoseCtl, t: number): PoseCtl => {
  const L = (x: any, y: any): any => {
    if (typeof x === 'number') return lerp(x, y, t);
    if (Array.isArray(x)) return x.map((v, i) => L(v, y[i]));
    if (x && typeof x === 'object') {
      const o: any = {};
      for (const k of Object.keys(x)) o[k] = y && k in y ? L(x[k], y[k]) : x[k];
      return o;
    }
    return x;
  };
  return L(a, b);
};
