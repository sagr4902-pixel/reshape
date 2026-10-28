import React from "react";
import { MCOLORS } from "./design";

// Athletic silhouette rig. Forward kinematics on a simple skeleton, rendered as TAPERED solid
// shapes (V-shaped torso, muscular thighs and calves, tapered forearms) rather than strokes,
// so the figures read as athletes, not icons. Knockout gaps keep overlapping limbs legible.
// Every pose is a plain object of joint angles; animation = pose interpolation per frame.
// Angles in degrees. Side view faces +x (right).
//   torso: from straight UP, + leans forward          limbs: from straight DOWN, + swings forward

export type Pose = {
  torso: number;
  head: number; // extra head tilt relative to the torso
  armN: [number, number]; // near arm: upper arm, forearm (absolute)
  armF: [number, number]; // far arm
  legN: [number, number]; // near leg: thigh, shin (absolute)
  legF: [number, number];
  lift?: number; // extra height above the floor (jumps), in torso units
};

export const T = 100; // hip-to-shoulder length; every other length is relative to it
const L = { neck: 30, headR: 17.5, upper: 58, fore: 54, thigh: 82, shin: 78, foot: 27 };
// half-widths of the tapered shapes
const R = { hip: 20, waist: 18, chest: 27, shoulder: 21, neck: 8, upper0: 13.5, upper1: 10, fore0: 10, fore1: 7, hand: 8.5, thigh0: 19, thigh1: 12, calf: 13, ankle: 6.5, toe: 5.5 };
const GAP = 7;

type Pt = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
const down = (o: Pt, len: number, deg: number): Pt => [o[0] + len * Math.sin(rad(deg)), o[1] + len * Math.cos(rad(deg))];
const up = (o: Pt, len: number, deg: number): Pt => [o[0] + len * Math.sin(rad(deg)), o[1] - len * Math.cos(rad(deg))];
const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export type Skeleton = {
  hip: Pt;
  shoulder: Pt;
  head: Pt;
  neckBase: Pt;
  armN: Pt[];
  armF: Pt[];
  legN: Pt[];
  legF: Pt[];
};

/** Solve the rig with the hip at the origin, then drop it so the lowest foot touches y = 0. */
export const solve = (p: Pose): Skeleton => {
  const hip: Pt = [0, 0];
  const shoulder = up(hip, T, p.torso);
  const neckBase = up(hip, T * 1.04, p.torso);
  const head = up(neckBase, L.neck, p.torso + p.head);
  const arm = (a: [number, number]) => {
    const e = down(shoulder, L.upper, a[0]);
    return [shoulder, e, down(e, L.fore, a[1])];
  };
  const leg = (l: [number, number]) => {
    const k = down(hip, L.thigh, l[0]);
    const a = down(k, L.shin, l[1]);
    const toe: Pt = [a[0] + L.foot * Math.cos(rad(Math.max(-35, Math.min(35, (l[1] + l[0]) * 0.15)))), a[1] + 1];
    return [hip, k, a, toe];
  };
  const sk = { hip, shoulder, neckBase, head, armN: arm(p.armN), armF: arm(p.armF), legN: leg(p.legN), legF: leg(p.legF) };
  const lowest = Math.max(...[...sk.legN, ...sk.legF].map((q) => q[1])) + R.ankle;
  const dy = -lowest - (p.lift ?? 0) * T;
  const mv = (q: Pt): Pt => [q[0], q[1] + dy];
  return {
    hip: mv(sk.hip),
    shoulder: mv(sk.shoulder),
    neckBase: mv(sk.neckBase),
    head: mv(sk.head),
    armN: sk.armN.map(mv),
    armF: sk.armF.map(mv),
    legN: sk.legN.map(mv),
    legF: sk.legF.map(mv),
  };
};

/** Tapered capsule from a (radius ra) to b (radius rb): outer tangents + sampled round ends. */
const capsule = (a: Pt, b: Pt, ra: number, rb: number) => {
  const d = Math.max(1e-3, Math.hypot(b[0] - a[0], b[1] - a[1]));
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  // angle (from the axis) of the outer-tangent touch points; equal radii -> 90 degrees
  const phi = Math.acos(Math.max(-0.99, Math.min(0.99, (ra - rb) / d)));
  const pts: string[] = [];
  const n = 9;
  // far cap around b, from +phi to -phi through the front (axis direction)
  for (let i = 0; i <= n; i++) {
    const t = ang + phi - (2 * phi * i) / n;
    pts.push(`${(b[0] + rb * Math.cos(t)).toFixed(2)},${(b[1] + rb * Math.sin(t)).toFixed(2)}`);
  }
  // near cap around a, from -phi to +phi through the back
  for (let i = 0; i <= n; i++) {
    const t = ang - phi - ((2 * Math.PI - 2 * phi) * i) / n;
    pts.push(`${(a[0] + ra * Math.cos(t)).toFixed(2)},${(a[1] + ra * Math.sin(t)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
};

/** The silhouette as a list of solid shapes (each a path), grouped by depth layer. */
const shapes = (s: Skeleton) => {
  const leg = (l: Pt[]) => {
    const calfPt = mix(l[1], l[2], 0.32);
    return [capsule(l[0], l[1], R.thigh0, R.thigh1), capsule(l[1], calfPt, R.thigh1, R.calf), capsule(calfPt, l[2], R.calf, R.ankle), capsule(l[2], l[3], R.ankle, R.toe)];
  };
  const arm = (a: Pt[]) => [capsule(a[0], a[1], R.upper0, R.upper1), capsule(a[1], a[2], R.fore0, R.fore1), capsule(a[2], a[2], R.hand, R.hand)];
  const chest = mix(s.hip, s.shoulder, 0.72);
  const waist = mix(s.hip, s.shoulder, 0.32);
  const torso = [capsule(s.hip, waist, R.hip, R.waist), capsule(waist, chest, R.waist, R.chest), capsule(chest, s.shoulder, R.chest, R.shoulder), capsule(s.shoulder, s.neckBase, R.neck + 4, R.neck)];
  return { legF: leg(s.legF), armF: arm(s.armF), torso, legN: leg(s.legN), armN: arm(s.armN) };
};

export const lerpPose = (a: Pose, b: Pose, t: number): Pose => {
  const l = (x: number, y: number) => x + (y - x) * t;
  const l2 = (x: [number, number], y: [number, number]): [number, number] => [l(x[0], y[0]), l(x[1], y[1])];
  return {
    torso: l(a.torso, b.torso),
    head: l(a.head, b.head),
    armN: l2(a.armN, b.armN),
    armF: l2(a.armF, b.armF),
    legN: l2(a.legN, b.legN),
    legF: l2(a.legF, b.legF),
    lift: l(a.lift ?? 0, b.lift ?? 0),
  };
};

/** Smooth keyframed cycle: keys at phases 0..1 (first key repeats at 1). */
export const cycle = (keys: { at: number; pose: Pose }[], phase: number): Pose => {
  const p = ((phase % 1) + 1) % 1;
  const ks = [...keys, { at: 1, pose: keys[0].pose }];
  for (let i = 0; i < ks.length - 1; i++) {
    if (p >= ks[i].at && p <= ks[i + 1].at) {
      const t = (p - ks[i].at) / (ks[i + 1].at - ks[i].at || 1);
      return lerpPose(ks[i].pose, ks[i + 1].pose, 0.5 - 0.5 * Math.cos(Math.PI * t));
    }
  }
  return keys[0].pose;
};

type Props = {
  pose: Pose;
  x: number;
  y: number; // floor line
  scale?: number;
  color?: string;
  farColor?: string;
  accent?: string;
  bg?: string; // knockout colour (what is behind the figure)
  flip?: boolean; // face left
  prop?: "kettlebell" | "plate" | "none";
  opacity?: number;
  knockout?: boolean;
  /** orange offset echo behind the figure (motion-design "rim") */
  rim?: number;
  /** previous poses drawn as fading orange echoes (motion trail) */
  trail?: Pose[];
};

const Solid: React.FC<{ paths: string[]; fill: string; ko?: string }> = ({ paths, fill, ko }) => (
  <g>
    {ko ? paths.map((d, i) => <path key={`k${i}`} d={d} fill={ko} stroke={ko} strokeWidth={GAP * 2} strokeLinejoin="round" />) : null}
    {paths.map((d, i) => (
      <path key={i} d={d} fill={fill} />
    ))}
  </g>
);

const Props_: React.FC<{ s: Skeleton; prop: Props["prop"]; accent: string }> = ({ s, prop, accent }) => {
  const hand = s.armN[2];
  if (prop === "kettlebell")
    return (
      <g transform={`translate(${hand[0]} ${hand[1]})`}>
        <path d="M-12,4 C-12,-14 12,-14 12,4" fill="none" stroke={accent} strokeWidth={7} strokeLinecap="round" />
        <circle cx={0} cy={26} r={23} fill={accent} />
      </g>
    );
  if (prop === "plate")
    return (
      <g transform={`translate(${hand[0]} ${hand[1]})`}>
        <circle r={50} fill="none" stroke={accent} strokeWidth={16} />
        <circle r={20} fill="none" stroke={accent} strokeWidth={4} opacity={0.7} />
        <circle r={7} fill={accent} />
      </g>
    );
  return null;
};

export const Athlete: React.FC<Props> = ({
  pose,
  x,
  y,
  scale = 1,
  color = MCOLORS.white,
  farColor = "#5E6066",
  accent = MCOLORS.orange,
  bg = MCOLORS.black,
  flip = false,
  prop = "none",
  opacity = 1,
  knockout = true,
  rim = 0,
  trail,
}) => {
  const s = solve(pose);
  const sh = shapes(s);
  const ko = knockout ? bg : undefined;
  const all = [...sh.legF, ...sh.armF, ...sh.torso, ...sh.legN, ...sh.armN];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={opacity}>
      {trail?.map((tp, i) => {
        const ts = shapes(solve(tp));
        const tAll = [...ts.legF, ...ts.armF, ...ts.torso, ...ts.legN, ...ts.armN];
        return (
          <g key={`t${i}`} opacity={0.18 * (1 - i / trail.length)}>
            {tAll.map((d, j) => (
              <path key={j} d={d} fill={accent} />
            ))}
          </g>
        );
      })}
      {rim > 0 ? (
        <g transform={`translate(${-rim} ${-rim * 0.4})`}>
          {all.map((d, i) => (
            <path key={i} d={d} fill={accent} />
          ))}
          <circle cx={s.head[0]} cy={s.head[1]} r={L.headR} fill={accent} />
        </g>
      ) : null}
      <Solid paths={[...sh.legF, ...sh.armF]} fill={farColor} />
      <Solid paths={sh.torso} fill={color} ko={ko} />
      {ko ? <circle cx={s.head[0]} cy={s.head[1]} r={L.headR + GAP} fill={ko} /> : null}
      <circle cx={s.head[0]} cy={s.head[1]} r={L.headR} fill={color} />
      <Solid paths={sh.legN} fill={color} ko={ko} />
      <Props_ s={s} prop={prop} accent={accent} />
      <Solid paths={sh.armN} fill={color} ko={ko} />
    </g>
  );
};

// ------------------------------------------------------------------------------------- poses
export const P = {
  stand: { torso: 2, head: 0, armN: [6, 10], armF: [-4, 2], legN: [2, 0], legF: [-3, -2] } as Pose,
  ready: { torso: 6, head: -4, armN: [20, 95], armF: [8, 85], legN: [10, -6], legF: [-8, -10] } as Pose,
  victory: { torso: -4, head: -8, armN: [160, 172], armF: [150, 162], legN: [6, 2], legF: [-8, -6] } as Pose,
};

const squatKeys = [
  { at: 0, pose: { torso: 4, head: 0, armN: [12, 14], armF: [6, 8], legN: [2, -2], legF: [-2, -4] } as Pose },
  { at: 0.5, pose: { torso: 38, head: -18, armN: [88, 92], armF: [80, 86], legN: [88, -28], legF: [84, -32] } as Pose },
];
export const squat = (phase: number) => cycle(squatKeys, phase);

const swingKeys = [
  { at: 0, pose: { torso: 52, head: -30, armN: [-18, -22], armF: [-24, -28], legN: [36, -12], legF: [32, -14] } as Pose },
  { at: 0.5, pose: { torso: -3, head: 0, armN: [88, 90], armF: [84, 86], legN: [1, -1], legF: [-3, -3] } as Pose },
];
export const kbSwing = (phase: number) => cycle(swingKeys, phase);

const deadliftKeys = [
  { at: 0, pose: { torso: 58, head: -30, armN: [0, 0], armF: [-3, -3], legN: [58, -14], legF: [54, -16] } as Pose },
  { at: 0.5, pose: { torso: 0, head: 0, armN: [2, 2], armF: [-2, -2], legN: [0, 0], legF: [-3, -3] } as Pose },
];
export const deadlift = (phase: number) => cycle(deadliftKeys, phase);

// running: the far limbs run half a cycle behind the near ones
const runLeg = [
  { at: 0, l: [32, 8] },
  { at: 0.25, l: [2, -10] },
  { at: 0.5, l: [-34, -56] },
  { at: 0.75, l: [26, -74] },
];
const runArm = [
  { at: 0, a: [-38, 20] },
  { at: 0.5, a: [42, 120] },
];
const sampleKeys = <K extends string>(keys: ({ at: number } & Record<K, number[]>)[], field: K, phase: number) => {
  const p = ((phase % 1) + 1) % 1;
  const ks = [...keys, { ...keys[0], at: 1 }];
  for (let i = 0; i < ks.length - 1; i++) {
    if (p >= ks[i].at && p <= ks[i + 1].at) {
      const t = 0.5 - 0.5 * Math.cos((Math.PI * (p - ks[i].at)) / (ks[i + 1].at - ks[i].at));
      const a = ks[i][field] as number[];
      const b = ks[i + 1][field] as number[];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] as [number, number];
    }
  }
  const k0 = keys[0][field] as number[];
  return [k0[0], k0[1]] as [number, number];
};
export const run = (phase: number): Pose => ({
  torso: 14,
  head: -10,
  legN: sampleKeys(runLeg, "l", phase),
  legF: sampleKeys(runLeg, "l", phase + 0.5),
  armN: sampleKeys(runArm, "a", phase + 0.5),
  armF: sampleKeys(runArm, "a", phase),
  lift: 0.06 * Math.max(0, Math.sin(phase * 4 * Math.PI)),
});

const jumpSquatKeys = [
  { at: 0, pose: { torso: 34, head: -16, armN: [-24, -18], armF: [-30, -24], legN: [80, -26], legF: [76, -30], lift: 0 } as Pose },
  { at: 0.45, pose: { torso: -2, head: -6, armN: [168, 176], armF: [160, 170], legN: [6, -10], legF: [-4, -16], lift: 0.55 } as Pose },
  { at: 0.7, pose: { torso: 10, head: 0, armN: [40, 60], armF: [30, 50], legN: [30, -12], legF: [26, -16], lift: 0 } as Pose },
];
export const jumpSquat = (phase: number) => cycle(jumpSquatKeys, phase);

/** Walking up steps: legs alternate high knee, body upright. */
const climbLeg = [
  { at: 0, l: [62, -8] },
  { at: 0.5, l: [-8, -14] },
];
export const climb = (phase: number): Pose => ({
  torso: 10,
  head: -6,
  legN: sampleKeys(climbLeg, "l", phase),
  legF: sampleKeys(climbLeg, "l", phase + 0.5),
  armN: sampleKeys(runArm, "a", phase + 0.5),
  armF: sampleKeys(runArm, "a", phase),
});
