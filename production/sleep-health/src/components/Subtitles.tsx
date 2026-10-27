import React from 'react';
import {CUES} from '../captions';
import {BRAND, FONT} from '../brand';
import {ramp, useSec} from '../motion';
import {Easing} from 'remotion';

const norm = (w: string) => w.replace(/[،.…؟]/g, '');

/** Kinetic Arabic subtitles, timed from the measured voice-over. Hidden in the
 * finale where the spoken words are already the on-screen headline. */
export const Subtitles: React.FC = () => {
  const t = useSec();
  const cue = CUES.find((c) => t >= c.start - 0.08 && t < c.end);
  if (!cue || cue.seg === 'ending') return null;
  const inP = ramp(t, cue.start - 0.08, cue.start + 0.22);
  const outP = 1 - ramp(t, cue.end - 0.18, cue.end, Easing.linear);
  const op = Math.min(inP, outP);
  const words = cue.text.split(' ');
  return (
    <div
      dir="rtl"
      style={{
        position: 'absolute',
        top: 1470,
        left: 80,
        right: 80,
        minHeight: 150,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignContent: 'center',
        columnGap: '0.3em',
        rowGap: 6,
        fontFamily: FONT.ar,
        fontWeight: 600,
        fontSize: 46,
        lineHeight: 1.5,
        color: BRAND.soft,
        textAlign: 'center',
        opacity: op,
        transform: `translateY(${(1 - inP) * 16}px)`,
        textShadow: '0 2px 18px rgba(0,0,0,.6), 0 0 2px rgba(0,0,0,.8)',
      }}
    >
      {words.map((w, i) => {
        const p = ramp(t, cue.start - 0.08 + i * 0.04, cue.start + 0.2 + i * 0.04);
        const em = cue.emph.some((e) => norm(e) === norm(w));
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 10}px)`,
              color: em ? BRAND.orange : BRAND.soft,
              fontWeight: em ? 700 : 600,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};
