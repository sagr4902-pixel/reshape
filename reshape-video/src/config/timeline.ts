import type { ShotList } from "./transformationData";

/**
 * The RESHAPE transformation structure, in frames at 30fps.
 *
 * These beat lengths are the fixed part of the system — every reel in the
 * campaign runs the same shape, which is what makes them recognisable as a set.
 * What adapts per athlete is *which* frames of their footage land in each beat.
 *
 *   HOOK       pay-off first, before it is earned
 *   BEFORE     the working set
 *   FREEZE     the held breath at the top of the last rep
 *   AFTER      the hero move, revealed by The Rise
 *   IMPACT     the hit on the strongest frame
 *   CODA       walking away from it
 *   COMPARE    the only moment both frames share the screen
 *   END CARD   identical everywhere
 */
export const BEATS = {
  hook: 36,
  before: 126,
  freeze: 14,
  after: 75,
  impact: 18,
  coda: 33,
  comparison: 54,
  endCard: 100,
} as const;

/** Frames The Rise takes to cross the frame, overlaid on the head of AFTER. */
export const REVEAL_FRAMES = 24;

export type Beat = { from: number; durationInFrames: number };

export type Timeline = Record<keyof typeof BEATS, Beat> & { total: number };

export const buildTimeline = (): Timeline => {
  const order = Object.keys(BEATS) as (keyof typeof BEATS)[];
  let cursor = 0;
  const out = {} as Timeline;

  for (const key of order) {
    out[key] = { from: cursor, durationInFrames: BEATS[key] };
    cursor += BEATS[key];
  }

  out.total = cursor;
  return out;
};

/**
 * Fallback shot list, used when `shotList` in transformationData.ts is null.
 *
 * With no human eye on the footage the safest assumption is that the strongest
 * material sits in the middle of each clip and the closing beat at the end, so
 * the marks are taken as proportions of the real clip durations rather than
 * from the first seconds — which are almost always someone walking into frame.
 */
export const deriveShotList = (beforeSeconds: number, afterSeconds: number): ShotList => {
  const beforeNeeded = BEATS.before / 30;
  const afterNeeded = (BEATS.after + REVEAL_FRAMES) / 30;

  const beforeStart = clamp(beforeSeconds * 0.2, 0, Math.max(0, beforeSeconds - beforeNeeded));
  const afterStart = clamp(afterSeconds * 0.45, 0, Math.max(0, afterSeconds - afterNeeded));
  const peak = clamp(afterStart + afterNeeded * 0.85, 0, afterSeconds);

  return {
    hookFlashes: [peak, afterSeconds * 0.35, afterSeconds * 0.6],
    before: { start: beforeStart, focalX: 0.5, focalY: 0.46, scale: 1.14, playbackRate: 0.95 },
    matchFreeze: clamp(beforeStart + beforeNeeded, 0, beforeSeconds),
    after: { start: afterStart, focalX: 0.5, focalY: 0.44, scale: 1.14 },
    peak,
    coda: { start: clamp(afterSeconds * 0.88, 0, afterSeconds), focalX: 0.5, focalY: 0.42, scale: 1.05 },
    comparison: {
      before: clamp(beforeStart + beforeNeeded * 0.85, 0, beforeSeconds),
      after: peak,
    },
  };
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
