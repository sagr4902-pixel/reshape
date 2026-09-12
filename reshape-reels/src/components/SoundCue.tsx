import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

/** Frame-accurate one-shot SFX. Volumes stay far below dialogue by design. */
export const SoundCue: React.FC<{ at: number; src: string; volume: number }> = ({ at, src, volume }) => (
  <Sequence from={Math.round(at * T.fps)} layout="none">
    <Audio src={staticFile(`sfx/${src}.wav`)} volume={volume} />
  </Sequence>
);
