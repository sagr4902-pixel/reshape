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

/** Slam ball: lifted overhead (ease-out), slammed down (accelerating), impact exactly on each beat. */
export const SLAM_H = 1.05;
export const slamPhase = (f: number) => (((f % BEAT) + BEAT) % BEAT) / BEAT;
export const slamHeight = (f: number) => {
  const p = slamPhase(f);
  const up = 0.58;
  if (p < up) return SLAM_H * (1 - Math.pow(1 - p / up, 3));
  const q = (p - up) / (1 - up);
  return SLAM_H * (1 - q * q);
};
/** 0..1 squash right after impact. */
export const slamSquash = (f: number) => {
  const t = (((f % BEAT) + BEAT) % BEAT);
  return t < 3 ? (1 - t / 3) * 0.14 : 0;
};
/** Frames since the last impact (0 on the beat). */
export const sinceImpact = (f: number) => (((f % BEAT) + BEAT) % BEAT);

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
