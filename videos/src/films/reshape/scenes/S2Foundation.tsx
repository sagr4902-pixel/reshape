import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../../../kit/theme';
import type {SceneProps} from '../Film';
import {World} from './world';

/** The bar becomes real → strict pull-up → the bar becomes progression platforms. World takes over from S1 at f176. */
export const S2Foundation: React.FC<SceneProps> = ({f}) => {
  if (f < 176 || f >= 372) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 55%, rgba(47,48,52,0.75) 0%, ${C.ink} 70%)`}} />
      <World f={f} />
    </AbsoluteFill>
  );
};
