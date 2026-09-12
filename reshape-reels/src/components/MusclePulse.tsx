import React from 'react';
import { interpolate } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/**
 * Working-muscle tissue. Pulses *subtly* once flow arrives — a 3% breath and a
 * faint local warmth. Deliberately restrained: muscle does not visibly inflate,
 * and implying it would be misleading.
 */
export const MusclePulse: React.FC<{ bands: number[]; x0: number; x1: number; pulse: number }> = ({
  bands,
  x0,
  x1,
  pulse,
}) => {
  const scale = interpolate(pulse, [0, 1], [1, 1.03]);
  const warm = interpolate(pulse, [0, 1], [0.30, 0.46]);
  return (
    <g transform={`translate(${(x0 + x1) / 2} 85) scale(1 ${scale}) translate(${-(x0 + x1) / 2} -85)`}>
      {bands.map((y, i) => (
        <rect
          key={i}
          x={x0}
          y={y - 9}
          width={x1 - x0}
          height={18}
          rx={9}
          fill={`rgba(120,40,44,${warm})`}
        />
      ))}
    </g>
  );
};
