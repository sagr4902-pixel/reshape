import React from 'react';
import {makeProjector, type Cam} from '../../../kit/cam3d';
import {ContactShadow, Figure, OUTFITS} from '../../../kit/Figure';
import {clamp, E, kf, lerp, seg, type V2, type V3} from '../../../kit/math';
import {GlowDefs, LightPool, MotionPathW} from '../../../kit/Path';
import {frontLever, pressHandstand, pullUp, pushUp, squat, stand} from '../../../kit/poses';
import {ADULT, solve, type PoseCtl} from '../../../kit/rig';
import {C} from '../../../kit/theme';
import {camAt, FloorGrid, lengths3, project, spline3, sub3, Tube} from './shared3d';
import {wordAt} from '../timeline';
const wordAt3 = (i: number) => wordAt('L3', i);

/**
 * One continuous 3D world for scenes 1–3 (frames 0–616): the hook station, the pull-up,
 * the progression platforms and the strength / control / skill runway. Pure function of f.
 */

// ---------- geometry (world units ≈ cm, y up) ----------
export const BAR_Y = 232;
export const POST_Z = 105;
const ATH_X = -4;

// progression platforms (stairs to the right)
export const BLOCKS = [0, 1, 2, 3].map((i) => ({
  x0: 110 + i * 200, x1: 110 + i * 200 + 200, z0: -90, z1: 90, top: 50 + i * 230,
}));
const MINI = 0.55; // miniature athletes on the progression platforms
const MINI_GRIP = 128; // grip height above a platform top (world units)
const EDGE_Z = -90;
const RUN = {x0: BLOCKS[3].x0 - 10, x1: BLOCKS[3].x1 + 10, z0: -70, z1: 1500, top: BLOCKS[3].top};
const RUN_CX = (RUN.x0 + RUN.x1) / 2;
/** Strength / control / skill pads, weaving forward into depth. */
export const PADS = {
  strength: {x: RUN_CX + 260, y: RUN.top, z: 620},
  control: {x: RUN_CX - 230, y: RUN.top + 70, z: 1500},
  skill: {x: RUN_CX + 120, y: RUN.top + 150, z: 2380},
};

// ---------- camera ----------
const T = RUN.top;
export const camKeys: Array<[number, V3, V3, number?]> = [
  [0, [-60, 330, -760], [-170, 300, -300], 34],
  [26, [10, 320, -790], [0, 300, -380], 36],
  [56, [250, 230, -760], [40, 160, -150], 38],
  [96, [300, 160, -560], [0, 136, 0], 40],
  [160, [282, 158, -528], [0, 138, 0], 40],
  [200, [180, 215, -440], [0, 192, 0], 40],
  [222, [168, 208, -420], [0, 190, 0], 40],
  [250, [160, 230, -410], [0, 214, 0], 40],
  [284, [165, 208, -425], [0, 188, 0], 40],
  [300, [205, 240, -640], [85, 212, 0], 42],
  [314, [215, 300, -1060], [160, 262, 0], 42],
  [330, [420, 400, -1450], [430, 380, 0], 42],
  [346, [510, 470, -1500], [510, 470, 0], 42],
  [366, [560, 560, -1360], [600, 560, 0], 42],
  [386, [780, T + 240, -700], [800, T + 140, 300], 42],
  [412, [RUN_CX + 260 + 150, T + 165, 620 - 820], [RUN_CX + 260 + 30, T + 140, 620], 42],
  [440, [RUN_CX + 260 + 120, T + 165, 620 - 690], [RUN_CX + 260 + 25, T + 140, 620], 42],
  [458, [RUN_CX - 230 + 110, T + 70 + 165, 1500 - 700], [RUN_CX - 230, T + 70 + 170, 1500], 42],
  [486, [RUN_CX - 230 + 95, T + 70 + 170, 1500 - 620], [RUN_CX - 230, T + 70 + 170, 1500], 42],
  [506, [RUN_CX + 120 + 420, T + 150 + 190, 2380 - 820], [RUN_CX + 120 + 50, T + 150 + 170, 2380], 42],
  [548, [RUN_CX + 120 + 380, T + 150 + 190, 2380 - 740], [RUN_CX + 120 + 50, T + 150 + 175, 2380], 42],
  [586, [RUN_CX + 120 + 220, T + 150 + 230, 2380 - 640], [RUN_CX + 120 + 25, T + 150 + 760, 2440], 45],
  [616, [RUN_CX + 120 + 160, T + 150 + 260, 2380 - 600], [RUN_CX + 120 + 15, T + 150 + 1900, 2440], 46],
];
export const camAtF = (f: number): Cam => {
  const c = camAt(f, camKeys);
  if (f < 100) {
    // early on the camera tracks the head of the path, then settles on the station
    const h = hookHead(f);
    const w = 1 - seg(f, 40, 96, E.inOutSine);
    c.target = [lerp(c.target[0], h[0], w * 0.85), lerp(c.target[1], h[1], w * 0.85), lerp(c.target[2], h[2], w * 0.85)];
  }
  return c;
};

// ---------- the hook path (traces the station outline) ----------
// swoop (spline) → station outline (straight runs with small rounded corners) → exit (spline)
const SWOOP: V3[] = spline3([[-170, 300, -300], [-110, 335, -420], [40, 330, -450], [165, 250, -340], [160, 120, -210], [60, 22, -128], [4, 4, -108], [0, 4, -105]], 12);
const seg3 = (a: V3, b: V3, n: number): V3[] => Array.from({length: n}, (_, i) => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n), lerp(a[2], b[2], i / n)] as V3);
const corner = (a: V3, c: V3, b: V3, n = 8): V3[] =>
  Array.from({length: n}, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], u * u * a[2] + 2 * u * t * c[2] + t * t * b[2]] as V3;
  });
const R = 14;
const OUTLINE: V3[] = [
  ...seg3([0, 4, -POST_Z], [0, BAR_Y - R, -POST_Z], 40),
  ...corner([0, BAR_Y - R, -POST_Z], [0, BAR_Y, -POST_Z], [0, BAR_Y, -POST_Z + R]),
  ...seg3([0, BAR_Y, -POST_Z + R], [0, BAR_Y, POST_Z - R], 40),
  ...corner([0, BAR_Y, POST_Z - R], [0, BAR_Y, POST_Z], [0, BAR_Y - R, POST_Z]),
  ...seg3([0, BAR_Y - R, POST_Z], [0, 4, POST_Z], 40),
];
const EXIT: V3[] = spline3([[0, 4, POST_Z], [30, 3, 70], [115, 4, -40], [170, 40, -190], [185, 190, -300], [160, 330, -360]], 12);
const HOOK: V3[] = [...SWOOP.slice(0, -1), ...OUTLINE, ...EXIT];
const iBase = SWOOP.length - 1;
const iBar0 = iBase + 40 + 8, iBar1 = iBar0 + 40;
const iDone = iBase + OUTLINE.length;
const HOOK_L = (() => {
  const L = [0];
  for (let i = 1; i < HOOK.length; i++) L.push(L[i - 1] + Math.hypot(HOOK[i][0] - HOOK[i - 1][0], HOOK[i][1] - HOOK[i - 1][1], HOOK[i][2] - HOOK[i - 1][2]));
  return L;
})();
const fr = (i: number) => HOOK_L[i] / HOOK_L[HOOK_L.length - 1];
const fracAt = (pts: V3[], idx: number) => {
  let L = 0, Li = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
    L += d;
    if (i === idx) Li = L;
  }
  return Li / L;
};
const F_BASE = fr(iBase);
const F_DONE = fr(iDone);
const F_BAR0 = fr(iBar0), F_BAR1 = fr(iBar1);
/** Point at an arc-length fraction of a 3D polyline. */
const pointAt = (pts: V3[], L: number[], frac: number): V3 => {
  const l = clamp(frac) * L[L.length - 1];
  let i = 1;
  while (i < L.length - 1 && L[i] < l) i++;
  const t = clamp((l - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]));
  const a = pts[i - 1], b = pts[i];
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
};

/** Hook path head fraction over time. */
const hookTo = (f: number) =>
  kf<number>(f, [
    [8, 0, E.linear], [14, 0.004, E.linear], [44, F_BASE, E.inOutSine], [94, F_DONE, E.inOutCubic],
  ]);
export const hookWindow = (f: number) => {
  const to = f < 8 ? 0 : hookTo(f);
  const tail = 0.12;
  const outlineFrom = to <= F_BASE ? Math.max(0, to - tail) : Math.min(F_BASE, Math.max(0, to - tail));
  return {
    outline: {from: f < 50 ? outlineFrom : F_BASE, to: Math.min(to, F_DONE)},
    exit: {from: Math.max(F_DONE, to - 0.09), to: Math.max(F_DONE, to)},
    to, bar: [F_BAR0, F_BAR1] as [number, number],
  };
};
/** World position of the hook path head (for camera tracking and the light that travels with it). */
export const hookHead = (f: number): V3 => pointAt(HOOK, HOOK_L, hookWindow(f).to);
export const hookExitEnd = HOOK[HOOK.length - 1];

// ---------- progression path (S2/S3): steps → runway → up ----------
const PROG_CTRL: V3[] = (() => {
  const pts: V3[] = [[BLOCKS[0].x0 - 60, 3, EDGE_Z], [BLOCKS[0].x0 - 8, 4, EDGE_Z], [BLOCKS[0].x0, BLOCKS[0].top * 0.5, EDGE_Z]];
  for (let i = 0; i < 4; i++) {
    const b = BLOCKS[i];
    pts.push([b.x0 + 2, b.top, EDGE_Z], [(b.x0 + b.x1) / 2, b.top, EDGE_Z], [b.x1 - 2, b.top, EDGE_Z]);
    if (i < 3) pts.push([b.x1, b.top + 8, EDGE_Z], [b.x1, BLOCKS[i + 1].top - 8, EDGE_Z]);
  }
  const P = PADS;
  pts.push(
    [BLOCKS[3].x0 + 40, RUN.top, 40], [RUN_CX + 60, RUN.top, 240], [P.strength.x - 120, P.strength.y, P.strength.z - 120],
    [P.strength.x + 60, P.strength.y, P.strength.z + 60], [P.strength.x - 120, P.strength.y + 30, P.strength.z + 420],
    [P.control.x + 60, P.control.y, P.control.z - 140], [P.control.x - 60, P.control.y, P.control.z + 80],
    [P.control.x + 120, P.control.y + 40, P.control.z + 430], [P.skill.x - 120, P.skill.y, P.skill.z - 120],
    [P.skill.x - 150, P.skill.y, P.skill.z + 60], [P.skill.x - 60, P.skill.y + 6, P.skill.z + 120], [P.skill.x + 10, P.skill.y + 420, P.skill.z + 130], [P.skill.x + 10, P.skill.y + 1900, P.skill.z + 130],
  );
  return pts;
})();
const PROG = spline3(PROG_CTRL, 10);
const PROG_L = lengths3(PROG);
const PROG_RUN_START = fracAt(PROG, (3 + 4 * 3 + 3 * 2 - 1) * 10);
const PROG_PAD = (k: number) => fracAt(PROG, (3 + 4 * 3 + 3 * 2 + 3 + k * 3) * 10);
/** Progression path head fraction over time. */
export const progTo = (f: number) =>
  kf<number>(f, [
    [326, 0, E.linear], [376, PROG_RUN_START * 0.99, E.inOutSine],
    [412, PROG_PAD(0), E.inOutSine], [458, PROG_PAD(1), E.inOutSine], [506, PROG_PAD(2), E.inOutSine],
    [560, PROG_PAD(2) + (1 - PROG_PAD(2)) * 0.25, E.inOutSine], [610, 1, E.inCubic],
  ]);

// ---------- character timelines ----------
/** Main athlete (S1 squats → S2 jump + pull-up + drop). Returns pose + world anchor + mode. */
const athlete = (f: number): {pose: PoseCtl; anchor: V3; grip: boolean; o: number} => {
  const t = f / 30;
  const appear = seg(f, 94, 116, E.outCubic);
  if (f < 196) {
    // two controlled air squats (basic movement, going nowhere)
    let d = 0;
    if (f >= 116 && f < 146) d = Math.sin(((f - 116) / 30) * Math.PI);
    else if (f >= 148 && f < 178) d = Math.sin(((f - 148) / 30) * Math.PI);
    const pose = d > 0 ? squat(E.inOutSine(d)) : stand(ADULT, t);
    return {pose, anchor: [ATH_X, 0, 0], grip: false, o: appear};
  }
  if (f < 212) {
    // anticipation dip then jump to the bar
    const dip = f < 203 ? E.inOutSine((f - 196) / 7) * 0.32 : Math.max(0, 0.32 - ((f - 203) / 3) * 0.32);
    const air = clamp((f - 203) / 9);
    const base = squat(dip);
    const reach = E.outCubic(air);
    const arms: PoseCtl = {
      ...base,
      aN: {fk: [lerp(base.aN && 'fk' in base.aN ? base.aN.fk[0] : 3, 0.05, reach), lerp(base.aN && 'fk' in base.aN ? base.aN.fk[1] : 3, 0.02, reach)]},
      aF: {fk: [lerp(base.aF && 'fk' in base.aF ? base.aF.fk[0] : 3, 0.1, reach), lerp(base.aF && 'fk' in base.aF ? base.aF.fk[1] : 3, 0.06, reach)]},
    };
    return {pose: arms, anchor: [ATH_X, 70 * E.outCubic(air) - 4 * E.inOutSine(clamp((f - 196) / 7)) * (1 - air), 0], grip: false, o: 1};
  }
  if (f < 287) {
    // grip at f212; settle swing; strict pull-up f222–247, hold, controlled lower to f284
    const settle = Math.sin((f - 212) * 0.5) * Math.exp(-(f - 212) * 0.18) * 4;
    const h = kf<number>(f, [[212, 0], [222, 0, E.linear], [247, 1, E.inOutCubic], [258, 1, E.linear], [284, 0, E.inOutSine]]);
    return {pose: pullUp(h, ADULT, settle), anchor: [0, BAR_Y, 0], grip: true, o: 1};
  }
  // drop and land
  const fall = clamp((f - 287) / 8);
  const land = clamp((f - 295) / 10);
  const pose = f < 295 ? stand(ADULT, t) : squat(Math.sin(land * Math.PI) * 0.35);
  return {pose, anchor: [ATH_X, 66 * (1 - E.inCubic(fall)), 0], grip: false, o: 1 - seg(f, 306, 326)};
};

// mini figures on platforms (stage demos of the pull-up progression)
const stageFigure = (i: number, f: number): PoseCtl => {
  const t = f / 30;
  if (i === 0) return pullUp(0.04 + 0.07 * Math.max(0, Math.sin(t * 4.2)), ADULT); // active hang, scapular pulls
  if (i === 1) return pullUp(kf<number>(((f + 12) % 44), [[0, 0.98], [8, 0.98], [38, 0.04, E.inOutSine], [44, 0.98, E.inOutCubic]]), ADULT); // negatives
  if (i === 2) return pullUp(0.5 - 0.5 * Math.cos((f / 32) * Math.PI * 2), ADULT); // strict reps
  const p = pullUp(0.5 - 0.5 * Math.cos(((f + 8) / 38) * Math.PI * 2), ADULT); // L-sit pull-ups
  return {...p, lN: {fk: [A(86), A(88)]}, lF: {fk: [A(90), A(92)]}, footN: A(60), footF: A(64)};
};
const A = (deg: number) => (deg * Math.PI) / 180;

// ---------- drawing helpers ----------
type Drawable = {z: number; node: React.ReactNode; layer?: number}; // layer: 0 geometry, 1 floor path, 2 people/equipment, 3 overlays

const Box: React.FC<{b: {x0: number; x1: number; z0: number; z1: number; top: number}; cam: Cam; o: number; id: string; depthMul?: number; topFill?: string; drop?: number}> = ({b, cam, o, id, depthMul = 1, topFill = '#4A4B51', drop: dropIn}) => {
  const pr = makeProjector(cam);
  const P = (x: number, y: number, z: number) => {
    const q = pr([x, y, z]);
    return `${q.x.toFixed(1)},${q.y.toFixed(1)}`;
  };
  const bz1 = b.z0 + (b.z1 - b.z0) * depthMul;
  const top = [P(b.x0, b.top, b.z0), P(b.x1, b.top, b.z0), P(b.x1, b.top, bz1), P(b.x0, b.top, bz1)].join(' ');
  const drop = (dropIn ?? b.top + 60) * depthMul;
  const front = [P(b.x0, b.top, b.z0), P(b.x1, b.top, b.z0), P(b.x1, b.top - drop, b.z0), P(b.x0, b.top - drop, b.z0)].join(' ');
  const sideX = cam.pos[0] > b.x1 ? b.x1 : b.x0;
  const side = [P(sideX, b.top, b.z0), P(sideX, b.top, bz1), P(sideX, b.top - drop, bz1), P(sideX, b.top - drop, b.z0)].join(' ');
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id={`bf${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3B41" />
          <stop offset="0.45" stopColor="#202125" />
          <stop offset="1" stopColor={C.ink} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`bs${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2C31" />
          <stop offset="0.5" stopColor="#18191C" />
          <stop offset="1" stopColor={C.ink} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={side} fill={`url(#bs${id})`} />
      <polygon points={front} fill={`url(#bf${id})`} />
      <polygon points={top} fill={topFill} />
    </g>
  );
};

const billboard = (anchor: V3, cam: Cam) => {
  const q = makeProjector(cam)(anchor);
  return {x: q.x, y: q.y, s: q.s / 2, z: q.z};
};

/** Soft overhead light shaft on the station (volumetric haze, very restrained). */
const LightShaft: React.FC<{cam: Cam; o: number}> = ({cam, o}) => {
  if (o <= 0.01) return null;
  const pr = makeProjector(cam);
  const top = pr([0, 900, 0]), bl = pr([-150, 0, -60]), br = pr([150, 0, 60]);
  const topW = 40 * top.s;
  const d = `M${top.x - topW} ${top.y}L${top.x + topW} ${top.y}L${br.x + 30} ${br.y}L${bl.x - 30} ${bl.y}Z`;
  return (
    <g opacity={o}>
      <defs>
        <linearGradient id="shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.light} stopOpacity="0" />
          <stop offset="0.55" stopColor={C.light} stopOpacity="0.05" />
          <stop offset="1" stopColor={C.light} stopOpacity="0.11" />
        </linearGradient>
      </defs>
      <path d={d} fill="url(#shaft)" filter="url(#glowL)" />
      <LightPool x={(bl.x + br.x) / 2} y={(bl.y + br.y) / 2} rx={330} ry={95} color={C.light} opacity={0.13} />
    </g>
  );
};

// ---------- the world renderer ----------
export const World: React.FC<{f: number; cam?: Cam}> = ({f, cam: camOverride}) => {
  const cam = camOverride ?? camAtF(f);
  const pr = makeProjector(cam);
  const items: Drawable[] = [];
  const depth = (p: V3) => pr(p).z;

  // --- station A (posts + bar) ---
  const solid = seg(f, 66, 112, E.inOutSine) * (1 - seg(f, 300, 330));
  const sink = seg(f, 300, 336, E.inOutCubic) * 260; // posts sink into the floor as the bar becomes platforms
  const barLift = seg(f, 296, 304, E.inOutCubic);
  if (solid > 0.01) {
    for (const z of [-POST_Z, POST_Z]) {
      items.push({z: depth([0, 120, z]) + 1, node: <Tube key={`post${z}`} a={[0, -sink, z]} b={[0, BAR_Y + 5 - sink, z]} r={5.2} cam={cam} id={`post${z}`} opacity={solid} />});
    }
    const barReal = seg(f, 180, 206, E.inOutCubic);
    items.push({
      z: depth([0, BAR_Y, 0]) - 2,
      node: (
        <g key="bar" opacity={1 - barLift}>
          <Tube a={[0, BAR_Y, -POST_Z - 8]} b={[0, BAR_Y, POST_Z + 8]} r={lerp(3.4, 3.1, barReal)} cam={cam} id="barT" color="#8E9098" hi="#E9DDD7" shade="#2A2B30" opacity={Math.max(solid * 0.6, barReal)} />
        </g>
      ),
    });
  }

  // --- the hook path outline (windows are cut in 3D, then projected) ---
  const hw = hookWindow(f);
  const seg3d = (a: number, b: number, extra: {head?: number; taper?: number; opacity?: number; glow?: number; wMul?: number} = {}) => {
    const sub = sub3(HOOK, HOOK_L, a, b);
    if (sub.length < 2) return null;
    const {p2, w} = project(sub, cam, 2.6 * (extra.wMul ?? 1), 2, 16 * (extra.wMul ?? 1));
    return <MotionPathW pts={p2} widths={w} to={1} head={extra.head ?? 0} taper={extra.taper ?? 0} opacity={extra.opacity ?? 1} glow={extra.glow ?? 0.5} />;
  };
  if (f < 330 && hw.to > 0 && f >= 50) {
    const o = hw.outline;
    const sub = sub3(HOOK, HOOK_L, o.from, o.to).map(([x, y, z]) => [x, -y, z] as V3);
    if (sub.length > 1) {
      const {p2, w} = project(sub, cam, 2.6, 2, 16);
      items.push({z: 1e7, layer: 0, node: <g key="refl" opacity={0.16 * (1 - seg(f, 184, 212))} filter="url(#glowS)"><MotionPathW pts={p2} widths={w} to={1} glow={0} core={0} /></g>});
    }
  }
  if (f < 330 && hw.to > 0) {
    const postsFade = 1 - seg(f, 184, 212); // post outlines dissolve; the bar outline condenses into steel
    const barFade = 1 - seg(f, 196, 222);
    const barGlow = seg(f, 176, 194) * (1 - seg(f, 200, 226));
    const [b0, b1] = hw.bar;
    const o = hw.outline;
    const drawing = o.to < F_DONE - 1e-4;
    items.push({
      z: -1e6,
      layer: 3,
      node: (
        <g key="hook">
          {f < 50 ? seg3d(o.from, o.to, {head: 18, taper: 0.5}) : (
            <>
              {seg3d(o.from, Math.min(o.to, b0), {opacity: postsFade, head: o.to < b0 ? 18 : 0})}
              {o.to > b0 ? seg3d(b0, Math.min(o.to, b1), {opacity: barFade, glow: 0.5 + barGlow * 0.4, wMul: 1 + barGlow * 0.7, head: o.to < b1 ? 18 : 0}) : null}
              {o.to > b1 ? seg3d(b1, o.to, {opacity: postsFade, head: drawing ? 18 : 0}) : null}
            </>
          )}
        </g>
      ),
    });
  }

  // --- athlete A ---
  if (f >= 90 && f < 352) {
    const a = athlete(f);
    const bb = billboard(a.anchor, cam);
    const j = solve(a.pose, ADULT);
    const ground = billboard([ATH_X, 0, 0], cam);
    items.push({
      z: bb.z - 5,
      node: (
        <g key="ath" opacity={a.o}>
          <ContactShadow x={ground.x} y={ground.y} w={150 * ground.s} opacity={0.5 * (a.grip ? 0.5 : 1)} />
          <Figure j={j} P={ADULT} o={OUTFITS.athlete} x={bb.x} y={bb.y} scale={bb.s} rim={{color: C.orange, dx: 2.6, dy: -1.2, opacity: 0.85}} />
        </g>
      ),
    });
  }

  // --- the bar splits into four glowing segments that land as the platforms' front edges ---
  if (f >= 290 && f < 360) {
    BLOCKS.forEach((b, i) => {
      const k = seg(f, 298 + i * 4, 324 + i * 4, E.inOutCubic);
      const z0 = -POST_Z + (i * 2 * POST_Z) / 4, z1 = -POST_Z + ((i + 1) * 2 * POST_Z) / 4;
      const A0: V3 = [0, BAR_Y, z0], A1: V3 = [0, BAR_Y, z1];
      const B0: V3 = [b.x0 + 2, b.top, EDGE_Z], B1: V3 = [b.x1 - 2, b.top, EDGE_Z];
      const mid = (p: V3, q: V3): V3 => [lerp(p[0], q[0], k), lerp(p[1], q[1], k) + Math.sin(k * Math.PI) * 60, lerp(p[2], q[2], k)];
      const line = [mid(A0, B0), mid(A1, B1)];
      const pts = Array.from({length: 12}, (_, n) => {
        const t = n / 11;
        return [lerp(line[0][0], line[1][0], t), lerp(line[0][1], line[1][1], t), lerp(line[0][2], line[1][2], t)] as V3;
      });
      const {p2, w} = project(pts, cam, 2.8, 2, 16);
      const glowIn = seg(f, 290, 298);
      items.push({z: -1e6 - i, layer: 3, node: <MotionPathW key={`segb${i}`} pts={p2} widths={w} to={1} opacity={glowIn * (1 - seg(f, 340, 356))} glow={0.6} />});
    });
  }

  // --- progression platforms with mini stations ---
  if (f >= 300) {
    BLOCKS.forEach((b, i) => {
      const grow = seg(f, 322 + i * 5, 346 + i * 5, E.outCubic);
      if (grow <= 0) return;
      const cx = (b.x0 + b.x1) / 2 + 10;
      const figA = seg(f, 334 + i * 5, 350 + i * 5) * (1 - seg(f, 378, 396));
      const gripY = b.top + MINI_GRIP;
      items.push({z: depth([cx, b.top, 0]) + 1, layer: 0, node: (
        <g key={`blkgeo${i}`}>
          <Box b={{...b, top: b.top}} cam={cam} o={grow} id={`b${i}`} depthMul={grow} />
          {(() => {
            const c = billboard([cx, b.top, 0], cam);
            return <LightPool x={c.x} y={c.y} rx={190 * c.s * 2} ry={46 * c.s * 2} color={C.light} opacity={0.16 * grow} />;
          })()}
        </g>
      )});
      items.push({
        z: depth([cx, b.top, 0]),
        node: (
          <g key={`blk${i}`}>
            {figA > 0 ? (
              <g opacity={figA}>
                {(() => {
                  const g = billboard([cx, gripY, 0], cam);
                  const pl = billboard([cx - 34, b.top, 0], cam), pr2 = billboard([cx + 34, b.top, 0], cam), bl2 = billboard([cx - 36, gripY, 0], cam), br2 = billboard([cx + 36, gripY, 0], cam);
                  const r = 2.4 * g.s * 2;
                  const pose = stageFigure(i, f);
                  return (
                    <>
                      <ContactShadow x={(pl.x + pr2.x) / 2} y={pl.y} w={90 * g.s * 2} opacity={0.4} />
                      <line x1={pl.x} y1={pl.y} x2={bl2.x} y2={bl2.y} stroke="#5A5B61" strokeWidth={r * 1.2} strokeLinecap="round" />
                      <line x1={pr2.x} y1={pr2.y} x2={br2.x} y2={br2.y} stroke="#5A5B61" strokeWidth={r * 1.2} strokeLinecap="round" />
                      <Figure j={solve(pose, ADULT)} P={ADULT} o={OUTFITS.athlete} x={g.x} y={g.y} scale={g.s * MINI} rim={{color: C.orange, dx: 2, dy: -1, opacity: 0.75}} />
                      <line x1={bl2.x} y1={bl2.y} x2={br2.x} y2={br2.y} stroke="#C9CBD2" strokeWidth={r} strokeLinecap="round" />
                    </>
                  );
                })()}
              </g>
            ) : null}
          </g>
        ),
      });
    });
  }

  // --- strength / control / skill pads (S3) ---
  if (f >= 380) {
    const near = cam.pos[2];
    const padBox = (p: {x: number; y: number; z: number}, id: string, o: number) => {
      if (p.z + 110 < near + 60) return null;
      return <Box b={{x0: p.x - 150, x1: p.x + 150, z0: Math.max(p.z - 120, near + 60), z1: p.z + 120, top: p.y}} cam={cam} o={o} id={id} drop={36} topFill="#3D3E44" />;
    };
    const P = PADS;
    const tS = (f - 380) / 30;
    const padO = (a: number, b: number, c: number, d: number) => seg(f, a, b) * (1 - seg(f, c, d));
    ([['pS', P.strength, padO(384, 400, 470, 486)], ['pC', P.control, padO(420, 440, 520, 536)], ['pK', P.skill, seg(f, 470, 490)]] as const).forEach(([id, p, o]) => {
      if (o <= 0.01) return;
      const node = padBox(p, id, 1);
      if (node) items.push({z: depth([p.x, p.y, p.z]) + 2, layer: 0, node: <g key={`pad${id}`} opacity={o}>{node}</g>});
    });
    const kS = wordAt3(1), kC = wordAt3(3), kK = wordAt3(5);
    // STRENGTH: push-ups; each press pulses the path under the pad
    {
      const o = seg(f, 384, 400) * (1 - seg(f, 470, 486));
      if (o > 0.01) {
        const d = f < 404 ? 0 : 0.5 - 0.5 * Math.cos(((f - 404) / 26) * Math.PI * 2);
        const g = billboard([P.strength.x, P.strength.y, P.strength.z], cam);
        const ph = f < 404 ? 1 : ((f - 404) % 26) / 26; // 0 = top of a press
        const pulse = f < 404 ? 0 : Math.exp(-ph * 7) * (f > 412 ? 1 : 0.5);
        if (g.z > 80) items.push({z: g.z, node: (
          <g key="stS" opacity={o}>
            <LightPool x={g.x + 70 * g.s} y={g.y} rx={260 * g.s} ry={70 * g.s} color={C.orange} opacity={0.42 * pulse} />
            <ContactShadow x={g.x - 40 * g.s} y={g.y} w={320 * g.s} />
            <Figure j={solve(pushUp(d), ADULT)} P={ADULT} o={OUTFITS.athlete} x={g.x + 70 * g.s} y={g.y} scale={g.s} rim={{color: C.orange, dx: 2.6, dy: -1.2, opacity: 0.85}} />
          </g>
        )});
      }
    }
    // CONTROL: tuck handstand → straight handstand on parallettes, aligning to an orange plumb line
    {
      const o = seg(f, 420, 440) * (1 - seg(f, 520, 536));
      if (o > 0.01) {
        const k = kf<number>(f, [[420, 2], [kC - 4, 2, E.linear], [kC + 16, 3, E.inOutCubic]]);
        const sway = Math.sin(tS * 3.1) * 4 * (1 - seg(f, kC + 6, kC + 30, E.inOutSine));
        const handY = P.control.y + 22;
        const g = billboard([P.control.x, handY, P.control.z], cam);
        const gp = billboard([P.control.x, P.control.y, P.control.z], cam);
        const plumb = seg(f, kC - 2, kC + 14, E.outCubic);
        if (g.z > 80) items.push({z: g.z, node: (
          <g key="stC" opacity={o}>
            <ContactShadow x={gp.x} y={gp.y} w={170 * gp.s} />
            <rect x={gp.x - 30 * gp.s} y={g.y - 2.5 * gp.s} width={60 * gp.s} height={5 * gp.s} rx={2.5 * gp.s} fill="#A9ABB3" />
            <rect x={gp.x - 25 * gp.s} y={g.y} width={4 * gp.s} height={Math.max(0, gp.y - g.y)} fill="#5A5B61" />
            <rect x={gp.x + 21 * gp.s} y={g.y} width={4 * gp.s} height={Math.max(0, gp.y - g.y)} fill="#5A5B61" />
            <Figure j={solve(pressHandstand(k, ADULT, sway), ADULT)} P={ADULT} o={OUTFITS.athlete} x={g.x} y={g.y} scale={g.s} rim={{color: C.orange, dx: 2.6, dy: -1.2, opacity: 0.85}} />
            {plumb > 0 ? <line x1={g.x} y1={gp.y + 30 * gp.s} x2={g.x} y2={gp.y + 30 * gp.s - 520 * gp.s * plumb} stroke={C.orange} strokeWidth={6} opacity={0.55} filter="url(#glowS)" /> : null}
            {plumb > 0 ? <line x1={g.x} y1={gp.y + 30 * gp.s} x2={g.x} y2={gp.y + 30 * gp.s - 520 * gp.s * plumb} stroke={C.orangeHot} strokeWidth={2.4} opacity={0.85} /> : null}
          </g>
        )});
      }
    }
    // SKILL: front lever progression (tuck → one leg → full) on a bar
    {
      const o = seg(f, 470, 490);
      if (o > 0.01) {
        const s2 = kf<number>(f, [[470, 0], [kK - 2, 0, E.linear], [kK + 10, 1, E.inOutCubic], [kK + 20, 2, E.inOutCubic], [kK + 32, 3, E.inOutCubic]]);
        const barY = P.skill.y + 250;
        const g = billboard([P.skill.x, barY, P.skill.z], cam);
        const line = seg(f, kK + 30, kK + 44, E.outCubic);
        const j = solve(frontLever(s2, ADULT), ADULT);
        if (g.z > 80) items.push({z: g.z, node: (
          <g key="stK" opacity={o}>
            <Tube a={[P.skill.x, P.skill.y, P.skill.z - 70]} b={[P.skill.x, barY + 5, P.skill.z - 70]} r={5} cam={cam} id="skA" />
            <Figure j={j} P={ADULT} o={OUTFITS.athlete} x={g.x} y={g.y} scale={g.s} rim={{color: C.orange, dx: 2.6, dy: -1.2, opacity: 0.85}} />
            <Tube a={[P.skill.x, barY, P.skill.z - 78]} b={[P.skill.x, barY, P.skill.z + 78]} r={3.6} cam={cam} id="skB" color="#8E9098" hi="#E9DDD7" shade="#2A2B30" />
            {line > 0 ? (() => {
              const y0 = g.y + (j.pelvis[1] + 2) * g.s;
              const xa = g.x + (j.shoulder[0] - 40) * g.s, xb = g.x + (j.shoulder[0] + (j.toeN[0] - j.shoulder[0] + 80) * line) * g.s;
              return (
                <>
                  <line x1={xa} y1={y0} x2={xb} y2={y0} stroke={C.orange} strokeWidth={6} opacity={0.55} filter="url(#glowS)" />
                  <line x1={xa} y1={y0} x2={xb} y2={y0} stroke={C.orangeHot} strokeWidth={2.4} opacity={0.85} />
                </>
              );
            })() : null}
            <Tube a={[P.skill.x, P.skill.y, P.skill.z + 70]} b={[P.skill.x, barY + 5, P.skill.z + 70]} r={5} cam={cam} id="skC" />
          </g>
        )});
      }
    }
    void tS; void kS;
  }

  // --- progression path (drawn on top of geometry) ---
  if (f >= 292) {
    const to = progTo(f);
    const sub = sub3(PROG, PROG_L, 0, to);
    if (sub.length > 1) {
      const boost = seg(f, 540, 584, E.inOutSine); // the closing rise gets bolder
      const {p2, w} = project(sub, cam, lerp(2.4, 5.2, boost), 1.5, lerp(16, 30, boost));
      items.push({z: -1e7, layer: f > 572 ? 3 : 1, node: <MotionPathW key="prog" pts={p2} widths={w} to={1} head={to < 0.999 ? lerp(16, 26, boost) : 0} glow={lerp(0.5, 0.75, boost)} />});
    }
  }

  // sort far → near (bigger camera depth first); paths (z=-1e6/-1e7) last
  items.sort((a, b) => (a.layer ?? 2) - (b.layer ?? 2) || b.z - a.z);

  // light following the path head while it draws (hook)
  const headLight = (() => {
    if (f > 124 || f < 6) return null;
    const p = pr(hookHead(f));
    return <LightPool x={p.x} y={p.y} rx={300} ry={300} color={C.orange} opacity={0.2 * seg(f, 6, 16) * (1 - seg(f, 104, 124))} />;
  })();

  const gridO = seg(f, 24, 90) * 0.1 * (1 - seg(f, 300, 340));
  const pool = billboard([0, 0, 0], cam);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <GlowDefs />
      <defs>
        <linearGradient id="runTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink} />
          <stop offset="0.45" stopColor="#2A2B30" />
          <stop offset="1" stopColor="#3E3F45" />
        </linearGradient>
      </defs>
      <FloorGrid cam={cam} opacity={gridO} extent={520} step={52} />
      {f < 360 ? <LightPool x={pool.x} y={pool.y} rx={420} ry={140} color="#5A5B61" opacity={0.35 * seg(f, 60, 110) * (1 - seg(f, 300, 350))} /> : null}
      {f < 360 ? <LightShaft cam={cam} o={seg(f, 70, 120) * (1 - seg(f, 300, 340))} /> : null}
      {headLight}
      {items.map((it, i) => <React.Fragment key={i}>{it.node}</React.Fragment>)}
    </svg>
  );
};

export const projectWorld = (f: number, p: V3): V2 => {
  const q = makeProjector(camAtF(f))(p);
  return [q.x, q.y];
};
