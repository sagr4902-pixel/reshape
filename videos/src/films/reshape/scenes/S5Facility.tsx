import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../Film';
import {Facility} from './s45parts';
import {S5Overlay} from './s5layers';

/** S5 — "What makes RESHAPE different": in-person training, clear steps, visible progress inside the facility. */
export const S5Facility: React.FC<SceneProps> = ({f}) => (
  <AbsoluteFill>
    <Facility f={f} uid="s5" />
    <S5Overlay f={f} />
  </AbsoluteFill>
);
