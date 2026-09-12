/**
 * The edit blueprint.
 *
 * Beat times are written in SOURCE seconds (the untimed 25.4s cut) so the
 * editorial numbers stay readable. `shiftT` maps them onto the retimed,
 * cold-opened master:
 *   +2.40s  cold open ahead of the take
 *   +0.30s  after 17.30s — the half-speed ramp as his arms come up
 *   +0.90s  after 18.10s — the freeze on the peak pose
 */
import { RESHAPE_THEME as T } from './theme';

export const sec = (s: number) => Math.round(s * T.fps);

export const COLD_OPEN_S = 2.40;
const RAMP_AT = 17.30, RAMP_ADD = 0.30;
const FREEZE_AT = 18.10, FREEZE_ADD = 0.90;

/** source seconds -> PLATE seconds (the plate itself is placed at COLD_OPEN_S). */
export const shiftT = (t: number) =>
  t < RAMP_AT ? t : t < FREEZE_AT ? t + RAMP_ADD : t + RAMP_ADD + FREEZE_ADD;

export const PLATE_START_S = COLD_OPEN_S;
export const PLATE_FRAMES = 859;
/** trim the end of the hold so the frozen frame never overstays */
export const PLATE_USED = Math.round(28.06 * T.fps);
export const DURATION_S = COLD_OPEN_S + PLATE_USED / T.fps;

/** The frozen pose, in master time. */
export const FREEZE = { from: shiftT(18.0667), to: shiftT(18.0667) + 0.933 };

const w4 = (t0: number, t1: number, t2: number, t3: number, amount: number, label = '') =>
  ({ t0: shiftT(t0), t1: shiftT(t1), t2: shiftT(t2), t3: shiftT(t3), amount, label });

export const PUNCHES = [
  ...[
    { t0: 6.55, t1: 7.15, t2: 8.85, t3: 9.35, peak: 0.035, label: 'pump' },
    { t0: 9.30, t1: 9.95, t2: 13.10, t3: 13.70, peak: 0.055, label: 'the claim' },
    { t0: 17.30, t1: 17.95, t2: 18.90, t3: 19.45, peak: 0.075, label: 'the pose' },
    { t0: 19.25, t1: 19.90, t2: 21.45, t3: 21.95, peak: 0.085, label: 'takeaway' },
  ].map((p) => ({ ...p, t0: shiftT(p.t0), t1: shiftT(p.t1), t2: shiftT(p.t2), t3: shiftT(p.t3) })),
  // pull back off the frozen close-up so the end lockup has room
  { t0: 26.55, t1: 27.15, t2: 28.03, t3: 28.10, peak: -0.075, label: 'end pull-back' },
];

export const REFRAMES = [
  { t0: 6.55, t1: 7.25, t2: 8.80, t3: 9.35, dx: -46, label: 'vessel bloom, right' },
  { t0: 19.25, t1: 19.95, t2: 21.40, t3: 21.95, dx: 44, label: 'evidence bars, left' },
].map((r) => ({ ...r, t0: shiftT(r.t0), t1: shiftT(r.t1), t2: shiftT(r.t2), t3: shiftT(r.t3) }));

export const FOCUS = [
  w4(6.55, 7.25, 8.85, 9.35, 0.30),
  w4(9.30, 10.00, 13.10, 13.75, 0.38),
  w4(19.25, 19.95, 21.45, 21.95, 0.28),
];

/** Depth separation and rim light, held across the pose. */
export const ISOLATE = [
  w4(17.55, 18.05, 19.05, 19.55, 0.92),
  { t0: 26.58, t1: 27.05, t2: 28.03, t3: 28.10, amount: 0.88, label: 'end card' },
];
export const EDGE = [w4(17.90, 18.05, 19.05, 19.45, 0.58)];

/** The held final frame, in plate seconds. Source time cannot express it. */
export const TAIL = { from: 26.62, to: 28.03 };

export const BEATS = {
  topic:    { from: 3.30, to: 5.60 },
  vessel:   { from: 6.55, to: 9.35 },
  claim:    { from: 9.30, to: 13.78 },
  pointer:  { from: 14.30, to: 16.10 },
  evidence: { from: 19.25, to: 21.95 },
};
export const BEATS_M = Object.fromEntries(
  Object.entries(BEATS).map(([k, v]) => [k, { from: shiftT(v.from), to: shiftT(v.to) }]),
) as typeof BEATS;

export const STRIKE_AT = shiftT(12.92);
export const CAPTION_SUPPRESS: Array<[number, number]> = [
  [shiftT(9.30), shiftT(13.78)],
  [FREEZE.from - 0.06, FREEZE.to],      // the pose holds in silence
];
export const CAPTION_DISPLAY: Array<[number, number]> = [[shiftT(18.05), shiftT(19.30)]];

/** fires inside the cold-open sequence, relative to its own start */
export const COLD_SFX = [
  { at: 0.12, src: 'pulse',  volume: 0.09, label: 'cold open' },
  { at: 2.18, src: 'whoosh', volume: 0.17, label: 'cut to take' },
];

/** fires inside the plate sequence, relative to the plate's start */
export const SFX: Array<{ at: number; src: string; volume: number; label: string }> = [
  ...([
    { at: 3.30,  src: 'whoosh', volume: 0.10, label: 'chapter mark' },
    { at: 6.69,  src: 'tick',   volume: 0.12, label: 'the word PUMP' },
    { at: 6.95,  src: 'pulse',  volume: 0.10, label: 'vessel grows' },
    { at: 8.05,  src: 'pulse',  volume: 0.07, label: 'tissue answers' },
    { at: 9.38,  src: 'tick',   volume: 0.08, label: 'claim begins' },
    { at: 12.92, src: 'strike', volume: 0.17, label: 'claim struck' },
    { at: 14.36, src: 'tick',   volume: 0.08, label: 'pointer tag' },
    { at: 17.36, src: 'riser',  volume: 0.13, label: 'tension into the pose' },
    { at: 19.32, src: 'rise',   volume: 0.12, label: 'bars grow' },
    { at: 20.50, src: 'click',  volume: 0.10, label: 'equality lands' },
    ].map((c) => ({ ...c, at: shiftT(c.at) }))),
  { at: TAIL.from + 0.02, src: 'boom',   volume: 0.16, label: 'end freeze' },
  { at: TAIL.from + 0.10, src: 'whoosh', volume: 0.11, label: 'end lockup' },
  { at: FREEZE.from,        src: 'boom',   volume: 0.22, label: 'pose impact' },
  { at: FREEZE.from + 0.02, src: 'impact', volume: 0.13, label: 'pose sub' },
];
