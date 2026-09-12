/**
 * The edit blueprint. Seconds on the trimmed timeline (source minus the 0.55s
 * head trim); sec() converts to frames.
 *
 * Shape of the edit — contrast is the point, so the open is deliberately bare:
 *   clean open -> chapter mark -> VESSEL BLOOM -> clean -> STRUCK CLAIM ->
 *   clean -> flex (no graphics, one impact) -> EVIDENCE BARS -> sign-off
 */
import { RESHAPE_THEME as T } from './theme';

export const sec = (s: number) => Math.round(s * T.fps);
export const DURATION_S = 25.4;

export const PUNCHES = [
  { t0: 6.55, t1: 7.15, t2: 8.85, t3: 9.35, peak: 0.035, label: 'pump' },
  { t0: 9.30, t1: 9.95, t2: 13.10, t3: 13.70, peak: 0.055, label: 'the claim' },
  { t0: 17.95, t1: 18.35, t2: 19.10, t3: 19.70, peak: 0.042, label: 'the flex' },
  { t0: 19.25, t1: 19.90, t2: 21.45, t3: 21.95, peak: 0.085, label: 'takeaway' },
];

/** He gives way to whichever side the graphic occupies, then returns. */
export const REFRAMES = [
  { t0: 6.55, t1: 7.25, t2: 8.80, t3: 9.35, dx: -46, label: 'vessel bloom, right' },
  { t0: 19.25, t1: 19.95, t2: 21.40, t3: 21.95, dx: 44, label: 'evidence bars, left' },
];

/** Background drops back while a hero graphic owns the frame. */
export const FOCUS = [
  { t0: 6.55, t1: 7.25, t2: 8.85, t3: 9.35, amount: 0.30 },
  { t0: 9.30, t1: 10.00, t2: 13.10, t3: 13.75, amount: 0.38 },
  { t0: 19.25, t1: 19.95, t2: 21.45, t3: 21.95, amount: 0.28 },
];

export const BEATS = {
  topic:    { from: 3.30, to: 5.60 },
  vessel:   { from: 6.55, to: 9.35 },
  claim:    { from: 9.30, to: 13.78 },
  pointer:  { from: 14.30, to: 16.10 },
  evidence: { from: 19.25, to: 21.95 },
  signOff:  { from: 23.00, to: 24.85 },
};

/** The claim's rule draws so it completes on his last syllable. */
export const STRIKE_AT = 12.92;

/** Windows where typography elsewhere is carrying the speech. */
export const CAPTION_SUPPRESS: Array<[number, number]> = [[9.30, 13.78]];

/** the flex is the payoff: no graphic, but his words land at display size */
export const CAPTION_DISPLAY: Array<[number, number]> = [[18.05, 19.30]];

export const SFX: Array<{ at: number; src: string; volume: number; label: string }> = [
  { at: 3.30,  src: 'whoosh', volume: 0.10, label: 'chapter mark' },
  { at: 6.69,  src: 'tick',   volume: 0.12, label: 'the word PUMP' },
  { at: 6.95,  src: 'pulse',  volume: 0.10, label: 'vessel grows' },
  { at: 8.05,  src: 'pulse',  volume: 0.07, label: 'tissue answers' },
  { at: 9.38,  src: 'tick',   volume: 0.08, label: 'claim begins' },
  { at: 12.92, src: 'strike', volume: 0.17, label: 'claim struck' },
  { at: 14.36, src: 'tick',   volume: 0.08, label: 'pointer tag' },
  { at: 18.18, src: 'impact', volume: 0.15, label: 'the flex' },
  { at: 19.32, src: 'rise',   volume: 0.12, label: 'bars grow' },
  { at: 20.50, src: 'click',  volume: 0.10, label: 'equality lands' },
  { at: 23.00, src: 'whoosh', volume: 0.10, label: 'sign-off' },
];
