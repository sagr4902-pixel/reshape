import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, E, lerp, seg, type V2} from '../../../kit/math';
import {GlowDefs, MotionPath} from '../../../kit/Path';
import {Word} from '../../../kit/Text';
import {C} from '../../../kit/theme';
import type {SceneProps} from '../Film';
import {wordAt} from '../timeline';
import {BAR_Y, camAtF, World} from './world';
import {makeProjector} from '../../../kit/cam3d';

/** Headline ≠ glyph, drawn right-to-left by the path. */
const NEQ_TOP: V2[] = [[606, 318], [474, 318]];
const NEQ_BOT: V2[] = [[606, 356], [474, 356]];
const NEQ_SLASH: V2[] = [[574, 398], [506, 276]];

export const S1Hook: React.FC<SceneProps> = ({f}) => {
  const wHaraka = wordAt('L1', 7); // حَرَكَة
  const wTaqaddum = wordAt('L1', 9); // تَقَدُّم
  const textOut = seg(f, 166, 186, E.inCubic);
  const strokeIn = (a: number, b: number) => E.inOutCubic(clamp((f - a) / (b - a)));
  const bg = seg(f, 10, 80);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 55% at 50% 55%, rgba(47,48,52,${0.75 * bg}) 0%, ${C.ink} 70%)`}} />
      {f < 176 ? <World f={f} /> : null}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        <g opacity={1 - textOut}>
          {(() => {
            // a spark rises from the middle of the bar and writes the ≠ (right to left)
            const q = makeProjector(camAtF(Math.min(f, 124)))([0, BAR_Y + 6, 0]);
            const a: V2 = [q.x, q.y];
            const conn: V2[] = [a, [a[0], lerp(a[1], 318, 0.55)], [lerp(a[0], 640, 0.6), 330], [640, 318], NEQ_TOP[0]];
            return (
              <>
                <MotionPath pts={conn} from={seg(f, 110, 119, E.inCubic)} to={strokeIn(100, 112)} width={9} head={f < 112 ? 12 : 0} taper={0.6} />
                <MotionPath pts={NEQ_TOP} to={strokeIn(111, 119)} width={11} head={f < 119 && f > 111 ? 12 : 0} />
              </>
            );
          })()}
          <MotionPath pts={NEQ_BOT} to={strokeIn(118, 126)} width={11} />
          <MotionPath pts={NEQ_SLASH} to={strokeIn(126, 134)} width={11} />
        </g>
      </svg>
      <Word text="الحركة" p={seg(f, wHaraka - 4, wHaraka + 12, E.linear)} out={textOut} size={112} x={652} y={334} anchor="left" color={C.light} />
      <Word text="التقدّم" p={seg(f, wTaqaddum - 4, wTaqaddum + 12, E.linear)} out={textOut} size={112} x={428} y={334} anchor="right" color={C.light} />
    </AbsoluteFill>
  );
};
