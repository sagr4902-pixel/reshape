import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, E, lerp, seg, spring01, type V2} from '../../kit/math';
import {C, FONT} from '../../kit/theme';
import {Cursor, Flash, LightLeak, NoPunch, punch} from './fx';
import {CUTS, wAt} from './timeline';

/* ═════════ G — «في ريشيب… [نافذة] تدريب حضوري»: the sentence splits and a window opens between the phrases (ref 013) ═════════ */
const SLOT_SPLIT = Math.round(wAt('V7', 1)) + 7; // just after «ريشيب»
const SLOT_TRAIN = Math.round(wAt('V7', 2)); // «تدريب»: the window lands on the coaching shot
const SLOT_HOT = Math.round(wAt('V7', 3)); // «حضوري»
const SLOT_CLOSE = CUTS.toFinale - 10; // phrases rejoin before the finale cut
// the window shows our own drawn scenes at their hit moments: [scene id, frame, focus y]
const FIVE = Math.round(wAt('V6', 3));
const SLOT_SHOTS: Array<[string, number, number]> = [
  ['b', Math.round(wAt('V3', 1)) + 8, 760], ['c', Math.round(wAt('V4', 2)) + 8, 960], ['d', Math.round(wAt('V5', 1)) + 8, 830], ['f', FIVE + 3, 1150],
];
const SLOT_STEP = 5;
// phrase widths per 1px of font size, measured in Chromium with Zain 800 (scratch measure, 2026-11-17)
const W_A = 5.384, W_B = 6.656; // «في ريشيب…», «تدريب حضوري»
const SZ0 = 72, SZ1 = 100, GAP0 = 0.4 * SZ0; // one-line size → split size
const PRE_TOTAL = (W_A + W_B) * SZ0 + GAP0;
const PRE_A = 540 + PRE_TOTAL / 2 - (W_A * SZ0) / 2; // RTL: first phrase on the right
const PRE_B = 540 - PRE_TOTAL / 2 + (W_B * SZ0) / 2;
const PRE_GAP = 540 + PRE_TOTAL / 2 - W_A * SZ0 - GAP0 / 2;
export const SlotScene: React.FC<{F: number; render: (id: string, F: number) => React.ReactNode}> = ({F, render}) => {
  const open = clamp(spring01((F - SLOT_SPLIT) / 30, 2.2, 0.72), 0, 1.08) * (1 - E.inOutCubic(seg(F, SLOT_CLOSE, SLOT_CLOSE + 8, E.linear)));
  const o = clamp(open, 0, 1);
  const lineIn = E.outCubic(clamp((F - (wAt('V7', 0) - 4)) / 8));
  const size = lerp(SZ0, SZ1, o);
  const winW = lerp(0, 640, o), winH = 760 * open;
  const hot = F >= SLOT_HOT - 1;
  // window content: quick swaps, then the coaching shot from «تدريب»
  const swapI = Math.floor((F - SLOT_SPLIT) / SLOT_STEP);
  const coach = F >= SLOT_TRAIN;
  // from «تدريب» the kids scene (coach + kid) plays live so the palms meet on «حضوري»
  const [shotId, shotF, focusY] = coach ? ['f', Math.min(FIVE + 25, FIVE - (SLOT_HOT - SLOT_TRAIN) + (F - SLOT_TRAIN)), 1150] as [string, number, number]
    : SLOT_SHOTS[((swapI % SLOT_SHOTS.length) + SLOT_SHOTS.length) % SLOT_SHOTS.length];
  const local = coach ? (F - SLOT_TRAIN) / 34 : ((F - SLOT_SPLIT) % SLOT_STEP) / SLOT_STEP;
  const inner = coach ? lerp(1.0, 1.08, clamp(local)) : lerp(1.16, 1.04, clamp(local));
  // cursor flicks in, clicks the gap, leaves
  const cIn = E.inOutCubic(clamp((F - (SLOT_SPLIT - 14)) / 11));
  const cOut = E.inCubic(clamp((F - (SLOT_SPLIT + 3)) / 10));
  const cur: V2 = [lerp(980, PRE_GAP - 6, cIn) + cOut * 380, lerp(1720, 985, cIn) + cOut * 520];
  const press = F >= SLOT_SPLIT - 3 && F < SLOT_SPLIT + 1 ? 1 : 0;
  const phrase = (text: string, x: number, y: number, color: string, pz = 1): React.ReactNode => (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${pz})`, whiteSpace: 'nowrap', direction: 'rtl',
      fontFamily: FONT.display, fontWeight: 800, fontSize: size, color, opacity: lineIn, textShadow: '0 4px 18px rgba(0,0,0,0.45)'}}>{text}</div>
  );
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 50% at 50% 50%, #2A2B30 0%, ${C.ink} 75%)`, overflow: 'hidden'}}>
      {winW > 2 && winH > 2 ? (
        <div style={{position: 'absolute', left: lerp(PRE_GAP, 540, o) - winW / 2, top: 960 - winH / 2, width: winW, height: winH, borderRadius: 36 * o, overflow: 'hidden',
          boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 0 3px rgba(255,255,255,${0.12 * o})${hot ? `, 0 0 50px rgba(255,84,32,${0.35 * o})` : ''}`}}>
          <div style={{position: 'absolute', left: winW / 2 - 540, top: winH / 2 - focusY, width: 1080, height: 1920, transform: `scale(${(640 / 1080) * inner})`, transformOrigin: `540px ${focusY}px`}}>
            <NoPunch.Provider value>{render(shotId, shotF)}</NoPunch.Provider>
          </div>
        </div>
      ) : null}
      {phrase('في ريشيب…', lerp(PRE_A, 540, o), lerp(966, 500, open), C.light)}
      {phrase('تدريب حضوري', lerp(PRE_B, 540, o), lerp(966, 1420, open), hot ? C.orange : C.light, hot ? punch(F, SLOT_HOT, 0.12) : 1)}
      {F >= SLOT_SPLIT - 14 && F < SLOT_SPLIT + 14 ? <Cursor x={cur[0]} y={cur[1]} press={press} o={1 - cOut} /> : null}
      <Flash f={F} at={SLOT_TRAIN} max={0.25} />
      <LightLeak p={seg(F, CUTS.toPills - 8, CUTS.toPills + 18, E.linear)} seed={5} strength={0.55} />
    </AbsoluteFill>
  );
};
export const SLOT_FRAMES = {SLOT_SPLIT, SLOT_TRAIN, SLOT_HOT, SLOT_CLOSE, SLOT_STEP};
