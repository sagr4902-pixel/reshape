import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../Film';
import {Facility, S4Text} from './s45parts';

/** S4 — "RESHAPE for every stage": the path splits into two floors (adults / kids), then reconnects as one facility. */
export const S4Split: React.FC<SceneProps> = ({f}) => (
  <AbsoluteFill>
    <Facility f={f} uid="s4" />
    <S4Text f={f} />
  </AbsoluteFill>
);
