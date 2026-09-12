import React, { useMemo } from 'react';
import { evolvePath, getLength } from '@remotion/paths';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { BloodParticle } from './BloodParticle';
import { MusclePulse } from './MusclePulse';

const VB = { w: 420, h: 170 };
const BANDS = [14, 44, 85, 126, 156];

/** artery -> capillary bed through working muscle -> vein. Schematic, one-way. */
const LANES = [
  'M 8 85 L 96 85 C 124 85 120 26 152 26 L 268 26 C 300 26 296 85 324 85 L 412 85',
  'M 8 85 L 96 85 C 124 85 120 56 152 56 L 268 56 C 300 56 296 85 324 85 L 412 85',
  'M 8 85 L 96 85 C 124 85 120 114 152 114 L 268 114 C 300 114 296 85 324 85 L 412 85',
  'M 8 85 L 96 85 C 124 85 120 144 152 144 L 268 144 C 300 144 296 85 324 85 L 412 85',
];
const TRUNK_IN = 'M 8 85 L 96 85';
const TRUNK_OUT = 'M 324 85 L 412 85';

const PARTICLES_PER_LANE = 5;
const TRAVERSE_S = 1.75;

export const BloodFlowDiagram: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const lens = useMemo(() => LANES.map((d) => getLength(d)), []);

  // 1. vessels draw themselves on, 2. cells begin to flow, 3. muscle answers
  const draw = interpolate(t, [0.18, 1.05], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const flowIn = interpolate(t, [0.85, 1.25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pulse = interpolate(
    Math.sin(Math.max(t - 1.3, 0) * Math.PI * 1.55),
    [0, 1],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  ) * interpolate(t, [1.3, 1.55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const trunkIn = evolvePath(draw, TRUNK_IN);
  const trunkOut = evolvePath(Math.max(draw * 1.15 - 0.15, 0), TRUNK_OUT);

  return (
    <svg viewBox={`0 0 ${VB.w} ${VB.h}`} width={width} height={height}>
      <MusclePulse bands={BANDS} x0={26} x1={394} pulse={pulse} />

      {/* capillary bed */}
      {LANES.map((d, i) => {
        const ev = evolvePath(Math.max(draw * 1.25 - 0.25, 0), d);
        return (
          <path key={i} d={d} stroke={T.color.blood} strokeWidth={T.stroke.capillary} fill="none"
            strokeLinecap="round" opacity={0.72}
            strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
        );
      })}

      {/* artery in / vein out, heavier than the bed */}
      <path d={TRUNK_IN} stroke={T.color.blood} strokeWidth={T.stroke.vessel} fill="none" strokeLinecap="round"
        strokeDasharray={trunkIn.strokeDasharray} strokeDashoffset={trunkIn.strokeDashoffset} />
      <path d={TRUNK_OUT} stroke={T.color.blood} strokeWidth={T.stroke.vessel} fill="none" strokeLinecap="round"
        strokeDasharray={trunkOut.strokeDasharray} strokeDashoffset={trunkOut.strokeDashoffset} />

      {/* red cells: one-way, evenly phased, no randomness */}
      <g opacity={flowIn}>
        {LANES.map((d, li) =>
          new Array(PARTICLES_PER_LANE).fill(0).map((_, pi) => {
            const phase = (t / TRAVERSE_S + pi / PARTICLES_PER_LANE + li * 0.17) % 1;
            return (
              <BloodParticle key={`${li}-${pi}`} path={d} length={lens[li]} progress={phase}
                r={4.8} />
            );
          }),
        )}
      </g>
    </svg>
  );
};
