import { random } from "remotion";

// Pure, frame-driven motion curves for the "group" scene. Every element is phase-locked to
// the 120 BPM groove (1 beat = 15 frames), so all the equipment moves "as one class".

export const BEAT = 15;
export const BAR = 60;

/** Kettlebell swing: hike (low, slightly behind) on every 2nd beat, float at chest height on the off beat. */
export const SWING_PERIOD = 2 * BEAT;
export const SWING_PIVOT = 1.12; // "hands" height (m)
export const SWING_ARM = 0.92; // pivot -> bell centre (m)
export const swingAngle = (f: number) => {
  const p = (((f % SWING_PERIOD) + SWING_PERIOD) % SWING_PERIOD) / SWING_PERIOD;
  // 0 -> 1 -> 0 with a quick hip-snap out of the hike and a float at the top
  const s = (1 - Math.cos(2 * Math.PI * p)) / 2;
  return -0.32 + 1.86 * Math.pow(s, 0.85);
};

/** Battle-rope wave clock: one wave per beat (2 Hz). */
export const ROPE_FREQ = 2;

/**
 * Slam ball, one slam per beat with the impact exactly ON the beat (t = 0):
 *  t 0-2   dead on the floor, squashed (slam balls do not bounce)
 *  t 2-9   snatched back up (ease-out) to the apex
 *  t 9-15  slammed down, accelerating like gravity + throw, hits the floor on the next beat
 */
export const SLAM_H = 0.44;
const SLAM_REST = 2;
const SLAM_APEX = 9;
export const sinceImpact = (f: number) => ((f % BEAT) + BEAT) % BEAT;
export const slamPhase = (f: number) => sinceImpact(f) / BEAT;
export const slamHeight = (f: number) => {
  const t = sinceImpact(f);
  if (t <= SLAM_REST) return 0;
  if (t <= SLAM_APEX) {
    const u = (t - SLAM_REST) / (SLAM_APEX - SLAM_REST);
    return SLAM_H * (1 - Math.pow(1 - u, 2.4));
  }
  const q = (t - SLAM_APEX) / (BEAT - SLAM_APEX);
  return SLAM_H * (1 - q * q);
};
/** 0..1 squash while the ball sits on the floor after impact. */
export const slamSquash = (f: number) => {
  const t = sinceImpact(f);
  return t <= SLAM_REST + 0.5 ? 0.13 * Math.exp(-t / 1.4) : 0;
};
/** Stretch along the fall direction while the ball is slammed down (speed read). */
export const slamStretch = (f: number) => {
  const t = sinceImpact(f);
  if (t <= SLAM_APEX) return 0;
  const q = (t - SLAM_APEX) / (BEAT - SLAM_APEX);
  return 0.16 * q * q;
};

/** Deterministic hand-held shake that decays after `at` (pure function copy of useShake). */
export const shakeAt = (frame: number, at: number, amount = 26, decay = 10) => {
  const t = frame - at;
  if (t < 0 || t > decay * 3) return { x: 0, y: 0, r: 0 };
  const k = Math.exp(-t / decay);
  return {
    x: (random(`gsx${at}-${t}`) - 0.5) * amount * k,
    y: (random(`gsy${at}-${t}`) - 0.5) * amount * k,
    r: (random(`gsr${at}-${t}`) - 0.5) * 0.8 * k,
  };
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
