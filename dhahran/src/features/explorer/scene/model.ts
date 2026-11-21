/**
 * RESHAPE Dhahran — club model for the explorer map.
 *
 * Source of truth (see docs/assets/visual-analysis.md):
 *  - Working drawings "Re-shape #3" (issue 20/08/2026): dimension plan, furniture
 *    layout plan (ground + mezzanine), sections.
 *  - Facade package Rev. 02 (05/11/2026): entrance wall and glazed bays.
 *  - Design submission deck (21 Aug 2026): materials and equipment types.
 *
 * All coordinates are interior metres, origin at the inner north-west corner,
 * x → east, y → south, z → up. Equipment positions follow the furniture layout
 * plan; shapes are simplified pictograms, not specifications.
 *
 * Drawing convention: sectional axonometric. Back walls are shown to storey
 * height, everything else is cut at CUT metres. Each level is its own drawing;
 * the page composes them as an exploded pair.
 */
import { SceneBuilder, boxBounds, depthAt as dp, type V2, type V3 } from './engine';

// ── Dimension plan (interior, metres) ──────────────────────────────────────
export const W = 19.67; // overall interior width
export const D = 17.83; // interior depth on the east side
const NOTCH_Y = 13.48; // west part: 3.88 + 9.60
const DIAG_A: V2 = [4.85, NOTCH_Y]; // diagonal facade wall, 6.37 long
const DIAG_B: V2 = [9.5, D];
const MEZZ_X = 8.63; // mezzanine edge = east face of the reception block
const BLOCK_Y = 6.68; // north face of the reception block (3.88 + 2.80)
const STAIR_W = 1.3;
const H_G = 3.45; // facade package: +3.450 level
const H_U = 2.5;
const CUT = 1.4;
const diagY = (x: number) => NOTCH_Y + ((x - DIAG_A[0]) * (D - NOTCH_Y)) / (DIAG_B[0] - DIAG_A[0]);

const OUTLINE: V2[] = [[0, 0], [W, 0], [W, D], DIAG_B, DIAG_A, [0, NOTCH_Y]];
const MEZZ: V2[] = [[0, 0], [MEZZ_X, 0], [MEZZ_X, diagY(MEZZ_X)], DIAG_A, [0, NOTCH_Y]];

export type Level = 'ground' | 'upper';
export const GROUPS: Record<Level, readonly string[]> = {
  ground: ['ground', 'strength', 'turf-cardio', 'rig', 'reception', 'juice-bar', 'entrance'],
  upper: ['upper', 'lockers', 'overlook', 'upper-front'],
};

export const ZONE_BOUNDS: Record<string, { min: V3; max: V3; level: Level }> = {
  entrance: { min: [0, 11.6, 0], max: [9.8, D, 2.6], level: 'ground' },
  reception: { min: [0, 6.2, 0], max: [5.0, 13.7, 2.8], level: 'ground' },
  'juice-bar': { min: [4.4, 6.4, 0], max: [10.0, 15.6, 2.8], level: 'ground' },
  strength: { min: [0, 0, 0], max: [8.8, 6.9, 3.2], level: 'ground' },
  'turf-cardio': { min: [8.0, 1.6, 0], max: [W, 12.2, 2.4], level: 'ground' },
  rig: { min: [11.6, 0, 0], max: [W, D, 3.4], level: 'ground' },
  lockers: { min: [0, 1.8, 0], max: [5.4, NOTCH_Y, 2.4], level: 'upper' },
  overlook: { min: [4.8, 0, 0], max: [MEZZ_X + 0.2, 17.2, 2.4], level: 'upper' },
};

export const ZONE_ANCHORS: Record<string, V3> = {
  entrance: [3.8, 13.9, 0.2],
  reception: [2.9, 9.0, 1.3],
  'juice-bar': [6.9, 11.2, 1.3],
  strength: [4.4, 3.4, 1.2],
  'turf-cardio': [14.6, 4.6, 0.9],
  rig: [18.6, 14.0, 2.5],
  lockers: [3.0, 4.9, 1.3],
  overlook: [7.2, 4.8, 1.2],
};

const at = (p: V2, z: number): V3 => [p[0], p[1], z];
const ring = (pts: V2[], z: number): V3[] => pts.map((p) => at(p, z));
const rect = (x0: number, y0: number, x1: number, y1: number, z: number): V3[] => [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]];

// ── Symbol library ─────────────────────────────────────────────────────────

/** Red steel I-column (0.20 flange per the dimension plan). */
function column(s: SceneBuilder, x: number, y: number, z: number, h: number) {
  s.box(x - 0.1, y - 0.13, z, 0.2, 0.26, h, 'col');
}

function joints(s: SceneBuilder, axis: 'x' | 'y', fixed: number, a: number, b: number, z0: number, h: number) {
  const P = (t: number, z: number): V3 => (axis === 'x' ? [t, fixed, z] : [fixed, t, z]);
  for (let z = z0 + h / 3; z < z0 + h - 0.1; z += h / 3) s.line([P(a, z), P(b, z)], 'joint', -50);
  for (let t = a + 2.4; t < b - 0.4; t += 2.4) s.line([P(t, z0), P(t, z0 + h)], 'joint', -50);
}

/** Wall-mounted rig: posts with pull-up bars between them, along x or y. */
function rig(s: SceneBuilder, posts: number[], fixed: number, depth: number, axis: 'x' | 'y', z = 0) {
  const H = 2.75;
  const P = (t: number, o: number, zz: number): V3 => (axis === 'x' ? [t, fixed + o, zz] : [fixed + o, t, zz]);
  posts.forEach((t, i) => {
    for (const o of [0, depth]) s.line([P(t, o, z), P(t, o, z + H)], 'post');
    s.line([P(t, 0, z + H), P(t, depth, z + H)], 'post');
    if (i < posts.length - 1) {
      const n = posts[i + 1];
      const dz = i % 2 ? 2.25 : 2.45; // bars at alternating heights
      s.line([P(t, depth, z + dz), P(n, depth, z + dz)], 'bar');
      s.line([P(t, 0, z + H), P(n, 0, z + H)], 'post');
    }
  });
}

function treadmill(s: SceneBuilder, x: number, y: number) {
  // deck runs north-south, console at the north end
  s.box(x, y, 0, 0.86, 2.0, 0.22, 'mach');
  s.poly(rect(x + 0.1, y + 0.45, x + 0.76, y + 1.9, 0.225), 'belt');
  s.line([[x + 0.06, y + 0.3, 0.22], [x + 0.06, y + 0.2, 1.35]], 'post');
  s.line([[x + 0.8, y + 0.3, 0.22], [x + 0.8, y + 0.2, 1.35]], 'post');
  s.box(x + 0.1, y + 0.1, 1.3, 0.66, 0.16, 0.2, 'mach');
}

function rower(s: SceneBuilder, x: number, y: number) {
  s.box(x + 0.18, y, 0, 0.16, 2.4, 0.3, 'mach');
  s.box(x, y, 0, 0.52, 0.5, 0.75, 'mach');
  s.box(x + 0.1, y + 1.5, 0.3, 0.32, 0.3, 0.08, 'seat');
}

function bike(s: SceneBuilder, x: number, y: number) {
  s.box(x + 0.16, y, 0, 0.2, 1.2, 0.12, 'mach');
  s.dot([x + 0.26, y + 0.28, 0.5], 0.33, 'fan');
  s.line([[x + 0.26, y + 0.75, 0.12], [x + 0.26, y + 0.9, 0.95]], 'post');
  s.box(x + 0.12, y + 0.82, 0.92, 0.28, 0.24, 0.08, 'seat');
  s.line([[x + 0.05, y + 0.42, 1.15], [x + 0.47, y + 0.42, 1.15]], 'post');
  s.line([[x + 0.26, y + 0.4, 0.5], [x + 0.26, y + 0.42, 1.15]], 'post');
}

function runner(s: SceneBuilder, x: number, y: number) {
  // curved self-powered treadmill, deck runs east-west
  s.box(x, y, 0, 1.25, 0.56, 0.3, 'mach');
  s.poly(rect(x + 0.35, y + 0.08, x + 1.2, y + 0.48, 0.305), 'belt');
  s.line([[x + 0.12, y + 0.04, 0.3], [x + 0.12, y + 0.04, 1.2], [x + 0.12, y + 0.52, 1.2], [x + 0.12, y + 0.52, 0.3]], 'post');
}

function squatRack(s: SceneBuilder, x: number, y: number) {
  for (const [dx, dy] of [[0, 0], [1.15, 0], [0, 1.5], [1.15, 1.5]] as V2[]) s.line([[x + dx, y + dy, 0], [x + dx, y + dy, 2.3]], 'post');
  s.line([[x, y, 2.3], [x + 1.15, y, 2.3]], 'post');
  s.line([[x, y + 1.5, 2.3], [x + 1.15, y + 1.5, 2.3]], 'post');
  s.line([[x, y, 2.3], [x, y + 1.5, 2.3]], 'post');
  s.line([[x + 1.15, y, 2.3], [x + 1.15, y + 1.5, 2.3]], 'post');
  barbell(s, [x - 0.5, y + 0.75, 1.35], [x + 1.65, y + 0.75, 1.35]);
  s.box(x + 0.3, y + 0.55, 0, 0.5, 1.25, 0.45, 'pad');
}

function barbell(s: SceneBuilder, a: V3, b: V3) {
  const depth = dp((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]) + 0.4;
  s.line([a, b], 'steel-thin', depth);
  s.dot(a, 0.22, 'plate', depth + 0.01);
  s.dot(b, 0.22, 'plate', depth + 0.01);
}

function chair(s: SceneBuilder, x: number, y: number, cls: string, backWest: boolean) {
  s.box(x, y, 0.38, 0.42, 0.42, 0.07, cls);
  const bx = backWest ? x : x + 0.38;
  s.box(bx, y, 0.45, 0.04, 0.42, 0.4, cls);
}

/** Chevron balustrade panel in a vertical plane of constant x, running along y. */
function chevrons(s: SceneBuilder, x: number, y0: number, y1: number, z: number, depth: number) {
  const step = 0.9;
  s.poly([[x, y0, z], [x, y1, z], [x, y1, z + 1.1], [x, y0, z + 1.1]], 'rail', depth);
  for (let y = y0 + 0.1, i = 0; y + step <= y1; y += step, i++) {
    const c = i % 2 ? 'chev-b' : 'chev-a';
    s.poly([[x, y, z + 0.08], [x, y + 0.38, z + 0.08], [x, y + 0.78, z + 0.56], [x, y + 0.4, z + 0.56]], c, depth + 0.001);
    s.poly([[x, y + 0.4, z + 0.56], [x, y + 0.78, z + 0.56], [x, y + 0.38, z + 1.04], [x, y, z + 1.04]], c, depth + 0.001);
  }
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

function figure(s: SceneBuilder, pose: keyof typeof POSES, o: V3, heading: number) {
  const c = Math.cos(heading);
  const sn = Math.sin(heading);
  const tf = ([u, v, z]: Joint): V3 => [o[0] + u * c - v * sn, o[1] + u * sn + v * c, o[2] + z];
  const depth = dp(o[0], o[1]) + 0.5;
  for (const l of POSES[pose].lines) s.line(l.map(tf), 'fig', depth);
  s.dot(tf(POSES[pose].head), 0.125, 'fig-head', depth + 0.01);
}

// ── Build ──────────────────────────────────────────────────────────────────

export function buildLevel(level: Level): SceneBuilder {
  const s = new SceneBuilder();
  if (level === 'ground') buildGround(s);
  else buildUpper(s);
  return s;
}

function buildGround(s: SceneBuilder) {
  s.setGroup('ground');
  // plinth
  s.poly([at(DIAG_B, -0.2), [W, D, -0.2], [W, D, 0], at(DIAG_B, 0)], 'slab-r', -90);
  s.poly([[0, 0, -0.2], [0, NOTCH_Y, -0.2], [0, NOTCH_Y, 0], [0, 0, 0]], 'slab-l', -90);
  s.poly([at(DIAG_A, -0.2), at(DIAG_B, -0.2), at(DIAG_B, 0), at(DIAG_A, 0)], 'slab-d', -90);
  s.poly([[0, NOTCH_Y, -0.2], at(DIAG_A, -0.2), at(DIAG_A, 0), [0, NOTCH_Y, 0]], 'slab-r', -90);
  s.poly(ring(OUTLINE, 0), 'floor', -80);

  // back walls with concrete panel joints
  s.wall([0, 0], [W, 0], 0, H_G, 'wall-n', -70);
  s.wall([W, 0], [W, D], 0, H_G, 'wall-w', -70);
  joints(s, 'x', 0, 0, W, 0, H_G);
  joints(s, 'y', W, 0, D, 0, H_G);
  // back door (1.10 wide, 6.43 from the west corner)
  s.poly([[6.43, 0.03, 0], [7.53, 0.03, 0], [7.53, 0.03, 2.15], [6.43, 0.03, 2.15]], 'door', -60);
  // columns on the north wall: 4.42 / 4.52 / 2.76 / 7.37 spacing
  for (const x of [4.52, 9.24, 12.2]) column(s, x, 0.16, 0, H_G);

  // floor finishes
  const blockFloor: V3[] = [[STAIR_W + 0.12, BLOCK_Y + 0.12, 0.01], [4.55, BLOCK_Y + 0.12, 0.01], [4.55, NOTCH_Y, 0.01], [0, NOTCH_Y, 0.01], [0, 12.2, 0.01], [STAIR_W + 0.12, 12.2, 0.01]];
  s.poly(blockFloor, 'terrazzo', -60);
  s.poly(
    [[4.55, BLOCK_Y + 0.12, 0.01], [8.43, BLOCK_Y + 0.12, 0.01], [8.43, 13.27, 0.01], [6.7, diagY(6.7), 0.01], at(DIAG_A, 0.01), [4.55, NOTCH_Y, 0.01]],
    'tile',
    -60,
  );
  // turf lane with distance marks
  s.poly(rect(9.7, 2.23, 19.5, 4.42, 0.02), 'turf', -55);
  for (let x = 10.3; x < 19.3; x += 0.9) {
    s.line([[x, 2.7, 0.03], [x + 0.35, 2.7, 0.03]], 'turf-line', -54);
    s.line([[x + 0.45, 3.95, 0.03], [x + 0.8, 3.95, 0.03]], 'turf-line', -54);
  }

  // ── Strength area "Re.Build" — north-west, under the mezzanine ───────────
  s.setGroup('strength');
  squatRack(s, 1.7, 0.9);
  squatRack(s, 1.7, 3.9);
  s.box(3.25, 0.45, 0, 1.1, 1.3, 1.5, 'mach'); // cable / plate machine
  s.box(5.0, 0.5, 0, 0.45, 1.5, 0.45, 'pad'); // bench
  s.line([[4.75, 0.9, 0.9], [5.7, 0.9, 0.9]], 'steel-thin');
  // lifting platform with barbell
  s.poly(rect(3.1, 3.16, 5.67, 4.42, 0.03), 'platform', -40);
  barbell(s, [3.45, 3.79, 0.24], [5.3, 3.79, 0.24]);
  // dumbbell racks along the reception wall
  s.box(2.5, 6.0, 0, 1.45, 0.5, 0.75, 'mach');
  s.box(4.05, 6.0, 0, 1.5, 0.5, 0.75, 'mach');
  for (let x = 2.62; x < 5.45; x += 0.3) s.dot([x, 6.5, 0.8], 0.09, 'plate');
  s.box(7.6, 6.05, 0, 0.8, 0.5, 1.2, 'mach');
  s.box(8.0, 0.4, 0, 0.9, 0.6, 1.1, 'mach');
  // free-standing columns along the reception wall line
  column(s, STAIR_W + 0.2, BLOCK_Y, 0, H_G);
  column(s, 4.65, BLOCK_Y, 0, H_G);
  figure(s, 'stand', [6.4, 3.9, 0], 2.6);

  // ── Turf lane and cardio ─────────────────────────────────────────────────
  s.setGroup('turf-cardio');
  for (const y of [2.08, 3.05, 4.05]) runner(s, 8.2, y);
  // tyre at the east end of the lane
  s.floorEllipse([18.25, 3.32, 0.05], 0.72, 0.72, 'tyre');
  s.floorEllipse([18.25, 3.32, 0.4], 0.72, 0.72, 'tyre-top');
  s.floorEllipse([18.25, 3.32, 0.41], 0.36, 0.36, 'tyre-hole');
  // sled on the lane
  s.box(11.2, 3.0, 0.02, 0.9, 0.6, 0.12, 'mach');
  s.line([[11.95, 3.08, 0.14], [11.95, 3.08, 0.95]], 'post');
  s.line([[11.95, 3.52, 0.14], [11.95, 3.52, 0.95]], 'post');
  figure(s, 'run', [12.9, 3.3, 0.02], Math.PI);
  for (const x of [9.65, 10.78, 11.92]) rower(s, x, 5.4);
  for (const x of [13.0, 14.47, 15.93]) treadmill(s, x, 5.58);
  // soft plyo boxes (3 × 2)
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) s.box(17.5 + i * 0.5, 6.03 + j * 0.5, 0, 0.48, 0.48, j ? 0.5 : 0.75, 'plyo');
  for (const x of [13.15, 14.35, 15.55]) bike(s, x, 8.3);
  for (const x of [13.3, 14.8]) bike(s, x, 10.4);
  // kettlebells beside the lane
  for (let i = 0; i < 6; i++) s.box(9.9 + i * 0.32, 1.55, 0, 0.2, 0.2, 0.24, 'kb');

  // ── Bars, rigs and rings (perimeter of the double-height hall) ───────────
  s.setGroup('rig');
  // wall bars (red ladder) on the north wall
  s.poly([[10.2, 0.06, 0.1], [11.3, 0.06, 0.1], [11.3, 0.06, 3.2], [10.2, 0.06, 3.2]], 'ladder', -60);
  for (let z = 0.35; z < 3.15; z += 0.28) s.line([[10.2, 0.07, z], [11.3, 0.07, z]], 'ladder-rung', -59);
  // north-east rig
  rig(s, [13.9, 15.2, 16.4, 18.0, 19.3], 0.2, 0.93, 'x');
  // rings hung from the north-east rig
  for (const x of [16.95, 17.45]) {
    s.line([[x, 1.13, 2.75], [x, 1.13, 1.95]], 'strap');
    s.dot([x, 1.13, 1.83], 0.11, 'ring');
  }
  // low bars on the east wall
  for (let i = 0; i < 6; i++) {
    const y = 8.05 + i * 0.52;
    const h = 0.75 + (i % 3) * 0.22;
    s.line([[17.6, y, 0], [17.6, y, h]], 'post');
    s.line([[17.6, y, h], [19.55, y, h]], 'bar-wood');
  }
  // east and south rigs
  rig(s, [11.3, 12.5, 13.65, 15.4, 16.65], 18.3, 1.2, 'y');
  rig(s, [12.3, 13.5, 15.3, 16.5, 17.7], 16.4, 1.2, 'x');
  figure(s, 'hang', [19.5, 14.5, 2.25], Math.PI);
  figure(s, 'hang', [14.4, 17.6, 2.25], -Math.PI / 2);
  // barbell on the floor (layout plan)
  barbell(s, [10.7, 12.87, 0.22], [12.2, 14.35, 0.22]);
  for (const x of [9.72, 12.2, W - 0.12]) column(s, x, D - 0.16, 0, 0.9);

  // ── Reception and store ──────────────────────────────────────────────────
  s.setGroup('reception');
  // stairs along the west wall: bottom near the entrance, rising north
  const steps = 20;
  const run = (12.2 - 3.88) / steps;
  for (let i = 0; i < steps && ((i + 1) * H_G) / steps <= CUT + 0.05; i++) s.box(0.05, 12.2 - (i + 1) * run, 0, STAIR_W - 0.05, run, ((i + 1) * H_G) / steps, 'stair');
  // block walls, cut at CUT (new walls on the dimension plan)
  s.wall([STAIR_W + 0.06, 3.88], [STAIR_W + 0.06, 11.98], 0, CUT, 'part-w');
  s.wall([STAIR_W + 0.06, BLOCK_Y], [2.5, BLOCK_Y], 0, CUT, 'part-n');
  s.wall([4.55, BLOCK_Y], [8.53, BLOCK_Y], 0, CUT, 'part-n');
  s.wall([4.65, BLOCK_Y], [4.65, 9.38], 0, CUT, 'part-w');
  s.wall([4.65, 12.38], [4.65, NOTCH_Y], 0, CUT, 'part-w');
  // back counter and gold reception desk
  s.box(2.56, 6.95, 0, 1.9, 0.5, 0.9, 'counter');
  s.box(2.6, 8.35, 0, 1.8, 0.75, 1.05, 'gold');
  // RESHAPE STORE shelving along the stair wall
  s.box(STAIR_W + 0.15, 10.15, 0, 0.7, 0.62, 1.4, 'shelf');
  s.box(STAIR_W + 0.15, 10.8, 0, 0.7, 0.62, 1.4, 'shelf');
  s.box(STAIR_W + 0.15, 11.45, 0, 0.7, 0.62, 1.4, 'shelf');
  figure(s, 'stand', [3.5, 7.8, 0], Math.PI / 2);
  figure(s, 'stand', [3.3, 10.4, 0], -1.2);

  // ── Juice bar ────────────────────────────────────────────────────────────
  s.setGroup('juice-bar');
  s.box(4.9, 6.95, 0, 2.85, 0.5, 0.9, 'counter');
  s.box(4.95, 8.35, 0, 2.6, 0.75, 1.05, 'bar-black');
  // communal table with eight chairs
  s.box(6.45, 11.0, 0, 0.58, 2.6, 0.7, 'table-base');
  s.box(6.23, 10.8, 0.7, 1.02, 3.0, 0.08, 'table');
  for (let i = 0; i < 4; i++) {
    chair(s, 5.72, 10.95 + i * 0.72, i % 2 ? 'chair-b' : 'chair-a', true);
    chair(s, 7.34, 10.95 + i * 0.72, i % 2 ? 'chair-a' : 'chair-b', false);
  }
  // east wall of the block: 2.50 solid, 1.70 opening, 2.39 solid, 2.45 splay
  s.wall([8.53, BLOCK_Y], [8.53, 9.18], 0, CUT, 'part-w');
  s.wall([8.53, 10.88], [8.53, 13.27], 0, CUT, 'part-w');
  s.wall([8.53, 13.27], [6.76, diagY(6.76)], 0, CUT, 'part-d');
  // red portal into the training hall (2.00 wide, 1.00 deep)
  for (const [x, y] of [[8.63, 9.03], [9.63, 9.03], [8.63, 11.03], [9.63, 11.03]] as V2[]) s.box(x - 0.06, y - 0.06, 0, 0.12, 0.12, 2.4, 'col');
  s.box(8.57, 8.97, 2.4, 1.12, 2.12, 0.22, 'col');
  column(s, 8.53, BLOCK_Y, 0, H_G);

  // ── Facade: entrance wall and glazed bays (facade package Rev. 02) ───────
  s.setGroup('entrance');
  const low = 0.32;
  s.wall([0, 0], [0, NOTCH_Y], 0, low, 'cut-l', 200);
  s.wall(DIAG_B, [W, D], 0, low, 'cut-r', 200);
  const gl = (a: V2, b: V2, h: number, depth: number) => {
    s.wall(a, b, 0, h, 'glass', depth);
    s.line([at(a, 0), at(a, h), at(b, h), at(b, 0)], 'frame', depth + 0.01);
  };
  // entrance wall: glazed bay 2.388 + double door bay 1.979
  s.wall([0, NOTCH_Y], [0.33, NOTCH_Y], 0, CUT, 'part-n', 201);
  gl([0.33, NOTCH_Y], [2.72, NOTCH_Y], CUT, 201.1);
  // double door (D01: 1.979 bay), leaves open into the lobby
  s.wall([2.8, NOTCH_Y], [2.95, NOTCH_Y - 0.95], 0, CUT, 'door-leaf', 201.3);
  s.wall([4.78, NOTCH_Y], [4.63, NOTCH_Y - 0.95], 0, CUT, 'door-leaf', 201.4);
  s.wall([2.72, NOTCH_Y], [2.8, NOTCH_Y], 0, CUT, 'part-n', 201.2);
  s.wall([4.78, NOTCH_Y], [4.85, NOTCH_Y], 0, CUT, 'part-n', 201.2);
  // diagonal wall: 0.73 solid, 1.90 bay, 0.20 pier, 3.11 bay, 0.33
  const along = (d: number): V2 => [DIAG_A[0] + (d / 6.37) * (DIAG_B[0] - DIAG_A[0]), DIAG_A[1] + (d / 6.37) * (D - NOTCH_Y)];
  s.wall(along(0), along(0.73), 0, CUT, 'part-d', 202);
  gl(along(0.73), along(2.63), CUT, 202.1);
  s.wall(along(2.63), along(2.83), 0, CUT, 'part-d', 202.2);
  gl(along(2.83), along(5.94), CUT, 202.3);
  s.wall(along(5.94), along(6.37), 0, CUT, 'part-d', 202.4);
}

function buildUpper(s: SceneBuilder) {
  const SL = 0.2;
  s.setGroup('upper');
  // slab edges: east edge over the hall, diagonal and entrance wall
  s.poly([[0, 0, -SL], [0, NOTCH_Y, -SL], [0, NOTCH_Y, 0], [0, 0, 0]], 'slab-l', -90);
  s.poly([at(DIAG_A, -SL), at(MEZZ[2], -SL), at(MEZZ[2], 0), at(DIAG_A, 0)], 'slab-d', -90);
  s.poly([[0, NOTCH_Y, -SL], at(DIAG_A, -SL), at(DIAG_A, 0), [0, NOTCH_Y, 0]], 'slab-r', -90);
  const STAIR: V2[] = [[0.05, 3.88], [STAIR_W, 3.88], [STAIR_W, 12.2], [0.05, 12.2]];
  s.polyHoles(ring(MEZZ, 0), [ring(STAIR, 0)], 'terrazzo', -80);
  // changing-room tile
  s.poly(rect(STAIR_W + 0.13, 2.6, 5.07, NOTCH_Y, 0.01), 'tile-grey', -75);
  s.wall([0, 0], [MEZZ_X, 0], 0, H_U, 'wall-n', -70);
  joints(s, 'x', 0, 0, MEZZ_X, 0, H_U);
  for (const x of [4.52, MEZZ_X - 0.12]) column(s, x, 0.16, 0, H_U);
  // chevron balustrade along the mezzanine edge over the hall (design deck)
  chevrons(s, MEZZ_X - 0.03, 0.15, diagY(MEZZ_X) - 0.15, 0, -66);
  column(s, MEZZ_X - 0.1, BLOCK_Y, 0, H_U);

  // ── Lockers, changing rooms and restrooms ────────────────────────────────
  s.setGroup('lockers');
  const P = (a: V2, b: V2, cls: string) => s.wall(a, b, 0, CUT, cls);
  P([STAIR_W + 0.13, 2.6], [5.07, 2.6], 'part-n');
  P([STAIR_W + 0.13, 2.6], [STAIR_W + 0.13, NOTCH_Y], 'part-w');
  P([5.07, 2.6], [5.07, 6.2], 'part-w');
  P([5.07, 7.2], [5.07, 8.92], 'part-w');
  P([5.07, 9.9], [5.07, NOTCH_Y], 'part-w');
  P([STAIR_W + 0.13, 6.84], [3.2, 6.84], 'part-n');
  P([4.0, 6.84], [5.07, 6.84], 'part-n');
  P([STAIR_W + 0.13, 7.85], [3.2, 7.85], 'part-n');
  P([3.2, 6.84], [3.2, 7.3], 'part-w');
  P([3.2, 7.85], [3.2, 8.4], 'part-w');
  P([STAIR_W + 0.13, 8.92], [5.07, 8.92], 'part-n');
  P([STAIR_W + 0.13, 11.0], [2.4, 11.0], 'part-n');
  P([3.36, 11.0], [5.07, 11.0], 'part-n');
  P([2.4, 11.0], [2.4, NOTCH_Y], 'part-w');
  P([3.36, 11.0], [3.36, NOTCH_Y], 'part-w');
  P([3.36, 12.2], [5.07, 12.2], 'part-n');
  // blue locker bank and benches
  s.box(4.42, 2.75, 0, 0.55, 3.9, CUT, 'locker');
  for (let y = 3.1; y < 6.6; y += 0.5) s.line([[4.42, y, 0.1], [4.42, y, CUT]], 'locker-line');
  s.box(2.1, 3.6, 0, 1.6, 0.42, 0.45, 'bench');
  s.box(2.1, 5.2, 0, 1.6, 0.42, 0.45, 'bench');
  // vanity
  s.box(1.6, 9.0, 0, 2.2, 0.6, 0.85, 'vanity');
  figure(s, 'stand', [3.6, 4.6, 0], 0.4);

  // ── Walkway over the hall and office ─────────────────────────────────────
  s.setGroup('overlook');
  // corridor lockers on the room wall
  s.box(5.14, 2.9, 0, 0.5, 3.1, CUT, 'locker-grey');
  // glazed office at the south end
  const g = (a: V2, b: V2) => {
    const d = dp((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, CUT / 2);
    s.wall(a, b, 0, CUT, 'glass', d);
    s.line([at(a, CUT), at(b, CUT)], 'glass-edge', d + 0.01);
  };
  g([5.07, 8.92], [6.68, 8.92]);
  g([7.33, 8.92], [7.55, 8.92]);
  s.box(5.5, 10.6, 0, 1.5, 0.7, 0.75, 'desk');
  s.box(6.0, 11.6, 0, 0.5, 0.5, 0.5, 'seat');
  figure(s, 'stand', [7.0, 2.2, 0], 0.2);
  column(s, 4.65, BLOCK_Y, 0, H_U);

  s.setGroup('upper-front');
  g([7.55, 8.92], [7.55, diagY(7.55) - 0.1]);
  // upper glazed bays on the diagonal facade wall; low cut on the entrance wall
  s.wall(DIAG_A, MEZZ[2], 0, CUT, 'glass', 301);
  s.line([at(DIAG_A, 0), at(DIAG_A, CUT), at(MEZZ[2], CUT), at(MEZZ[2], 0)], 'frame', 301.1);
  s.wall([0, NOTCH_Y], DIAG_A, 0, 0.32, 'cut-r', 302);
  s.wall([0, 0], [0, 3.88], 0, 0.32, 'cut-l', 302);
  s.wall([0, 12.2], [0, NOTCH_Y], 0, 0.32, 'cut-l', 302);
}

/** Camera rectangles (unshifted scene px) for each zone. */
export function zoneCameras(pad = 40) {
  const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
  for (const [id, b] of Object.entries(ZONE_BOUNDS)) out[id] = boxBounds(b.min, b.max, pad);
  return out;
}
