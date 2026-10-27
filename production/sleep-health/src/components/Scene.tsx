import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {ramp, useSec} from '../motion';
import {Easing} from 'remotion';

const Inner: React.FC<{dur: number; children: React.ReactNode; exit?: number}> = ({dur, children, exit = 0.35}) => {
  const t = useSec();
  const a = ramp(t, 0, 0.45);
  const b = 1 - ramp(t, dur - exit, dur, Easing.in(Easing.quad));
  const op = Math.min(a, b);
  const scale = 1.035 - 0.035 * a + (1 - b) * 0.02;
  const y = (1 - a) * 28;
  return (
    <AbsoluteFill style={{opacity: op, transform: `translateY(${y}px) scale(${scale})`}}>
      {children}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{range: readonly [number, number]; children: React.ReactNode; exit?: number}> = ({range, children, exit}) => {
  const {fps} = useVideoConfig();
  const [s, e] = range;
  return (
    <Sequence from={Math.round(s * fps)} durationInFrames={Math.round((e - s) * fps)} layout="none">
      <Inner dur={e - s} exit={exit}>{children}</Inner>
    </Sequence>
  );
};
