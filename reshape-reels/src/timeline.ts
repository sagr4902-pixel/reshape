/**
 * The edit blueprint. All times are in SECONDS on the trimmed timeline
 * (source minus the 0.55s head trim) and are converted to frames by sec().
 * Phrase bounds come from Descript; word bounds from onset alignment.
 */
import { RESHAPE_THEME as T } from './theme';

export const sec = (s: number) => Math.round(s * T.fps);

export const DURATION_S = 25.4;

/** Camera punch-ins: [inStart, inEnd, outStart, outEnd, peakScale] */
export const PUNCHES: Array<{
  t0: number; t1: number; t2: number; t3: number; peak: number; label: string;
}> = [
  { t0: 6.60, t1: 7.20, t2: 8.65, t3: 9.15, peak: 0.035, label: 'pump / blood flow' },
  { t0: 9.39, t1: 10.00, t2: 12.65, t3: 13.17, peak: 0.050, label: 'the misconception' },
  { t0: 19.15, t1: 19.80, t2: 21.35, t3: 21.85, peak: 0.090, label: 'strongest takeaway' },
];

/** Speaker nudges left while the right-hand popup is on screen. */
export const REFRAMES = [
  { t0: 6.60, t1: 7.30, t2: 8.60, t3: 9.15, dx: -45, label: 'blood-flow popup' },
];

export const BEATS = {
  hook:      { from: 0.20, to: 2.75 },
  bloodFlow: { from: 6.60, to: 9.15 },
  study:     { from: 19.30, to: 21.90 },
  outro:     { from: 22.95, to: 24.90 },
};

/** Sound cues — each fires once, on the exact beat of the thing it marks. */
export const SFX: Array<{ at: number; src: string; volume: number; label: string }> = [
  { at: 0.20,  src: 'whoosh', volume: 0.13, label: 'hook card in' },
  { at: 6.60,  src: 'whoosh', volume: 0.15, label: 'blood-flow panel in' },
  { at: 6.69,  src: 'tick',   volume: 0.10, label: 'keyword PUMP' },
  { at: 7.05,  src: 'pulse',  volume: 0.11, label: 'vessel flow begins' },
  { at: 8.06,  src: 'pulse',  volume: 0.08, label: 'muscle pulse' },
  { at: 9.39,  src: 'tick',   volume: 0.09, label: 'misconception' },
  { at: 19.30, src: 'click',  volume: 0.13, label: 'study card in' },
  { at: 22.95, src: 'whoosh', volume: 0.12, label: 'end card in' },
];
