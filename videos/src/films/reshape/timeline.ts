import vo from '../../vo_timing.json';
import {FPS} from '../../kit/theme';

/** Master timeline (frames @30fps). Scene windows overlap where an object carries the transition. */
export const TOTAL = 1335;

export const SCENES = {
  S1: {from: 0, to: 196}, // hook → camera pushes into the bar
  S2: {from: 176, to: 392}, // bar → pull-up → platforms
  S3: {from: 372, to: 616}, // strength / control / skill
  S4: {from: 596, to: 884}, // adults ↔ kids split
  S5: {from: 860, to: 1098}, // miniature facility
  S6: {from: 1076, to: TOTAL}, // convergence → logo → end card
} as const;
export type SceneId = keyof typeof SCENES;

/** Where each voice line starts (frame). */
export const VO_AT: Record<'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6', number> = {
  L1: 24, L2: 206, L3: 400, L4: 615, L5: 885, L6: 1118,
};

type Line = {file: string; duration: number; words: Array<{w: string; start: number; end: number}>};
const lines = (vo as unknown as {lines: Record<string, Line>}).lines;

/** Frame at which word i of a line starts / ends. */
export const wordAt = (id: keyof typeof VO_AT, i: number) => VO_AT[id] + lines[id].words[i].start * FPS;
export const wordEnd = (id: keyof typeof VO_AT, i: number) => VO_AT[id] + lines[id].words[i].end * FPS;
export const lineEnd = (id: keyof typeof VO_AT) => VO_AT[id] + lines[id].duration * FPS;
export const voLines = () => (Object.keys(VO_AT) as Array<keyof typeof VO_AT>).map((id) => ({id, at: VO_AT[id], file: lines[id].file, duration: lines[id].duration}));

/** Motion-blur samples per frame: more where the camera or subject moves fast, fewer on calm frames. */
const FAST: Array<[number, number]> = [
  [14, 62], [196, 216], [284, 336], [368, 416], [434, 464], [482, 514], [556, 640], [818, 926], [1054, 1128], [1134, 1166],
];
export const blurSamplesAt = (f: number, extraFast: Array<[number, number]> = []) =>
  [...FAST, ...extraFast].some(([a, b]) => f >= a && f <= b) ? 10 : 4;
