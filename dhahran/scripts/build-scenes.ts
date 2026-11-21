/**
 * Generates the club illustrations and their metadata.
 *   public/assets/scenes/level-{ground,upper}-{dark,light}.svg   one drawing per level
 *   public/assets/scenes/club-{landscape,portrait}-{dark,light}.svg  static exploded composites
 *   public/assets/scenes/zone-<id>-{dark,light}.svg               per-zone crops (4:3)
 *   src/content/generated/scene-meta.json                         layouts, cameras, anchors
 *
 * Output is deterministic; `npm run scenes:check` fails if committed files drift.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boxBounds, project } from '../src/features/explorer/scene/engine';
import { GROUPS, ZONE_ANCHORS, ZONE_BOUNDS, buildLevel, type Level } from '../src/features/explorer/scene/model';
import { stylesheet, type ThemeName } from '../src/features/explorer/scene/themes';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
let drift = false;

function emit(rel: string, content: string) {
  const file = join(root, rel);
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== content) {
      console.error(`drift: ${rel}`);
      drift = true;
    }
    return;
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log(`${rel}  ${(content.length / 1024).toFixed(1)} KiB`);
}

type Rect = { x: number; y: number; w: number; h: number };
const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const LEVELS: Level[] = ['ground', 'upper'];
const MARGIN = 14;

// Build both levels; register invisible anchors used for overlay alignment tests.
const built = Object.fromEntries(
  LEVELS.map((level) => {
    const s = buildLevel(level);
    s.setGroup(GROUPS[level][GROUPS[level].length - 1]);
    for (const [id, v] of Object.entries(ZONE_ANCHORS)) if (ZONE_BOUNDS[id].level === level) s.anchor(id, v);
    return [level, s];
  }),
) as Record<Level, ReturnType<typeof buildLevel>>;

// Same horizontal extent for both levels (identical plan outline) so they register when stacked.
const gb = built.ground.bounds(MARGIN);
const ub = built.upper.bounds(MARGIN);
const x0 = Math.min(gb.x, ub.x);
const x1 = Math.max(gb.x + gb.w, ub.x + ub.w);
const box: Record<Level, Rect> = {
  ground: { x: x0, y: gb.y, w: x1 - x0, h: gb.h },
  upper: { x: x0, y: ub.y, w: x1 - x0, h: ub.h },
};

const inner = (level: Level, theme: ThemeName, include?: (g: string) => boolean) =>
  `<style>${stylesheet(theme)}</style>${built[level].render(GROUPS[level], include)}`;
const open = (b: Rect) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(b.x)} ${round(b.y)} ${round(b.w)} ${round(b.h)}" width="${Math.round(b.w)}" height="${Math.round(b.h)}">`;

/**
 * Exploded layouts. Offsets are where each level's viewBox origin sits on the stage (px).
 * landscape: upper level slides up and to the right (desktop, tablet)
 * portrait:  upper level directly above the ground level (phones)
 */
const LAYOUTS = {
  landscape: { upper: { dx: 560, dy: -292 } },
  portrait: { upper: { dx: 0, dy: -610 } },
} as const;
type LayoutName = keyof typeof LAYOUTS;

function stageOf(layout: LayoutName) {
  const o = LAYOUTS[layout].upper;
  const g: Rect = { ...box.ground };
  const u: Rect = { x: box.upper.x + o.dx, y: box.upper.y + o.dy, w: box.upper.w, h: box.upper.h };
  const sx = Math.min(g.x, u.x);
  const sy = Math.min(g.y, u.y);
  const stage: Rect = { x: sx, y: sy, w: Math.max(g.x + g.w, u.x + u.w) - sx, h: Math.max(g.y + g.h, u.y + u.h) - sy };
  return { stage, rects: { ground: g, upper: u }, off: { ground: { dx: 0, dy: 0 }, upper: o } };
}

function fit(c: Rect, aspect: number): Rect {
  let { x, y, w, h } = c;
  if (w / h < aspect) {
    const nw = h * aspect;
    x -= (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    y -= (nh - h) / 2;
    h = nh;
  }
  return { x, y, w, h };
}

const zoneRect: Record<string, Rect> = {};
const zoneAnchor: Record<string, { x: number; y: number }> = {};
for (const [id, b] of Object.entries(ZONE_BOUNDS)) {
  zoneRect[id] = boxBounds(b.min, b.max, 40);
  const [ax, ay] = project(ZONE_ANCHORS[id]);
  zoneAnchor[id] = { x: ax, y: ay };
}

for (const theme of ['dark', 'light'] as ThemeName[]) {
  for (const level of LEVELS) emit(`public/assets/scenes/level-${level}-${theme}.svg`, `${open(box[level])}${inner(level, theme)}</svg>\n`);
  for (const layout of Object.keys(LAYOUTS) as LayoutName[]) {
    const { stage, off } = stageOf(layout);
    // nested <svg> keeps each level's own stylesheet scope identical to the level files
    const body = LEVELS.map(
      (level) => `<g transform="translate(${off[level].dx} ${off[level].dy})">${built[level].render(GROUPS[level])}</g>`,
    ).join('');
    emit(`public/assets/scenes/club-${layout}-${theme}.svg`, `${open(stage)}<style>${stylesheet(theme)}</style>${body}</svg>\n`);
  }
  for (const [id, rect] of Object.entries(zoneRect)) {
    const level = ZONE_BOUNDS[id].level;
    emit(`public/assets/scenes/zone-${id}-${theme}.svg`, `${open(fit(rect, 4 / 3))}${inner(level, theme)}</svg>\n`);
  }
}

const pct = (n: number) => round(n * 100, 3);
const meta = {
  levels: Object.fromEntries(LEVELS.map((l) => [l, { viewBox: [box[l].x, box[l].y, box[l].w, box[l].h] }])),
  layouts: Object.fromEntries(
    (Object.keys(LAYOUTS) as LayoutName[]).map((layout) => {
      const { stage, rects, off } = stageOf(layout);
      return [
        layout,
        {
          aspect: round(stage.w / stage.h, 4),
          // level boxes as percentages of the stage
          levels: Object.fromEntries(
            LEVELS.map((l) => [
              l,
              {
                left: pct((rects[l].x - stage.x) / stage.w),
                top: pct((rects[l].y - stage.y) / stage.h),
                width: pct(rects[l].w / stage.w),
                height: pct(rects[l].h / stage.h),
              },
            ]),
          ),
          // camera per zone: scale + translate (percent of the stage's own box, origin top-left)
          cameras: Object.fromEntries(
            Object.entries(zoneRect).map(([id, rect]) => {
              const o = off[ZONE_BOUNDS[id].level];
              const cam = fit({ x: rect.x + o.dx, y: rect.y + o.dy, w: rect.w, h: rect.h }, stage.w / stage.h);
              const s = stage.w / cam.w;
              return [id, { s: round(s, 4), tx: pct((-(cam.x - stage.x) / stage.w) * s), ty: pct((-(cam.y - stage.y) / stage.h) * s) }];
            }),
          ),
        },
      ];
    }),
  ),
  zones: Object.fromEntries(
    Object.keys(zoneRect).map((id) => {
      const level = ZONE_BOUNDS[id].level;
      const b = box[level];
      return [
        id,
        {
          level,
          // hotspot anchor as a percentage of its level drawing
          anchor: [pct((zoneAnchor[id].x - b.x) / b.w), pct((zoneAnchor[id].y - b.y) / b.h)],
        },
      ];
    }),
  ),
};
emit('src/content/generated/scene-meta.json', JSON.stringify(meta, null, 2) + '\n');

if (check && drift) {
  console.error('Generated scene files are out of date. Run: npm run scenes:build');
  process.exit(1);
}
