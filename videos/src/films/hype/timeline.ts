import vo from '../../vo3_timing.json';

export const FPS = 30;
export type VId = 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6' | 'V7' | 'V8' | 'V9';
type Line = {file: string; duration: number; words: Array<{w: string; start: number; end: number}>; env: number[]};
export const LINES = (vo as unknown as {lines: Record<VId, Line>}).lines;

/** Voice placement (seconds) — the edit is cut around these. */
const AT_S: Record<VId, number> = {V1: 0.66, V2: 1.78, V3: 3.66, V4: 5.06, V5: 6.95, V6: 9.08, V7: 12.32, V8: 14.92, V9: 17.12};
export const AT = Object.fromEntries(Object.entries(AT_S).map(([k, v]) => [k, Math.round(v * FPS)])) as Record<VId, number>;
export const END = Object.fromEntries((Object.keys(AT) as VId[]).map((k) => [k, AT[k] + Math.round(LINES[k].duration * FPS)])) as Record<VId, number>;
export const wAt = (id: VId, i: number) => AT[id] + LINES[id].words[Math.min(i, LINES[id].words.length - 1)].start * FPS;
export const TOTAL = END.V9 + 40;

/** Cut points (absolute frames where the next scene is fully in) and transition lengths. */
export const CUTS = {
  drop: 109, // home video → pull-up (light-leak overlay, hard cut)
  toHand: 150, // pull-up → handstand (wipe)
  toLever: 207, // handstand → lever (flip)
  toFlash: 241, // lever → 16th-note flashes (hard cut)
  toKids: 272, // flashes → kids (slide)
  toPills: 366, // kids → mosaic/pills (clock wipe)
  toFinale: 446, // pills → convergence + logo (hard cut)
};
export const TR = {toHand: 8, toLever: 10, toKids: 9, toPills: 12};
