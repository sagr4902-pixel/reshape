import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

export const useSec = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};

export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeSpring = Easing.bezier(0.34, 1.56, 0.64, 1);

/** 0→1 between `from` and `to` seconds (clamped). */
export const ramp = (t: number, from: number, to: number, easing = easeOut) =>
  interpolate(t, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Fade-in then fade-out window. */
export const window = (t: number, a: number, b: number, fadeIn = 0.35, fadeOut = 0.3) =>
  Math.min(ramp(t, a, a + fadeIn, Easing.linear), 1 - ramp(t, b - fadeOut, b, Easing.linear));

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Deterministic pseudo-random in [0,1). */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
