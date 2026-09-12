import React from 'react';
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import type { CaptionWord } from './KeywordHighlight';

/**
 * The misconception, set as the subject of the frame instead of a caption in a
 * box: his claim assembles word-by-word as he speaks it, then a red rule draws
 * through it — right-to-left, the direction the sentence reads — and the whole
 * block dims and settles.
 *
 * The typography IS the caption here, so the bottom caption band is suppressed
 * for this window (see SUPPRESS in timeline.ts).
 */
export const StruckClaim: React.FC<{
  eyebrow: string;
  lines: CaptionWord[][];
  /** seconds, absolute on the reel timeline */
  strikeAt: number;
  durationInFrames: number;
}> = ({ eyebrow, lines, strikeAt, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // the rule cancels the claim top-to-bottom, one line after another
  const strikeFor = (li: number) =>
    interpolate(t, [strikeAt + li * 0.08, strikeAt + li * 0.08 + 0.34], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  // after the rule lands, the claim loses its authority
  const dim = interpolate(t, [strikeAt + 0.34, strikeAt + 0.8], [1, 0.56], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = interpolate(t, [strikeAt + 0.34, strikeAt + 0.9], [0, 10], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const eyebrowIn = interpolate(frame, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        left: T.safe.left + 12,
        right: T.safe.left + 12,
        top: 232,
        direction: 'rtl',
        textAlign: 'center',
        opacity: out,
        transform: `translateY(${settle}px)`,
      }}
    >
      <div
        style={{
          fontFamily: T.font.body,
          fontSize: 32,
          letterSpacing: 2,
          color: T.color.danger,
          opacity: eyebrowIn * dim,
          marginBottom: 18,
        }}
      >
        {eyebrow}
      </div>

      {lines.map((line, li) => (
        <div key={li} style={{ position: 'relative', width: '100%' }}>
          <div
            style={{
              fontFamily: T.font.display,
              fontSize: 68,
              lineHeight: 1.30,
              whiteSpace: 'nowrap',
              color: T.color.text,
              opacity: dim,
              textShadow: '0 4px 22px rgba(0,0,0,.62), 0 0 16px rgba(0,0,0,.5)',
            }}
          >
            {line.map((w, wi) => {
              const appear = interpolate(t, [w.s, w.s + 0.16], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <span
                  key={wi}
                  style={{
                    display: 'inline-block',
                    margin: '0 10px',
                    opacity: appear,
                    transform: `translateY(${(1 - appear) * 14}px)`,
                  }}
                >
                  {w.w}
                </span>
              );
            })}
          </div>
          {/* the rule draws from the right, following the reading direction */}
          <div
            style={{
              position: 'absolute',
              right: '2%',
              top: '56%',
              height: 7,
              width: `${strikeFor(li) * 92}%`,
              background: T.color.danger,
              borderRadius: 4,
              boxShadow: `0 0 18px ${T.color.danger}`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
