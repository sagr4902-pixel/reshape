import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {SceneProps} from '../Film';
import {Facility, S4Text} from './s45parts';
import {S5Overlay} from './s5layers';

/** S4 — "RESHAPE for every stage": the path splits into two floors (adults / kids), then reconnects as one facility. */
export const S4Split: React.FC<SceneProps> = ({f}) => (
  <AbsoluteFill>
    <Facility f={f} uid="s4" />
    {/* S5's cast (trainer, trainee, markers) is already in the building when the pull-back reveals it. */}
    {f >= 830 ? <S5Overlay f={f} withText={false} /> : null}
    <S4Text f={f} />
  </AbsoluteFill>
);
