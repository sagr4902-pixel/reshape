import React from 'react';
import {AbsoluteFill} from 'remotion';
import {E, seg} from '../../../kit/math';
import {Word} from '../../../kit/Text';
import {C} from '../../../kit/theme';
import type {SceneProps} from '../Film';
import {wordAt} from '../timeline';
import {World} from './world';

/** Strength / control / skill along the runway. World takes over from S2 at f372. */
export const S3Building: React.FC<SceneProps> = ({f}) => {
  if (f < 372) return null;
  const k = [wordAt('L3', 1), wordAt('L3', 3), wordAt('L3', 5)];
  const words = [
    {t: 'قوة', at: k[0], out: k[1] - 6},
    {t: 'تحكّم', at: k[1], out: k[2] - 6},
    {t: 'مهارة', at: k[2], out: 566},
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 55%, rgba(47,48,52,0.75) 0%, ${C.ink} 70%)`}} />
      <World f={f} />
      {words.map((w) => (
        <Word key={w.t} text={w.t} p={seg(f, w.at - 3, w.at + 12, E.linear)} out={seg(f, w.out, w.out + 10)} size={176} x={540} y={470} color={C.light} />
      ))}
    </AbsoluteFill>
  );
};
