import React from 'react';
import {AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {clamp, E, lerp, seg, spring01, type V2} from '../../kit/math';
import {GlowDefs, MotionPath} from '../../kit/Path';
import {C, FONT} from '../../kit/theme';
import {Ball, Cursor, Flash, LightLeak, punch, Punch, Starburst} from './fx';
import {CUTS, END, wAt} from './timeline';

/**
 * Photo versions of the «أول …» beats and the kids scene, built on the Higgsfield B-roll
 * (public/broll/hf, faces blurred). Coordinates are in the 1080×1930 cover-fit space of a 752×1344 still.
 */
type SP = {F: number; tile?: boolean};
const HIT_FLASH = 0.5;
const SRC = (f: string) => staticFile(`broll/hf/${f}`);

/** A still that fills the frame; children share its camera move so overlays stay pinned to the picture. */
const Shot: React.FC<{src: string; z: number; ox?: number; oy?: number; origin: V2; bright?: number; blur?: number; children?: React.ReactNode}> = ({src, z, ox = 0, oy = 0, origin, bright = 1, blur = 0, children}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: C.ink}}>
    <div style={{position: 'absolute', left: 0, top: -5, width: 1080, height: 1930, transform: `translate(${ox}px, ${oy}px) scale(${z})`, transformOrigin: `${origin[0]}px ${origin[1]}px`}}>
      <Img src={SRC(src)} style={{width: 1080, height: 1930, display: 'block', filter: `brightness(${bright}) contrast(1.06) saturate(1.05)${blur ? ` blur(${blur}px)` : ''}`}} />
      {children}
    </div>
  </AbsoluteFill>
);
/** Bottom/top shade so the punch words read on any photo. */
const Shade: React.FC<{top?: boolean; o?: number}> = ({top = false, o = 0.75}) => (
  <AbsoluteFill style={{background: `linear-gradient(${top ? 180 : 0}deg, rgba(20,21,24,${o}) 0%, rgba(20,21,24,0) 38%)`}} />
);
/** Dark, slightly soft "before" look that snaps to full on the hit. */
const reveal = (F: number, hit: number) => {
  const r = E.outCubic(clamp((F - (hit - 2)) / 5));
  return {bright: lerp(0.5, 1.04, r), blur: lerp(2.5, 0, r)};
};

/* ═════════ B — «أول عقلة!» ═════════ */
const BAR_Y = (x: number) => 304 + x * (104 / 1080); // the bar in 01_pullup runs from (0,304) to (1080,408)
export const PullUpPhoto: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V3', 1));
  const {bright, blur} = reveal(F, hit);
  const z = lerp(1.2, 1.08, E.outCubic(clamp((F - CUTS.drop) / 40))) * punch(F, hit, 0.06);
  const ballPos = (t: number): V2 => {
    if (t < hit - 3) return [lerp(540, 600, clamp((t - 109) / 8)), lerp(-60, BAR_Y(600) - 36, E.inQuad(clamp((t - 109) / 8)))];
    if (t < 141) { const u = (t - (hit - 3)) / (141 - (hit - 3)); return [lerp(600, 1000, u), lerp(BAR_Y(600), BAR_Y(1000), u) - 36 - Math.sin(u * Math.PI) * 300]; }
    return [lerp(1000, -120, E.inOutCubic(clamp((t - 141) / 9))), lerp(BAR_Y(1000) - 36, 1100, clamp((t - 141) / 9))];
  };
  return (
    <AbsoluteFill>
      <Shot src="01_pullup.png" z={z} origin={[560, 420]} bright={bright} blur={blur}>
        <svg width={1080} height={1930} style={{position: 'absolute', inset: 0}}>
          <GlowDefs />
          <MotionPath pts={[[0, 302], [1080, 406]]} to={seg(F, hit - 1, hit + 6)} width={8} glow={0.7} opacity={1 - seg(F, hit + 16, hit + 30)} />
        </svg>
        <Starburst p={seg(F, hit, hit + 14, E.linear)} x={567} y={365} r0={120} r1={520} />
        <Ball f={F} pos={ballPos} squash={F >= hit - 4 && F <= hit - 1 ? 1 : 0} />
      </Shot>
      <Shade />
      <Punch text="أول عقلة!" f={F} at={hit - 1} size={200} y={1430} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
      <LightLeak p={seg(F, 104, 124, E.linear)} seed={2} strength={0.8} />
    </AbsoluteFill>
  );
};

/* ═════════ C — «أول وقفة يد!» (tilt up from the hands to the feet, line snaps on the hit) ═════════ */
export const HandstandPhoto: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V4', 2));
  const {bright, blur} = reveal(F, hit);
  const tilt = E.inOutCubic(clamp((F - (CUTS.toHand - 8)) / (hit - (CUTS.toHand - 8))));
  const z = 1.14 * punch(F, hit, 0.06);
  const line = E.outCubic(clamp((F - hit + 1) / 6));
  return (
    <AbsoluteFill>
      <Shot src="02_handstand.png" z={z} oy={lerp(-120, 110, tilt)} origin={[540, 960]} bright={bright} blur={blur}>
        <svg width={1080} height={1930} style={{position: 'absolute', inset: 0, mixBlendMode: 'screen'}}>
          <GlowDefs />
          {line > 0 ? (
            <>
              <line x1={543 - 420 * line} y1={1752} x2={543 + 420 * line} y2={1752} stroke={C.orange} strokeWidth={12} opacity={0.6} filter="url(#glowS)" />
              <line x1={543 - 420 * line} y1={1752} x2={543 + 420 * line} y2={1752} stroke={C.orangeHot} strokeWidth={4} />
            </>
          ) : null}
        </svg>
        <Starburst p={seg(F, hit, hit + 14, E.linear)} x={525} y={60} r0={60} r1={420} />
      </Shot>
      <Shade />
      <Punch text="أول وقفة يد!" f={F} at={hit - 1} size={170} y={1450} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
    </AbsoluteFill>
  );
};

/* ═════════ D — «أول ليفر!» (tight on the grip → snap back to the full horizontal line) ═════════ */
export const LeverPhoto: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V5', 1));
  const {bright, blur} = reveal(F, hit);
  const back = E.outCubic(clamp((F - (hit - 2)) / 7));
  const z = lerp(1.45, 1.06, back) * punch(F, hit, 0.05);
  const line = seg(F, hit, hit + 7, E.outCubic);
  return (
    <AbsoluteFill style={{transform: `rotate(${lerp(-2, 0, clamp((F - 197) / 20))}deg)`}}>
      <Shot src="03_lever.png" z={z} origin={[260, 700]} bright={bright} blur={blur}>
        <svg width={1080} height={1930} style={{position: 'absolute', inset: 0}}>
          <GlowDefs />
          <MotionPath pts={[[60, 948], [1060, 888]]} to={line} width={8} glow={0.7} />
        </svg>
      </Shot>
      <Shade />
      <Punch text="أول ليفر!" f={F} at={hit - 1} size={200} y={1430} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
    </AbsoluteFill>
  );
};

/* ═════════ F — kids: the real high-five clip, palms meeting on «بثقة!» ═════════ */
const FIVE = Math.round(wAt('V6', 3));
const RATE = 0.8; // light slow motion: the landing falls on «أول», the palms on «بثقة!»
// 04_kids_highfive_slow30.mp4 is the clip pre-slowed to 0.8x with motion-interpolated frames at 30 fps (no repeated frames)
const SLOW = '04_kids_highfive_slow30.mp4';
const CONTACT_S = 1.71; // palms meet 1.71 s into 04_kids_highfive.mp4
export const KIDS_VSTART = FIVE - Math.round((CONTACT_S * 30) / RATE);
export const KIDS_LAND = KIDS_VSTART + Math.round((0.875 * 30) / RATE);
const VIDEO_STYLE: React.CSSProperties = {position: 'absolute', left: 0, top: -33, width: 1080, height: 1987, objectFit: 'cover'};
export const KidsPhoto: React.FC<SP> = ({F, tile}) => {
  const off = F - useCurrentFrame(); // absolute frame where this scene's sequence starts
  const z = lerp(1, 1.07, clamp((F - CUTS.toKids) / 90)) * punch(F, FIVE, 0.05);
  const playing = !tile && F >= KIDS_VSTART;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.light}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '576px 700px'}}>
        {/* the clip's own first frame, frozen, until it starts playing (the mosaic tile uses the still) */}
        {tile ? <Img src={SRC('04_kids_highfive.png')} style={{position: 'absolute', left: 0, top: -5, width: 1080, height: 1930}} /> : null}
        {!tile && !playing ? (
          <Freeze frame={0}>
            <OffthreadVideo src={SRC(SLOW)} muted style={VIDEO_STYLE} />
          </Freeze>
        ) : null}
        {!tile ? (
          <Sequence from={KIDS_VSTART - off} premountFor={30}>
            <OffthreadVideo src={SRC(SLOW)} muted style={VIDEO_STYLE} />
          </Sequence>
        ) : null}
        <Starburst p={seg(F, FIVE - 1, FIVE + 13, E.linear)} x={576} y={435} r0={50} r1={320} rays={14} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(243,236,230,0.92) 0%, rgba(243,236,230,0) 30%)'}} />
      <Punch text="وللصغار؟" f={F} at={wAt('V6', 0) - 1} out={wAt('V6', 1) - 10} size={170} y={1640} color={C.charcoal} shadow={C.orange} />
      <Punch text="أول خطوة…" f={F} at={wAt('V6', 1) - 1} out={END.V6 + 10} size={130} y={1500} color={C.charcoal} shadow={C.sand} rot={-2} />
      <Punch text="بثقة!" f={F} at={FIVE - 1} out={END.V6 + 10} size={200} y={1755} color={C.orange} shadow={C.charcoal} />
      <Flash f={F} at={FIVE} color="#FFFFFF" max={0.35} />
    </AbsoluteFill>
  );
};

/** «تدريب حضوري»: the coach shot fading in behind the glass pills. */
export const CoachBackdrop: React.FC<{F: number}> = ({F}) => {
  const o = seg(F, wAt('V7', 2) - 8, wAt('V7', 2) + 4);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Shot src="05_coach_spot.png" z={lerp(1.12, 1.04, clamp((F - wAt('V7', 2)) / 40))} origin={[540, 900]} bright={0.62} />
    </AbsoluteFill>
  );
};

/** Finale: the empty studio, dimmed, behind the progress bar. */
export const StudioBackdrop: React.FC<{F: number; until: number}> = ({F, until}) => {
  const o = 0.42 * seg(F, CUTS.toFinale, CUTS.toFinale + 8) * (1 - seg(F, until, until + 10));
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{opacity: o}}>
      <Shot src="07_studio_empty.png" z={lerp(1.08, 1.16, clamp((F - CUTS.toFinale) / 70))} origin={[540, 1100]} />
    </AbsoluteFill>
  );
};


/* ═════════ G — «في ريشيب… [نافذة] تدريب حضوري»: the sentence splits and a window opens between the phrases (ref 013) ═════════ */
const SLOT_SPLIT = Math.round(wAt('V7', 1)) + 7; // just after «ريشيب»
const SLOT_TRAIN = Math.round(wAt('V7', 2)); // «تدريب»: the window lands on the coaching shot
const SLOT_HOT = Math.round(wAt('V7', 3)); // «حضوري»
const SLOT_CLOSE = CUTS.toFinale - 10; // phrases rejoin before the finale cut
const SLOT_SHOTS = ['01_pullup.png', '02_handstand.png', '03_lever.png', '04_kids_highfive.png', '06_chalk_grip.png'];
const SLOT_STEP = 5;
// phrase widths per 1px of font size, measured in Chromium with Zain 800 (scratch measure, 2026-11-17)
const W_A = 5.384, W_B = 6.656; // «في ريشيب…», «تدريب حضوري»
const SZ0 = 72, SZ1 = 100, GAP0 = 0.4 * SZ0; // one-line size → split size
const PRE_TOTAL = (W_A + W_B) * SZ0 + GAP0;
const PRE_A = 540 + PRE_TOTAL / 2 - (W_A * SZ0) / 2; // RTL: first phrase on the right
const PRE_B = 540 - PRE_TOTAL / 2 + (W_B * SZ0) / 2;
const PRE_GAP = 540 + PRE_TOTAL / 2 - W_A * SZ0 - GAP0 / 2;
export const SlotScene: React.FC<SP> = ({F}) => {
  const open = clamp(spring01((F - SLOT_SPLIT) / 30, 2.2, 0.72), 0, 1.08) * (1 - E.inOutCubic(seg(F, SLOT_CLOSE, SLOT_CLOSE + 8, E.linear)));
  const o = clamp(open, 0, 1);
  const lineIn = E.outCubic(clamp((F - (wAt('V7', 0) - 4)) / 8));
  const size = lerp(SZ0, SZ1, o);
  const winW = lerp(0, 640, o), winH = 760 * open;
  const hot = F >= SLOT_HOT - 1;
  // window content: quick swaps, then the coaching shot from «تدريب»
  const swapI = Math.floor((F - SLOT_SPLIT) / SLOT_STEP);
  const coach = F >= SLOT_TRAIN;
  const shot = coach ? '05_coach_spot.png' : SLOT_SHOTS[((swapI % SLOT_SHOTS.length) + SLOT_SHOTS.length) % SLOT_SHOTS.length];
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
          <Img src={SRC(shot)} style={{position: 'absolute', left: '50%', top: '50%', width: 640, height: 1144, transform: `translate(-50%, -50%) scale(${inner})`, filter: 'contrast(1.05)'}} />
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
