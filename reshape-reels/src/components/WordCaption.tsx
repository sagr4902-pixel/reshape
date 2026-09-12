import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { RESHAPE_THEME as T } from '../theme';
import { CaptionWord, KeywordHighlight } from './KeywordHighlight';

export type CaptionGroup = { start: number; end: number; words: CaptionWord[] };

/**
 * Word-level kinetic captions, RTL-correct.
 *
 * Chrome shapes Arabic natively; `direction: rtl` on a flex row orders the
 * tokens right-to-left. Splitting on spaces is safe because Arabic never joins
 * across one.
 *
 * INVARIANT: a run of consecutive Latin words must arrive as ONE token. Each
 * token is an atomic flex item, so bidi cannot reorder inside it - separate
 * spans for "LET'S" and "GO" render as "GO LET'S". captions.json merges them.
 */
export const WordCaption: React.FC<{
  groups: CaptionGroup[];
  /** windows where other typography carries the speech and the band stands down */
  suppress?: Array<[number, number]>;
  /** windows where the caption itself is the moment and scales up */
  display?: Array<[number, number]>;
}> = ({ groups, suppress = [], display = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  if (suppress.some(([a, b]) => t >= a && t < b)) return null;
  const big = display.some(([a, b]) => t >= a && t < b);

  const gi = groups.findIndex((g, i) => {
    const next = groups[i + 1];
    const until = next ? Math.min(g.end + 0.22, next.start) : g.end + 0.3;
    return t >= g.start - 0.08 && t < until;
  });
  if (gi < 0) return null;
  const g = groups[gi];
  const groupFrame = frame - g.start * fps;
  const outFrames = (g.end - g.start) * fps;
  const fade = interpolate(groupFrame, [outFrames, outFrames + 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: T.safe.left,
        right: T.safe.left,
        bottom: T.height - T.zone.captionBottomY,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'flex-end',
        direction: 'rtl',
        gap: '0 18px',
        fontFamily: T.font.display,
        fontSize: big ? T.size.caption * 1.46 : T.size.caption,
        lineHeight: 1.22,
        textAlign: 'center',
        opacity: fade,
        textShadow: `0 0 14px rgba(0,0,0,.55), 0 4px 18px rgba(0,0,0,.6)`,
        WebkitTextStroke: `${big ? 7 : 5}px ${T.tint.capStroke}`,
        paintOrder: 'stroke fill',
      }}
    >
      {g.words.map((w, i) => (
        <KeywordHighlight key={`${gi}-${i}`} word={w} frame={frame} groupFrame={groupFrame} index={i} />
      ))}
    </div>
  );
};
