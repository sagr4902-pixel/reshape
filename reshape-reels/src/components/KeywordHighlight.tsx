import React from 'react';
import { interpolate, spring, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';

export type Emphasis = 'none' | 'accent' | 'danger' | 'brand';
export type CaptionWord = { w: string; s: number; e: number; emp: Emphasis };

const colourFor = (emp: Emphasis, reached: boolean) => {
  if (!reached) return T.color.text;
  if (emp === 'danger') return T.color.danger;
  if (emp === 'accent' || emp === 'brand') return T.color.accent;
  return T.color.text;
};

/**
 * One word of a kinetic caption.
 *
 * Hierarchy, so this never reads as karaoke:
 *   plain word          -> no motion at all
 *   currently spoken     -> barely-there lift
 *   emphasised keyword   -> scale pop + rise + colour shift, once, on its own beat
 */
export const KeywordHighlight: React.FC<{
  word: CaptionWord;
  frame: number;
  /** frames since this group appeared, used to stagger the entrance */
  groupFrame: number;
  index: number;
}> = ({ word, frame, groupFrame, index }) => {
  const { fps } = useVideoConfig();
  const startF = word.s * fps;
  const since = frame - startF;
  const reached = since >= 0;
  const speaking = reached && frame <= word.e * fps;
  const emphatic = word.emp !== 'none';

  // entrance: a short stagger so the group assembles rather than blinking in
  const enter = interpolate(groupFrame - index * 1.1, [0, 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // keyword pop fires exactly on the word's own start frame
  const pop = emphatic && reached
    ? spring({ frame: since, fps, config: T.spring.pop, durationInFrames: 18 })
    : 0;
  const popScale = emphatic ? interpolate(pop, [0, 0.55, 1], [1, 1.08, 1.0]) : 1;
  const popRise = emphatic ? interpolate(pop, [0, 1], [4, 0]) : 0;

  // plain words get only a whisper of weight while being spoken
  const liveLift = !emphatic && speaking ? 1.012 : 1;

  return (
    <span
      style={{
        display: 'inline-block',
        color: colourFor(word.emp, reached),
        opacity: interpolate(enter, [0, 1], [0, 1]) * (reached || !emphatic ? 1 : 0.88),
        transform: `translateY(${popRise + (1 - enter) * 10}px) scale(${popScale * liveLift})`,
        letterSpacing: word.emp === 'brand' ? 2 : 0,
        transition: 'none',
        willChange: 'transform',
      }}
    >
      {word.w}
    </span>
  );
};
