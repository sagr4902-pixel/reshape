import React, {useId} from 'react';
import {add2, catmull, cw90, dir, mul2, norm2, sub2, type V2} from './math';
import type {Joints, Props} from './rig';
import {C} from './theme';

export type Outfit = {
  skin: string; skinShade: string;
  top: string; topShade: string; sleeve: 'none' | 'short';
  bottom: string; bottomShade: string; pants: 'shorts' | 'long';
  shoe: string; sole: string;
  hair: string; hairStyle: 'short' | 'cap' | 'ponytail' | 'bun';
  cap?: string; accent?: string;
};

export const OUTFITS = {
  athlete: {
    skin: C.skin, skinShade: C.skinShade, top: '#4B4C52', topShade: '#2A2B30', sleeve: 'none',
    bottom: '#36373C', bottomShade: '#1E1F23', pants: 'shorts', shoe: C.light, sole: C.orange,
    hair: '#1E1F22', hairStyle: 'short', accent: C.orange,
  } as Outfit,
  athlete2: {
    skin: '#B98F74', skinShade: '#8A6550', top: C.light, topShade: '#B9ABA3', sleeve: 'short',
    bottom: '#2A2B2F', bottomShade: '#18191C', pants: 'shorts', shoe: '#2A2B2F', sole: C.orange,
    hair: '#1E1F22', hairStyle: 'short', accent: C.orange,
  } as Outfit,
  coach: {
    skin: '#C29C82', skinShade: '#94725D', top: C.orange, topShade: '#C23C12', sleeve: 'short',
    bottom: '#2F3034', bottomShade: '#1D1E21', pants: 'long', shoe: C.light, sole: '#2F3034',
    hair: '#1E1F22', hairStyle: 'cap', cap: '#2F3034', accent: C.light,
  } as Outfit,
  kidA: {
    skin: '#D2AE94', skinShade: '#A8846D', top: C.light, topShade: '#BDAFA6', sleeve: 'short',
    bottom: C.orange, bottomShade: '#C23C12', pants: 'shorts', shoe: '#2F3034', sole: C.light,
    hair: '#2A1F1A', hairStyle: 'short', accent: C.orange,
  } as Outfit,
  kidB: {
    skin: '#BE967C', skinShade: '#92705C', top: C.orange, topShade: '#C23C12', sleeve: 'short',
    bottom: '#3B3C41', bottomShade: '#232428', pants: 'shorts', shoe: C.light, sole: C.orange,
    hair: '#231A16', hairStyle: 'ponytail', accent: C.light,
  } as Outfit,
};

const f = (n: number) => n.toFixed(2);
const P2 = (p: V2) => `${f(p[0])} ${f(p[1])}`;

/** Rounded capsule between two circles. */
export const capsule = (p1: V2, r1: number, p2: V2, r2: number) => {
  const u = norm2(sub2(p2, p1));
  const n = cw90(u);
  const a = add2(p1, mul2(n, r1)), b = add2(p2, mul2(n, r2));
  const c = add2(p2, mul2(n, -r2)), d = add2(p1, mul2(n, -r1));
  return `M${P2(a)}L${P2(b)}A${f(r2)} ${f(r2)} 0 0 0 ${P2(c)}L${P2(d)}A${f(r1)} ${f(r1)} 0 0 0 ${P2(a)}Z`;
};

const closedSmooth = (pts: V2[]) => {
  const s = catmull(pts, 6, true);
  return 'M' + s.map(P2).join('L') + 'Z';
};

/** Gradient across a segment so the side facing the light is brighter (reads as volume). */
const across = (p1: V2, p2: V2, r: number, light: V2) => {
  const u = norm2(sub2(p2, p1));
  let n = cw90(u);
  if (n[0] * light[0] + n[1] * light[1] < 0) n = mul2(n, -1);
  const m = mul2(add2(p1, p2), 0.5);
  return {a: add2(m, mul2(n, r)), b: add2(m, mul2(n, -r))};
};

type Part = {d: string; fill: string; shade: string; g?: {a: V2; b: V2}};

export const Figure: React.FC<{
  j: Joints; P: Props; o: Outfit; x?: number; y?: number; scale?: number; flip?: boolean;
  light?: V2; rim?: {color: string; dx: number; dy: number; opacity: number} | null; opacity?: number; far?: number; flat?: boolean;
}> = ({j, P, o, x = 0, y = 0, scale = 1, flip = false, light = [-0.6, -0.8], rim = null, opacity = 1, far = 0.78, flat = false}) => {
  const uid = useId().replace(/[:«»]/g, '');
  const L = norm2(light);
  const parts: Part[] = [];
  const dim = (hex: string, k: number) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * k), g = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
    return `rgb(${r},${g},${b})`;
  };
  const cap = (p1: V2, r1: number, p2: V2, r2: number, fill: string, shade: string, k = 1) =>
    parts.push({d: capsule(p1, r1, p2, r2), fill: k === 1 ? fill : dim(fill, k), shade: k === 1 ? shade : dim(shade, k), g: across(p1, p2, Math.max(r1, r2), L)});
  const at = (p1: V2, p2: V2, t: number): V2 => add2(p1, mul2(sub2(p2, p1), t));

  const arm = (sh: V2, el: V2, ha: V2, k: number) => {
    cap(sh, P.rUpper[0], el, P.rUpper[1], o.skin, o.skinShade, k);
    cap(el, P.rFore[0], ha, P.rFore[1], o.skin, o.skinShade, k);
    if (o.sleeve === 'short') cap(sh, P.rUpper[0] + 2.2, at(sh, el, 0.48), P.rUpper[0] + 1.2, o.top, o.topShade, k);
    if (o.accent) cap(at(el, ha, 0.74), P.rFore[0] * 0.95, at(el, ha, 0.9), P.rFore[1] + 0.8, o.accent, o.accent, k);
    parts.push({d: `M${P2(add2(ha, [P.handR, 0]))}A${f(P.handR)} ${f(P.handR)} 0 1 0 ${P2(add2(ha, [-P.handR, 0]))}A${f(P.handR)} ${f(P.handR)} 0 1 0 ${P2(add2(ha, [P.handR, 0]))}Z`, fill: dim(o.skin, k * 0.97), shade: dim(o.skinShade, k)});
  };
  const leg = (hip: V2, kn: V2, an: V2, toe: V2, k: number) => {
    const long = o.pants === 'long';
    cap(hip, P.rThigh[0], kn, P.rThigh[1], long ? o.bottom : o.skin, long ? o.bottomShade : o.skinShade, k);
    cap(kn, P.rShin[0], an, P.rShin[1], long ? o.bottom : o.skin, long ? o.bottomShade : o.skinShade, k);
    if (!long) cap(hip, P.rThigh[0] + 2.5, at(hip, kn, 0.55), P.rThigh[0] * 0.86 + 2, o.bottom, o.bottomShade, k);
    const sr = P.rShin[1] + 1.6;
    const fd = norm2(sub2(toe, an));
    cap(add2(an, mul2(fd, -2)), sr, toe, sr * 0.72, o.shoe, dim(o.shoe, 0.72), k);
    const down = cw90(fd); // sole side
    cap(add2(add2(an, mul2(fd, -3)), mul2(down, sr * 0.75)), 2.4, add2(toe, mul2(down, sr * 0.55)), 2.0, o.sole, o.sole, k);
  };

  // Far limbs first (dimmed), then torso/head, then near limbs.
  arm(j.shoulder, j.elbowF, j.handF, far);
  leg(j.pelvis, j.kneeF, j.ankleF, j.toeF, far);

  // Torso contour
  const a = dir(j.torsoA);
  const fr = cw90(a);
  const front: V2[] = [], back: V2[] = [];
  for (const [s, wf, wb] of P.torso) {
    const c = add2(j.pelvis, mul2(a, s * P.spine));
    front.push(add2(c, mul2(fr, wf)));
    back.push(add2(c, mul2(fr, -wb)));
  }
  const torsoPts = [...front, ...back.reverse()];
  const tg = across(j.pelvis, j.neckBase, 26, L);
  // neck
  cap(j.neckBase, P.rNeck[0], add2(j.neckBase, mul2(dir(j.headA), P.neck + 4)), P.rNeck[1], o.skin, o.skinShade);
  parts.push({d: closedSmooth(torsoPts), fill: o.top, shade: o.topShade, g: tg});
  // shorts / hips
  const hipStations = P.torso.filter(([s]) => s <= 0.3);
  const hf: V2[] = [], hb: V2[] = [];
  for (const [s, wf, wb] of hipStations) {
    const c = add2(j.pelvis, mul2(a, s * P.spine));
    hf.push(add2(c, mul2(fr, wf + 1.2)));
    hb.push(add2(c, mul2(fr, -wb - 1.2)));
  }
  parts.push({d: closedSmooth([...hf, ...hb.reverse()]), fill: o.bottom, shade: o.bottomShade, g: tg});

  // head
  const hr = P.headR;
  const headD = `M${P2(add2(j.head, [hr, 0]))}A${f(hr)} ${f(hr)} 0 1 0 ${P2(add2(j.head, [-hr, 0]))}A${f(hr)} ${f(hr)} 0 1 0 ${P2(add2(j.head, [hr, 0]))}Z`;
  parts.push({d: headD, fill: o.skin, shade: o.skinShade, g: {a: add2(j.head, mul2(L, hr)), b: add2(j.head, mul2(L, -hr))}});

  const nearStart = parts.length;
  leg(j.pelvis, j.kneeN, j.ankleN, j.toeN, 1);
  arm(j.shoulder, j.elbowN, j.handN, 1);

  // hair / cap drawn over head, clipped to the head circle
  const back2 = dir(j.headA - Math.PI / 2); // towards the back of the head
  const up2 = dir(j.headA);
  const hairC = add2(add2(j.head, mul2(back2, hr * 0.5)), mul2(up2, hr * 0.46));

  const tf = `translate(${f(x)} ${f(y)}) scale(${flip ? -scale : scale} ${scale})`;
  const renderParts = (fillOverride?: string) =>
    parts.map((p, i) => (
      <path key={i} d={p.d} fill={fillOverride ?? (p.g ? `url(#g${uid}_${i})` : p.fill)} />
    ));

  return (
    <g transform={tf} opacity={opacity}>
      <defs>
        {parts.map((p, i) =>
          p.g ? (
            <linearGradient key={i} id={`g${uid}_${i}`} gradientUnits="userSpaceOnUse" x1={p.g.a[0]} y1={p.g.a[1]} x2={p.g.b[0]} y2={p.g.b[1]}>
              <stop offset="0" stopColor={p.fill} />
              <stop offset="0.5" stopColor={p.fill} />
              <stop offset="1" stopColor={p.shade} />
            </linearGradient>
          ) : null,
        )}
        <clipPath id={`hc${uid}`}>
          <path d={headD} />
        </clipPath>
      </defs>
      {rim ? (
        <g transform={`translate(${rim.dx} ${rim.dy})`} opacity={rim.opacity}>
          {renderParts(rim.color)}
        </g>
      ) : null}
      {parts.slice(0, nearStart).map((p, i) => (
        <path key={i} d={p.d} fill={p.g && !flat ? `url(#g${uid}_${i})` : p.fill} />
      ))}
      <g clipPath={`url(#hc${uid})`}>
        {o.hairStyle === 'cap' && o.cap ? (
          <circle cx={hairC[0]} cy={hairC[1] - 2} r={hr * 1.02} fill={o.cap} />
        ) : (
          <circle cx={hairC[0]} cy={hairC[1]} r={hr * 0.98} fill={o.hair} />
        )}
      </g>
      {o.hairStyle === 'cap' && o.cap ? (
        <path d={capsule(add2(j.head, add2(mul2(up2, hr * 0.42), mul2(dir(j.headA + Math.PI / 2), hr * 0.55))), 3.2, add2(j.head, add2(mul2(up2, hr * 0.3), mul2(dir(j.headA + Math.PI / 2), hr * 1.32))), 2.6)} fill={o.cap} />
      ) : null}
      {o.hairStyle === 'ponytail' ? (
        <path d={capsule(add2(j.head, mul2(back2, hr * 0.9)), hr * 0.32, add2(add2(j.head, mul2(back2, hr * 1.45)), mul2(up2, -hr * 0.65)), hr * 0.2)} fill={o.hair} />
      ) : null}
      {parts.slice(nearStart).map((p, k) => {
        const i = nearStart + k;
        return <path key={i} d={p.d} fill={p.g && !flat ? `url(#g${uid}_${i})` : p.fill} />;
      })}
    </g>
  );
};

/** Soft elliptical contact shadow. */
export const ContactShadow: React.FC<{x: number; y: number; w: number; opacity?: number; h?: number}> = ({x, y, w, opacity = 0.45, h}) => {
  const id = useId().replace(/[:«»]/g, '');
  return (
    <g>
      <defs>
        <radialGradient id={`cs${id}`}>
          <stop offset="0" stopColor="#000" stopOpacity={opacity} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={w / 2} ry={h ?? w * 0.09} fill={`url(#cs${id})`} />
    </g>
  );
};
