import { Easing, interpolate } from "remotion";
import { dur, ease } from "../brand/tokens";

type Curve = readonly [number, number, number, number];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const curve = (c: Curve) => Easing.bezier(c[0], c[1], c[2], c[3]);

/** 0→1 progress for an entrance that starts at `start` and lasts `length` frames. */
export const enter = (frame: number, start: number, length: number = dur.reveal, c: Curve = ease.out) =>
  interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: curve(c) });

/** 1→0 progress for an exit. */
export const exit = (frame: number, start: number, length: number = dur.ui, c: Curve = ease.in) =>
  1 - interpolate(frame, [start, start + length], [0, 1], { ...clamp, easing: curve(c) });

/** Linear map with clamping. */
export const lerp = (frame: number, input: [number, number], output: [number, number], c?: Curve) =>
  interpolate(frame, input, output, c ? { ...clamp, easing: curve(c) } : clamp);

/** Masked rise: the element slides up out of an overflow-hidden line box. */
export const riseStyle = (p: number, distance = 1.05) =>
  ({
    translate: `0 ${(1 - p) * distance * 100}%`,
    opacity: p <= 0 ? 0 : 1,
  }) as const;

/** The brand slant. Measured by shear search on the original logo files:
 *  wordmark 14.5°, primary lockup 14.5°, mark 13–14.5°. All motion devices
 *  (wipes, bars, masks) lean at this angle. */
export const SLANT_DEG = 14;
export const SLANT_TAN = Math.tan((SLANT_DEG * Math.PI) / 180);
