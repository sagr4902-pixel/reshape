import React from 'react';
import { getPointAtLength } from '@remotion/paths';
import { interpolate } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * One red cell travelling a vessel path. Deterministic: position is a pure
 * function of progress, so it never jitters between frames or renders.
 */
export const BloodParticle: React.FC<{
  path: string;
  length: number;
  progress: number; // 0..1 along the path
  r?: number;
}> = ({ path, length, progress, r = 4.6 }) => {
  const p = Math.min(Math.max(progress, 0), 1);
  const { x, y } = getPointAtLength(path, p * length);
  // fade at both ends so cells enter and leave rather than popping
  const o = interpolate(p, [0, 0.07, 0.9, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <circle cx={x} cy={y} r={r} fill={T.color.bloodBright} opacity={o} />;
};
