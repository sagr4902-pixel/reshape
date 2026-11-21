/**
 * RESHAPE Dhahran — building + concept fit-out model.
 *
 * Shell geometry (outline, mezzanine void, stairs, service block, columns,
 * storey heights, track lane, glazing) is taken from the supplied drawings
 * (see docs/assets/visual-analysis.md). Equipment and zone programming are a
 * CONCEPT: the drawings do not assign sports to areas.
 *
 * Drawing convention: sectional axonometric, exploded. Back walls are shown
 * full height, everything else is cut at CUT metres above its floor. Each
 * level is its own drawing; the page composes them as an exploded stack.
 */
import { SceneBuilder, boxBounds, type V2, type V3 } from './engine';

// ── Reference dimensions (metres), from fp-01 / fp-02 / in-03 ──────────────
export const W = 20.6;
export const D = 17.83;
const NOTCH_Y = 13.48; // west part of the south wall
const DIAG_A: V2 = [4.85, NOTCH_Y]; // diagonal entrance wall
const DIAG_B: V2 = [9.5, D];
const H_GROUND = 4.0;
const H_UPPER = 3.0;
const SLAB = 0.3;
const U = 0; // each level is drawn in its own file, with its floor at z = 0
const CUT = 1.4;

const OUTLINE: V2[] = [[0, 0], [W, 0], [W, D], DIAG_B, DIAG_A, [0, NOTCH_Y]];
const VOID: V2[] = [[8.55, 8.25], [19.57, 8.25], [19.57, 16.68], [9.9, 16.68], [8.55, 15.33]];
const TRACK_OUTER: V2[] = [[7.45, 7.15], [W, 7.15], [W, D], DIAG_B, [7.45, 15.91]];
const TRACK_LANE: V2[] = [[8.0, 7.7], [20.1, 7.7], [20.1, 17.25], [9.7, 17.25], [8.0, 15.65]];

export type Level = 'ground' | 'upper';
export const GROUPS: Record<Level, readonly string[]> = {
  ground: ['ground', 'kids-pavilion', 'calisthenics-hall', 'entrance', 'ground-front'],
  upper: ['upper', 'changing', 'performance-deck', 'track-loop', 'upper-front'],
};

export const ZONE_BOUNDS: Record<string, { min: V3; max: V3; level: 'ground' | 'upper' }> = {
  'calisthenics-hall': { min: [8.6, 0, 0], max: [W, D, 4.6], level: 'ground' },
  'kids-pavilion': { min: [1.2, 0, 0], max: [8.5, 6.7, 3.2], level: 'ground' },
  entrance: { min: [0, 6.7, 0], max: [9.5, D, 2.6], level: 'ground' },
  'track-loop': { min: [7.4, 7.1, 0], max: [W, D, 2.2], level: 'upper' },
  'performance-deck': { min: [8.5, 0, 0], max: [W, 7.1, 3], level: 'upper' },
  changing: { min: [0, 2, 0], max: [8.5, NOTCH_Y, 2.4], level: 'upper' },
};

export const ZONE_ANCHORS: Record<string, V3> = {
  'calisthenics-hall': [14.2, 12.4, 2.4],
  'kids-pavilion': [4.6, 3.4, 1.2],
  entrance: [5.6, 11.4, 1.6],
  'track-loop': [19.9, 12.6, 0.4],
  'performance-deck': [14.4, 3.6, 1.4],
  changing: [3.1, 8.2, 1.2],
};

const at = (p: V2, z: number): V3 => [p[0], p[1], z];
const ring = (pts: V2[], z: number): V3[] => pts.map((p) => at(p, z));

// ── Small symbol library ───────────────────────────────────────────────────

function column(s: SceneBuilder, x: number, y: number, z: number, h: number) {
  // steel I-column, drawn as a slim orange box (flange 0.22 × 0.3)
  s.box(x - 0.11, y - 0.15, z, 0.22, 0.3, h, 'col');
}

function panelLinesX(s: SceneBuilder, y: number, x0: number, x1: number, z0: number, h: number) {
  for (let z = z0 + h / 3; z < z0 + h - 0.1; z += h / 3) s.line([[x0, y, z], [x1, y, z]], 'joint', -50);
  for (let x = x0 + 2.575; x < x1 - 0.5; x += 2.575) s.line([[x, y, z0], [x, y, z0 + h]], 'joint', -50);
}
function panelLinesY(s: SceneBuilder, x: number, y0: number, y1: number, z0: number, h: number) {
  for (let z = z0 + h / 3; z < z0 + h - 0.1; z += h / 3) s.line([[x, y0, z], [x, y1, z]], 'joint', -50);
  for (let y = y0 + 2.25; y < y1 - 0.5; y += 2.25) s.line([[x, y, z0], [x, y, z0 + h]], 'joint', -50);
}

/** Pull-up frame: posts with a bar along the x or y axis. */
function barFrame(
  s: SceneBuilder,
  x: number,
  y: number,
  z: number,
  len: number,
  h: number,
  axis: 'x' | 'y',
  barCls = 'steel',
) {
  const b: V3 = axis === 'x' ? [x + len, y, z] : [x, y + len, z];
  s.line([[x, y, z], [x, y, z + h]], 'post');
  s.line([b, [b[0], b[1], z + h]], 'post');
  s.line([[x, y, z + h], [b[0], b[1], z + h]], barCls, x + y + len / 2 + 0.3);
}

function parallelBars(s: SceneBuilder, x: number, y: number, z: number, len = 2.2, h = 1.15) {
  for (const dy of [0, 0.55]) {
    s.line([[x, y + dy, z], [x, y + dy, z + h]], 'post');
    s.line([[x + len, y + dy, z], [x + len, y + dy, z + h]], 'post');
    s.line([[x - 0.15, y + dy, z + h], [x + len + 0.15, y + dy, z + h]], 'steel', x + y + len / 2 + 0.3);
  }
}

function stallBars(s: SceneBuilder, x: number, z: number, w = 1.0, h = 2.6) {
  // mounted on the north wall (y = 0)
  const y = 0.06;
  s.line([[x, y, z], [x, y, z + h]], 'post', 0.5);
  s.line([[x + w, y, z], [x + w, y, z + h]], 'post', 0.5);
  for (let k = 0.3; k < h; k += 0.26) s.line([[x, y, z + k], [x + w, y, z + k]], 'steel-thin', 0.6);
}

function rings(s: SceneBuilder, x: number, y: number, z: number, top: number, low: number) {
  for (const dx of [-0.25, 0.25]) {
    s.line([[x + dx, y, z + top], [x + dx, y, z + low + 0.12]], 'strap', x + y + 0.2);
    s.dot([x + dx, y, z + low], 0.11, 'ring', x + y + 0.25);
  }
}

function plates(s: SceneBuilder, x: number, y: number, z: number) {
  s.box(x, y, z, 0.45, 0.45, 0.08, 'gear');
  s.box(x + 0.04, y + 0.04, z + 0.08, 0.37, 0.37, 0.07, 'gear');
}

function climbTriangle(s: SceneBuilder, x: number, y: number, z: number) {
  const w = 1.1;
  const h = 0.95;
  for (const dy of [0, 0.8]) {
    s.line([[x, y + dy, z], [x + w / 2, y + dy, z + h], [x + w, y + dy, z]], 'post', x + y + 0.6);
  }
  for (const k of [0.25, 0.5, 0.75]) {
    s.line([[x + (w / 2) * k, y, z + h * k], [x + (w / 2) * k, y + 0.8, z + h * k]], 'steel-thin', x + y + 0.7);
    s.line([[x + w - (w / 2) * k, y, z + h * k], [x + w - (w / 2) * k, y + 0.8, z + h * k]], 'steel-thin', x + y + 0.9);
  }
  s.line([[x + w / 2, y, z + h], [x + w / 2, y + 0.8, z + h]], 'steel', x + y + 0.9);
}

function hurdle(s: SceneBuilder, x: number, y: number, z: number) {
  s.line([[x, y, z], [x, y, z + 0.3], [x, y + 0.7, z + 0.3], [x, y + 0.7, z]], 'steel-thin');
}

function sled(s: SceneBuilder, x: number, y: number, z: number) {
  s.box(x, y, z, 0.9, 0.6, 0.12, 'gear');
  s.line([[x + 0.8, y + 0.1, z + 0.12], [x + 0.8, y + 0.1, z + 0.95]], 'post');
  s.line([[x + 0.8, y + 0.5, z + 0.12], [x + 0.8, y + 0.5, z + 0.95]], 'post');
  s.box(x + 0.15, y + 0.12, z + 0.12, 0.36, 0.36, 0.14, 'gear');
}

// ── Figures (non-identifying pictograms) ───────────────────────────────────

type Joint = readonly [number, number, number]; // u (heading), v (across), z
interface Pose {
  head: Joint;
  lines: Joint[][];
}

const POSES: Record<string, Pose> = {
  stand: {
    head: [0, 0, 1.62],
    lines: [
      [[0, 0, 1.45], [0, 0, 0.9]],
      [[0, -0.2, 1.42], [0, 0.2, 1.42]],
      [[0, -0.2, 1.42], [0.05, -0.26, 0.95]],
      [[0, 0.2, 1.42], [0.05, 0.26, 0.95]],
      [[0, -0.1, 0.9], [0, -0.13, 0]],
      [[0, 0.1, 0.9], [0, 0.13, 0]],
    ],
  },
  coach: {
    head: [0, 0, 1.62],
    lines: [
      [[0, 0, 1.45], [0, 0, 0.9]],
      [[0, -0.2, 1.42], [0, 0.2, 1.42]],
      [[0, -0.2, 1.42], [0.3, -0.24, 1.2], [0.52, -0.2, 1.3]],
      [[0, 0.2, 1.42], [0.05, 0.26, 0.95]],
      [[0, -0.1, 0.9], [0, -0.13, 0]],
      [[0, 0.1, 0.9], [0, 0.13, 0]],
    ],
  },
  balance: {
    head: [0, 0, 1.62],
    lines: [
      [[0, 0, 1.45], [0, 0, 0.9]],
      [[0, -0.62, 1.48], [0, 0.62, 1.48]],
      [[0, 0, 0.9], [0.12, 0, 0]],
      [[0, 0, 0.9], [-0.14, 0, 0]],
    ],
  },
  hang: {
    // origin = point on the bar; body hangs below it
    head: [0, 0, -0.42],
    lines: [
      [[0, -0.28, 0], [0, -0.2, -0.58]],
      [[0, 0.28, 0], [0, 0.2, -0.58]],
      [[0, -0.2, -0.58], [0, 0.2, -0.58]],
      [[0, 0, -0.58], [0.03, 0, -1.12]],
      [[0.03, -0.09, -1.12], [0.12, -0.1, -1.95]],
      [[0.03, 0.09, -1.12], [0.12, 0.1, -1.95]],
    ],
  },
  lsit: {
    // hanging L-sit: legs held forward under the bar
    head: [0, 0, -0.42],
    lines: [
      [[0, -0.28, 0], [0, -0.2, -0.58]],
      [[0, 0.28, 0], [0, 0.2, -0.58]],
      [[0, -0.2, -0.58], [0, 0.2, -0.58]],
      [[0, 0, -0.58], [0, 0, -1.1]],
      [[0, -0.09, -1.1], [0.85, -0.09, -1.06]],
      [[0, 0.09, -1.1], [0.85, 0.09, -1.06]],
    ],
  },
  handstand: {
    head: [0, 0, 0.42],
    lines: [
      [[0, -0.2, 0], [0, -0.2, 0.6]],
      [[0, 0.2, 0], [0, 0.2, 0.6]],
      [[0, -0.2, 0.6], [0, 0.2, 0.6]],
      [[0, 0, 0.6], [0, 0, 1.15]],
      [[0, -0.08, 1.15], [0, -0.08, 1.98]],
      [[0, 0.08, 1.15], [0, 0.08, 1.98]],
    ],
  },
  run: {
    head: [0.2, 0, 1.6],
    lines: [
      [[0.14, 0, 1.44], [0, 0, 0.92]],
      [[0.14, 0, 1.42], [0.38, -0.2, 1.2], [0.52, -0.2, 1.38]],
      [[0.14, 0, 1.42], [-0.12, 0.2, 1.18], [-0.3, 0.2, 1.28]],
      [[0, 0, 0.92], [0.34, -0.08, 0.52], [0.3, -0.08, 0.02]],
      [[0, 0, 0.92], [-0.26, 0.08, 0.5], [-0.62, 0.08, 0.6]],
    ],
  },
};

function figure(
  s: SceneBuilder,
  pose: keyof typeof POSES,
  o: V3,
  heading: number, // radians, 0 = +x
  scale = 1,
  cls = 'fig',
) {
  const c = Math.cos(heading);
  const sn = Math.sin(heading);
  const tf = ([u, v, z]: Joint): V3 => [
    o[0] + (u * c - v * sn) * scale,
    o[1] + (u * sn + v * c) * scale,
    o[2] + z * scale,
  ];
  const depth = o[0] + o[1] + 0.5;
  const big = scale > 0.85 ? '' : ' sm';
  for (const l of POSES[pose].lines) s.line(l.map(tf), cls + big, depth);
  s.dot(tf(POSES[pose].head), 0.125 * scale, cls + '-head', depth + 0.01);
}

// ── Build ──────────────────────────────────────────────────────────────────

export function buildLevel(level: Level): SceneBuilder {
  const s = new SceneBuilder();
  if (level === 'ground') buildGround(s);
  else buildUpper(s);
  return s;
}

function buildGround(s: SceneBuilder) {

  // ── Ground level ─────────────────────────────────────────────────────────
  s.setGroup('ground');
  // plinth
  s.poly([at(DIAG_B, -0.2), [W, D, -0.2], [W, D, 0], at(DIAG_B, 0)], 'slab-l', -90);
  s.poly([[W, 0, -0.2], [W, D, -0.2], [W, D, 0], [W, 0, 0]], 'slab-r', -90);
  s.poly([at(DIAG_A, -0.2), at(DIAG_B, -0.2), at(DIAG_B, 0), at(DIAG_A, 0)], 'slab-d', -90);
  s.poly([[0, NOTCH_Y, -0.2], at(DIAG_A, -0.2), at(DIAG_A, 0), [0, NOTCH_Y, 0]], 'slab-l', -90);
  s.poly(ring(OUTLINE, 0), 'floor', -80);
  // back walls (full height) with concrete panel joints
  s.wall([0, 0], [W, 0], 0, H_GROUND, 'wall-n', -70);
  s.wall([0, 0], [0, NOTCH_Y], 0, H_GROUND, 'wall-w', -70);
  panelLinesX(s, 0, 0, W, 0, H_GROUND);
  panelLinesY(s, 0, 0, NOTCH_Y, 0, H_GROUND);
  // perimeter columns on the north wall (fp-01)
  for (const x of [4.55, 9.25, 12.2, 19.85]) column(s, x, 0.2, 0, H_GROUND);
  // emergency exit door on the north wall (in-08)
  s.poly([[6.2, 0.03, 0], [7.15, 0.03, 0], [7.15, 0.03, 2.1], [6.2, 0.03, 2.1]], 'door', 0.4);

  // service block floors (fp-19): lobby (speckled grey) + tiled room
  s.poly([[1.25, 6.75, 0.01], [4.6, 6.75, 0.01], [4.6, NOTCH_Y, 0.01], [1.25, NOTCH_Y, 0.01]], 'floor-lobby', -60);
  s.poly(
    [[4.6, 6.75, 0.01], [8.5, 6.75, 0.01], [8.5, 13.3, 0.01], [6.85, 15.35, 0.01], at(DIAG_A, 0.01), [4.6, NOTCH_Y, 0.01]],
    'floor-tile',
    -60,
  );

  // stairs along the west wall, rising north → (fp-01, ex-06)
  s.setGroup('entrance');
  const steps = 18;
  for (let i = 0; i < steps; i++) {
    const y = 12.3 - (i + 1) * (8.4 / steps);
    s.box(0.08, y, 0, 1.1, 8.4 / steps, ((i + 1) * 2.6) / steps, 'stair');
  }
  // service-block partitions, cut at CUT
  s.wall([1.25, 6.75], [8.5, 6.75], 0, CUT, 'part-n', 6.75 + 4.8);
  s.wall([1.25, 3.9], [1.25, 12.3], 0, CUT, 'part-w', 1.3 + 8);
  s.wall([4.6, 6.75], [4.6, 10.5], 0, CUT, 'part-w', 4.6 + 8.6);
  s.wall([4.6, 11.8], [4.6, NOTCH_Y], 0, CUT, 'part-w', 4.6 + 12.6);
  s.wall([8.5, 6.75], [8.5, 10.5], 0, CUT, 'part-w', 8.5 + 8.6);
  s.wall([8.5, 11.8], [8.5, 13.3], 0, CUT, 'part-w', 8.5 + 12.5);
  s.wall([8.5, 13.3], [6.85, 15.35], 0, CUT, 'part-d', 7.7 + 14.3);
  // concept: reception desk + bench + plants-free, calm lobby
  s.box(5.5, 8.2, 0, 2.2, 0.7, 1.05, 'desk');
  s.box(5.5, 8.9, 0, 0.6, 1.2, 1.05, 'desk');
  s.box(1.7, 8.2, 0, 0.5, 2.4, 0.45, 'bench');
  s.box(2.6, 12.6, 0, 1.6, 0.5, 0.45, 'bench');
  figure(s, 'stand', [6.4, 10.6, 0], -Math.PI / 2);
  figure(s, 'coach', [6.6, 7.7, 0], Math.PI / 2);
  column(s, 4.6, 13.2, 0, CUT + 0.6);

  // ── Kids pavilion (concept) — north-west bay under the mezzanine ─────────
  s.setGroup('kids-pavilion');
  const mats: [number, number, string][] = [
    [1.6, 0.7, 'mat-a'], [3.3, 0.7, 'mat-b'], [5.0, 0.7, 'mat-a'], [6.7, 0.7, 'mat-c'],
    [1.6, 2.4, 'mat-b'], [3.3, 2.4, 'mat-c'], [5.0, 2.4, 'mat-b'], [6.7, 2.4, 'mat-a'],
    [1.6, 4.1, 'mat-c'], [3.3, 4.1, 'mat-a'], [5.0, 4.1, 'mat-c'], [6.7, 4.1, 'mat-b'],
  ];
  for (const [x, y, c] of mats) s.poly([[x, y, 0.03], [x + 1.62, y, 0.03], [x + 1.62, y + 1.62, 0.03], [x, y + 1.62, 0.03]], c, -40);
  // low balance beam + coach alongside
  s.box(2.0, 3.2, 0.03, 3.2, 0.14, 0.26, 'beam');
  figure(s, 'balance', [3.4, 3.27, 0.29], 0, 0.68);
  figure(s, 'coach', [3.5, 4.15, 0.03], -Math.PI / 2);
  // low bars (1.15 m) and climbing triangle
  barFrame(s, 5.6, 1.5, 0.03, 1.5, 1.15, 'x');
  barFrame(s, 5.6, 2.3, 0.03, 1.5, 0.9, 'x');
  climbTriangle(s, 2.1, 1.0, 0.03);
  // soft blocks
  s.box(6.3, 4.4, 0.03, 0.7, 0.7, 0.35, 'soft-a');
  s.box(7.0, 4.7, 0.03, 0.6, 0.6, 0.6, 'soft-b');
  s.box(6.5, 5.15, 0.03, 0.5, 0.5, 0.25, 'soft-c');
  figure(s, 'stand', [5.2, 5.0, 0.03], 0.4, 0.66);
  figure(s, 'balance', [7.0, 3.4, 0.03], 1.2, 0.62);
  // stepping spots
  for (let i = 0; i < 5; i++) s.floorEllipse([2.2 + i * 0.75, 5.4 - (i % 2) * 0.4, 0.04], 0.2, 0.2, 'spot');

  // ── Calisthenics hall (concept) — main hall, double height under the void ─
  s.setGroup('calisthenics-hall');
  // free-standing columns (fp-01 mid row) + south row
  for (const [x, y] of [[8.53, 6.8], [12.2, 6.8], [18.5, 6.8]] as V2[]) column(s, x, y, 0, H_GROUND);
  // stall bars on the north wall
  for (const x of [13.2, 14.4, 15.6]) stallBars(s, x, 0);
  // main rig under the void: three bays of high bars + one signature bar
  const rigY = 10.6;
  for (let i = 0; i < 4; i++) {
    const x = 10.6 + i * 2.1;
    s.line([[x, rigY, 0], [x, rigY, 2.9]], 'post');
    s.line([[x, rigY + 2.2, 0], [x, rigY + 2.2, 2.9]], 'post');
    s.line([[x, rigY, 2.9], [x, rigY + 2.2, 2.9]], 'steel', x + rigY + 1.2);
    if (i < 3) {
      s.line([[x, rigY, 2.45], [x + 2.1, rigY, 2.45]], 'steel', x + rigY + 1.1);
      s.line([[x, rigY + 2.2, i === 1 ? 2.45 : 2.2], [x + 2.1, rigY + 2.2, i === 1 ? 2.45 : 2.2]], i === 1 ? 'bar-accent' : 'steel', x + rigY + 3.3);
    }
  }
  figure(s, 'hang', [11.65, rigY, 2.45], Math.PI / 2);
  figure(s, 'lsit', [13.75, rigY + 2.2, 2.45], Math.PI / 2);
  // tall ring station in the double-height void
  s.line([[17.6, 9.6, 0], [17.6, 9.6, 4.4]], 'post');
  s.line([[17.6, 12.4, 0], [17.6, 12.4, 4.4]], 'post');
  s.line([[17.6, 9.6, 4.4], [17.6, 12.4, 4.4]], 'steel', 17.6 + 11.2);
  rings(s, 17.6, 10.5, 0, 4.4, 2.3);
  rings(s, 17.6, 11.6, 0, 4.4, 1.5);
  // parallel bars + parallettes with a handstand
  parallelBars(s, 10.2, 14.6, 0);
  parallelBars(s, 13.4, 14.6, 0);
  s.line([[16.4, 15.0, 0.2], [17.0, 15.0, 0.2]], 'steel', 31.9);
  s.line([[16.4, 15.45, 0.2], [17.0, 15.45, 0.2]], 'steel', 32.3);
  figure(s, 'handstand', [16.7, 15.22, 0.2], 0);
  // street-lifting corner: dip/weight station + plates
  barFrame(s, 16.2, 2.6, 0, 1.6, 2.3, 'x');
  parallelBars(s, 16.3, 4.0, 0, 1.4, 1.3);
  plates(s, 18.4, 2.6, 0);
  plates(s, 18.4, 3.3, 0);
  plates(s, 19.0, 2.9, 0);
  // foundations area: low bars + coach
  barFrame(s, 10.0, 2.2, 0, 1.8, 1.6, 'x');
  barFrame(s, 10.0, 3.6, 0, 1.8, 2.2, 'x');
  figure(s, 'coach', [12.6, 3.3, 0], Math.PI);
  figure(s, 'stand', [15.2, 7.6, 0], 2.2);
  // floor lane marking — the "progression line" on the hall floor
  s.line([[9.4, 8.6, 0.02], [19.6, 8.6, 0.02]], 'floor-line', -30);
  s.line([[9.4, 16.2, 0.02], [19.6, 16.2, 0.02]], 'floor-line', -30);

  // ── Ground front: low cut walls ──────────────────────────────────────────
  s.setGroup('ground-front');
  const lowH = 0.32;
  s.wall([W, 0], [W, D], 0, lowH, 'cut-r', 200);
  s.wall(DIAG_B, [W, D], 0, lowH, 'cut-l', 200);
  s.wall(DIAG_A, DIAG_B, 0, lowH, 'cut-d', 200);
  s.wall([0, NOTCH_Y], DIAG_A, 0, lowH, 'cut-l', 200);
  for (const x of [9.6, 12.2, 19.85]) column(s, x, D - 0.2, 0, lowH + 0.5);

}

function buildUpper(s: SceneBuilder) {
  // ── Upper level ──────────────────────────────────────────────────────────
  s.setGroup('upper');
  // slab edges
  s.poly([at(DIAG_B, U - SLAB), [W, D, U - SLAB], [W, D, U], at(DIAG_B, U)], 'slab-l', -90);
  s.poly([[W, 0, U - SLAB], [W, D, U - SLAB], [W, D, U], [W, 0, U]], 'slab-r', -90);
  s.poly([at(DIAG_A, U - SLAB), at(DIAG_B, U - SLAB), at(DIAG_B, U), at(DIAG_A, U)], 'slab-d', -90);
  s.poly([[0, NOTCH_Y, U - SLAB], at(DIAG_A, U - SLAB), at(DIAG_A, U), [0, NOTCH_Y, U]], 'slab-l', -90);
  // void inner edges (visible faces)
  s.poly([at(VOID[0], U - SLAB), at(VOID[1], U - SLAB), at(VOID[1], U), at(VOID[0], U)], 'slab-l', -88);
  s.poly([at(VOID[0], U - SLAB), at(VOID[4], U - SLAB), at(VOID[4], U), at(VOID[0], U)], 'slab-r', -88);
  // stair opening
  const STAIR: V2[] = [[0.08, 3.9], [1.2, 3.9], [1.2, 12.3], [0.08, 12.3]];
  s.polyHoles(ring(OUTLINE, U), [ring(VOID, U), ring(STAIR, U)], 'floor-upper', -80);
  // corridor (speckled grey) + changing floor (tile)
  s.poly([[4.9, 0, U + 0.01], [7.45, 0, U + 0.01], [7.45, 15.91, U + 0.01], at(DIAG_A, U + 0.01), [4.9, NOTCH_Y, U + 0.01]], 'floor-lobby', -75);
  s.poly([[1.25, 2.6, U + 0.01], [4.9, 2.6, U + 0.01], [4.9, NOTCH_Y, U + 0.01], [1.25, NOTCH_Y, U + 0.01]], 'floor-tile', -75);
  // back walls
  s.wall([0, 0], [W, 0], U, H_UPPER, 'wall-n', -70);
  s.wall([0, 0], [0, NOTCH_Y], U, H_UPPER, 'wall-w', -70);
  panelLinesX(s, 0, 0, W, U, H_UPPER);
  panelLinesY(s, 0, 0, NOTCH_Y, U, H_UPPER);
  for (const x of [4.55, 9.25, 12.2, 19.85]) column(s, x, 0.2, U, H_UPPER);

  // changing rooms (fp-02, fp-18): cubicle partitions cut at CUT
  s.setGroup('changing');
  s.wall([1.25, 2.6], [4.9, 2.6], U, CUT, 'part-n', 5.7);
  s.wall([1.25, 2.6], [1.25, NOTCH_Y], U, CUT, 'part-w', 9.2);
  s.wall([4.9, 2.6], [4.9, 6.2], U, CUT, 'part-w', 9.3);
  s.wall([4.9, 7.2], [4.9, 11.0], U, CUT, 'part-w', 14);
  s.wall([4.9, 12.0], [4.9, NOTCH_Y], U, CUT, 'part-w', 17.6);
  s.wall([1.25, 8.2], [4.9, 8.2], U, CUT, 'part-n', 11.3);
  for (const y of [3.6, 4.7, 5.8]) s.wall([1.25, y], [2.6, y], U, CUT, 'part-n', y + 1.9);
  for (const y of [9.4, 10.5, 11.6]) s.wall([1.25, y], [2.6, y], U, CUT, 'part-n', y + 1.9);
  s.box(3.6, 3.2, U, 0.45, 2.4, 0.45, 'bench');
  s.box(3.6, 9.0, U, 0.45, 2.4, 0.45, 'bench');
  // counter + dark screen wall (fp-18, in-15)
  s.wall([7.0, 2.4], [8.45, 2.4], U, 2.1, 'screen', 10.1);
  s.box(6.9, 3.3, U, 1.5, 0.6, 1.0, 'desk');

  // performance deck (concept)
  s.setGroup('performance-deck');
  for (const [x, y] of [[12.2, 6.8], [18.5, 6.8]] as V2[]) column(s, x, y, U, H_UPPER);
  // turf lane with sled + hurdles + cones
  s.poly([[9.2, 4.6, U + 0.02], [19.8, 4.6, U + 0.02], [19.8, 6.3, U + 0.02], [9.2, 6.3, U + 0.02]], 'turf', -40);
  for (let x = 10.2; x < 19.6; x += 1.9) s.line([[x, 4.6, U + 0.03], [x, 6.3, U + 0.03]], 'turf-line', -39);
  sled(s, 10.4, 5.1, U + 0.02);
  for (const x of [14.0, 15.0, 16.0, 17.0]) hurdle(s, x, 5.1, U + 0.02);
  figure(s, 'run', [12.6, 5.45, U + 0.02], 0);
  // functional rig on the north wall side
  for (let i = 0; i < 4; i++) {
    const x = 9.6 + i * 1.9;
    s.line([[x, 0.9, U], [x, 0.9, U + 2.5]], 'post');
    s.line([[x, 2.3, U], [x, 2.3, U + 2.5]], 'post');
    s.line([[x, 0.9, U + 2.5], [x, 2.3, U + 2.5]], 'steel', x + 1.7);
    if (i < 3) {
      s.line([[x, 0.9, U + 2.5], [x + 1.9, 0.9, U + 2.5]], 'steel', x + 1.9);
      s.line([[x, 2.3, U + 2.5], [x + 1.9, 2.3, U + 2.5]], 'steel', x + 3.3);
    }
  }
  figure(s, 'hang', [12.45, 2.3, U + 2.5], Math.PI / 2);
  // boxes + kettlebell row
  s.box(16.4, 1.2, U, 0.75, 0.6, 0.6, 'soft-b');
  s.box(17.4, 1.2, U, 0.75, 0.6, 0.45, 'soft-b');
  s.box(18.4, 1.2, U, 0.75, 0.6, 0.75, 'soft-b');
  for (let i = 0; i < 5; i++) s.box(16.5 + i * 0.5, 2.8, U, 0.24, 0.24, 0.26, 'gear');
  figure(s, 'coach', [15.6, 3.4, U], 0.3);

  // track loop around the void (fp-18, in-14: red lanes) + glazing (in-16)
  s.setGroup('track-loop');
  s.polyHoles(ring(TRACK_OUTER, U + 0.02), [ring(VOID, U + 0.02)], 'track', -60);
  s.line([...ring(TRACK_LANE, U + 0.03), at(TRACK_LANE[0], U + 0.03)], 'lane', -59);
  // start marks
  s.line([[7.55, 10.0, U + 0.03], [8.45, 10.0, U + 0.03]], 'lane', -58);
  s.line([[14.0, 7.25, U + 0.03], [14.0, 8.15, U + 0.03]], 'lane', -58);
  figure(s, 'run', [20.08, 10.4, U + 0.02], Math.PI / 2);
  figure(s, 'run', [13.0, 7.68, U + 0.02], Math.PI);
  figure(s, 'run', [16.2, 17.25, U + 0.02], 0);
  // glazed void edge, cut at CUT — back edges first
  const gl = (a: V2, b: V2, depth: number) => {
    s.wall(a, b, U, CUT, 'glass', depth);
    s.line([at(a, U + CUT), at(b, U + CUT)], 'glass-edge', depth + 0.01);
  };
  gl(VOID[0], VOID[1], 22);
  gl(VOID[4], VOID[0], 20.5);

  s.setGroup('upper-front');
  gl(VOID[1], VOID[2], 32);
  gl(VOID[3], VOID[2], 34);
  gl(VOID[4], VOID[3], 26);
  const lowU = 0.32;
  s.wall([W, 0], [W, D], U, lowU, 'cut-r', 200);
  s.wall(DIAG_B, [W, D], U, lowU, 'cut-l', 200);
  s.wall(DIAG_A, DIAG_B, U, lowU, 'cut-d', 200);
  s.wall([0, NOTCH_Y], DIAG_A, U, lowU, 'cut-l', 200);
  for (const x of [9.6, 12.2, 19.85]) column(s, x, D - 0.2, U, lowU + 0.5);
}

/** Camera rectangles (unshifted scene px) for each zone. */
export function zoneCameras(pad = 46) {
  const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const [id, b] of Object.entries(ZONE_BOUNDS)) out[id] = boxBounds(b.min, b.max, pad);
  return out;
}
