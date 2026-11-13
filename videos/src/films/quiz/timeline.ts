import vo from '../../vo2_timing.json';

/** v2 quiz timeline. Voice lines are laid end to end with the gaps below (seconds); everything else keys off them. */
export const FPS = 30;
type LineId = 'H1' | 'H2' | 'H3' | 'H4' | 'R1a' | 'R1b' | 'R1c' | 'R2a' | 'R2b' | 'R2c' | 'R3a' | 'R3b' | 'R3c' | 'A1' | 'A2' | 'A3' | 'A4' | 'T1' | 'P1' | 'P2' | 'P3' | 'C1';
export type Line = {file: string; duration: number; text: string; words: Array<{w: string; start: number; end: number}>; env: number[]; bars: number[]};
export const LINES = (vo as unknown as {lines: Record<LineId, Line>}).lines;

export const COUNTDOWN = 1.5; // seconds of 3-2-1 after each round question
const SEQ: Array<[LineId, number]> = [
  ['H1', 0.3], ['H2', 0.12], ['H3', 0.15], ['H4', 0.15],
  ['R1a', 0.6], ['R1b', 0.12], ['R1c', 0.14],
  ['R2a', COUNTDOWN + 0.25], ['R2b', 0.12], ['R2c', 0.12],
  ['R3a', COUNTDOWN + 0.25], ['R3b', 0.12], ['R3c', 0.14],
  ['A1', COUNTDOWN + 0.3], ['A2', 0.15], ['A3', 0.12], ['A4', 0.15],
  ['T1', 0.45], ['P1', 0.35], ['P2', 0.15], ['P3', 0.15], ['C1', 0.3],
];

export const AT = {} as Record<LineId, number>; // start frame of each line
export const END = {} as Record<LineId, number>; // end frame of each line
{
  let t = 0;
  for (const [id, gap] of SEQ) {
    t += gap;
    AT[id] = Math.round(t * FPS);
    t += LINES[id].duration;
    END[id] = Math.round(t * FPS);
  }
}
export const TOTAL = END.C1 + Math.round(2.4 * FPS);
export const wordAt = (id: LineId, i: number) => AT[id] + LINES[id].words[Math.min(i, LINES[id].words.length - 1)].start * FPS;
export const SEQ_IDS = SEQ.map(([id]) => id);
export type {LineId};

/** Section windows (frames). */
export const SEC = {
  hook: {from: 0, to: AT.R1a - 4},
  r1: {from: AT.R1a - 14, to: AT.R2a - 4},
  r2: {from: AT.R2a - 14, to: AT.R3a - 4},
  r3: {from: AT.R3a - 14, to: AT.A1 - 6},
  reveal: {from: AT.A1 - 16, to: AT.T1 - 2},
  mosaic: {from: AT.T1 - 12, to: AT.P1 - 2},
  pitch: {from: AT.P1 - 12, to: AT.C1 - 4},
  cta: {from: AT.C1 - 14, to: TOTAL},
};

/** Motion blur only where things move fast (section entries, split panels, the mosaic zoom, the paper slide). */
export const blurAt = (f: number) => {
  const fast: Array<[number, number]> = [
    ...Object.values(SEC).map((w) => [w.from - 2, w.from + 16] as [number, number]),
    [AT.H3 - 6, AT.H3 + 16], [AT.H4 - 8, AT.H4 + 8], [SEC.mosaic.from, SEC.mosaic.from + 24], [AT.P2 - 10, AT.P2 + 6],
  ];
  return fast.some(([a, b]) => f >= a && f <= b) ? 8 : 1;
};
