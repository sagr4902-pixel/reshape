import { RESHAPE_THEME as T } from './theme';

/** Geometry of the speaker plate inside the composition. */
export const PLATE = { w: 1350, h: 2400, fit: 0.88, originY: 0.46 } as const;

/**
 * Map a point in plate pixels to composition pixels, through the exact same
 * transform stack the plate itself gets (fit -> punch -> reframe). Tracked
 * labels stay glued to the body through zooms and reframes because of this.
 */
export const plateToScreen = (
  px: number,
  py: number,
  punch: number,
  dx: number,
): [number, number] => {
  const cx = T.width / 2;
  const cy = T.height / 2;
  let x = px - (PLATE.w - T.width) / 2;
  let y = py - (PLATE.h - T.height) / 2;
  x = cx + (x - cx) * PLATE.fit;
  y = cy + (y - cy) * PLATE.fit;
  const oy = T.height * PLATE.originY;
  x = cx + (x - cx) * punch;
  y = oy + (y - oy) * punch;
  return [x + dx, y];
};

export type TrackRec = { f: number; bbox?: number[]; L?: number[]; R?: number[] };
