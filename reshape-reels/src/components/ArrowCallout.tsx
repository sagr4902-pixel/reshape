import React from 'react';
import { evolvePath } from '@remotion/paths';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/** Self-drawing SVG arrow. The line draws on, then the head fades up. */
export const ArrowCallout: React.FC<{
  d: string;
  delay?: number;
  colour?: string;
  width?: number;
  head?: { x: number; y: number; rotate?: number };
  viewBox: string;
  style?: React.CSSProperties;
}> = ({ d, delay = 0, colour = T.color.accent, width = 3, head, viewBox, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: T.spring.label, durationInFrames: 20 });
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, d);
  const headOpacity = interpolate(p, [0.75, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <svg viewBox={viewBox} style={style}>
      <path d={d} stroke={colour} strokeWidth={width} fill="none" strokeLinecap="round"
        strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
      {head ? (
        <polygon
          points="0,-6 13,0 0,6"
          fill={colour}
          opacity={headOpacity}
          transform={`translate(${head.x} ${head.y}) rotate(${head.rotate ?? 0})`}
        />
      ) : null}
    </svg>
  );
};
