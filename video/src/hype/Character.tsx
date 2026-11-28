import React from "react";
import { capsule, Pose, solve } from "../motion/Athlete";

// Flat illustrated athlete on the same rig as the silhouette (side view, faces +x): skin, hair, face,
// brand-orange tee, dark shorts, white trainers, with a darker far side for depth and a ground shadow.
// `tone` 0 → 1 fades the figure from a washed-out grey version to full colour.
type Pt = [number, number];
const mix = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const blend = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
};
const grey = (c: string) => { const [r, g, b] = hex(c); const l = Math.round(0.3 * r + 0.59 * g + 0.11 * b * 1 + 40); const h = Math.min(255, l).toString(16).padStart(2, "0"); return `#${h}${h}${h}`; };

const PAL = {
  skin: "#E0A27A", skinFar: "#C4835C", hair: "#2A1B14", shirt: "#FF5420", shirtFar: "#D43F12", shirtShade: "#E8481A",
  shorts: "#23262E", shortsFar: "#15171C", shoe: "#FFFFFF", shoeFar: "#D9D9DE", sole: "#FF5420", eye: "#2A1B14",
};

export const Character: React.FC<{ pose: Pose; x: number; y: number; scale?: number; flip?: boolean; opacity?: number; tone?: number; shadow?: boolean }> = ({
  pose, x, y, scale = 1, flip = false, opacity = 1, tone = 1, shadow = true,
}) => {
  const s = solve(pose);
  const c = (k: keyof typeof PAL) => blend(grey(PAL[k]), PAL[k], tone);
  const P = (d: string, fill: string, key: string) => <path key={key} d={d} fill={fill} />;

  const leg = (l: Pt[], far: boolean, id: string) => {
    const skin = c(far ? "skinFar" : "skin");
    const hem = mix(l[0], l[1], 0.62);                     // shorts end above the knee
    const calf = mix(l[1], l[2], 0.32);
    const sock = mix(l[1], l[2], 0.86);
    return [
      P(capsule(hem, l[1], 15, 12), skin, id + "k"),
      P(capsule(l[1], calf, 12, 13), skin, id + "c1"),
      P(capsule(calf, l[2], 13, 6.5), skin, id + "c2"),
      P(capsule(sock, l[2], 7.5, 7.5), "#FFFFFF", id + "s"),
      P(capsule([l[2][0] - 4, l[2][1] + 2], [l[3][0] + 6, l[3][1] + 1], 10, 7.5), c(far ? "shoeFar" : "shoe"), id + "sh"),
      P(capsule([l[2][0] - 6, l[2][1] + 10], [l[3][0] + 8, l[3][1] + 7], 3, 3), c("sole"), id + "so"),
      P(capsule(l[0], hem, 21, 17.5), c(far ? "shortsFar" : "shorts"), id + "t"),
    ];
  };
  const arm = (a: Pt[], far: boolean, id: string) => {
    const skin = c(far ? "skinFar" : "skin");
    const sleeve = mix(a[0], a[1], 0.55);
    return [
      P(capsule(sleeve, a[1], 11.5, 10), skin, id + "u"),
      P(capsule(a[1], a[2], 10, 7), skin, id + "f"),
      P(capsule(a[2], a[2], 8.5, 8.5), skin, id + "h"),
      P(capsule(a[0], sleeve, 15, 13.5), c(far ? "shirtFar" : "shirt"), id + "s"),
    ];
  };
  const chest = mix(s.hip, s.shoulder, 0.72), waist = mix(s.hip, s.shoulder, 0.32);
  const hx = s.head[0], hy = s.head[1], r = 19;
  const lean = Math.atan2(s.head[0] - s.neckBase[0], -(s.head[1] - s.neckBase[1])) * (180 / Math.PI);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} opacity={opacity}>
      {shadow ? <ellipse cx={0} cy={4} rx={95} ry={11} fill="rgba(23,24,26,0.14)" /> : null}
      {leg(s.legF, true, "lf")}
      {arm(s.armF, true, "af")}
      {/* neck, tee, waistband */}
      {P(capsule(s.shoulder, mix(s.neckBase, s.head, 0.5), 10, 9), c("skin"), "neck")}
      {P(capsule(s.hip, waist, 20.5, 18.5), c("shirt"), "t1")}
      {P(capsule(waist, chest, 18.5, 27), c("shirt"), "t2")}
      {P(capsule(chest, s.shoulder, 27, 21), c("shirt"), "t3")}
      {P(capsule(mix(s.hip, s.shoulder, 0.1), mix(s.hip, s.shoulder, 0.5), 9, 12), c("shirtShade"), "shade")}
      {P(capsule(s.hip, mix(s.hip, s.shoulder, 0.06), 21.5, 21), c("shorts"), "wb")}
      {/* head: face, ear, hair, eye, brow */}
      <g transform={`rotate(${lean} ${hx} ${hy})`}>
        <circle cx={hx} cy={hy} r={r} fill={c("skin")} />
        <path d={`M${hx + 15},${hy + 2} q7,4 1,9 l-5,-2 z`} fill={c("skin")} />
        <path d={`M${hx - r - 1},${hy + 5} C${hx - r - 4},${hy - 22} ${hx + 6},${hy - 30} ${hx + r - 1},${hy - 9} C${hx + 8},${hy - 13} ${hx - 2},${hy - 12} ${hx - 6},${hy - 3} C${hx - 9},${hy + 3} ${hx - 13},${hy + 6} ${hx - r - 1},${hy + 5} Z`} fill={c("hair")} />
        <ellipse cx={hx - 5} cy={hy + 4} rx={4} ry={6} fill={c("skinFar")} />
        <circle cx={hx + 9} cy={hy - 1} r={2.6} fill={c("eye")} />
        <path d={`M${hx + 4},${hy - 7} l10,-2`} stroke={c("hair")} strokeWidth={3} strokeLinecap="round" />
        <path d={`M${hx + 9},${hy + 9} q4,3 8,0`} stroke={c("eye")} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={tone} />
      </g>
      {leg(s.legN, false, "ln")}
      {arm(s.armN, false, "an")}
    </g>
  );
};
