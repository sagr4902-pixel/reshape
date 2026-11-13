import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ContactShadow, Figure, OUTFITS} from '../../kit/Figure';
import {catmull, clamp, E, kf, lerp, seg, spring01, type V2} from '../../kit/math';
import {GlowDefs, LightPool, MotionPath} from '../../kit/Path';
import {coachGesture, frontLever, hop, pressHandstand, pullUp, pushUp, squat, stand, storkBalance} from '../../kit/poses';
import {ADULT, CHILD, ik2, solve, type PoseCtl, type Props} from '../../kit/rig';
import {C, FONT} from '../../kit/theme';
import contour from '../reshape/logo_contour.json';
import {Ball, Cursor, Flash, GlassPill, LightLeak, punch, Punch, Scanlines, Starburst} from './fx';
import {AT, CUTS, END, wAt} from './timeline';

type SP = {F: number};
const RIM = {color: C.orange, dx: 2.6, dy: -1.2, opacity: 0.9};
const HIT_FLASH = 0.55;
const toAr = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

/** Dark cinematic stage with a soft key light (v1 look). */
const Stage: React.FC<{tint?: string; spotX?: number; spotY?: number}> = ({tint = '#2A2B30', spotX = 540, spotY = 1000}) => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 50% at ${(spotX / 1080) * 100}% ${(spotY / 1920) * 100}%, ${tint} 0%, ${C.night} 55%, ${C.ink} 100%)`}}>
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <defs>
        <linearGradient id="shaftG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.light} stopOpacity="0" />
          <stop offset="1" stopColor={C.light} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d={`M${spotX - 70} -40 L${spotX + 70} -40 L${spotX + 380} ${spotY + 320} L${spotX - 380} ${spotY + 320} Z`} fill="url(#shaftG)" />
    </svg>
  </AbsoluteFill>
);

/* ═════════ A — home video fail, freeze, rewind, play → ball ═════════ */
export const FREEZE = 18;
const HX = 380, HG = 1330, HS = 1.5; // hands x, floor y, figure scale
const failRot = (t: number) => (t < 9 ? 0 : E.inQuad(clamp((t - 9) / 11)) * 58);
const failPose = (t: number): {pose: PoseCtl; rot: number} => {
  const k = kf<number>(t, [[0, 2.0], [7, 2.92, E.outCubic]]);
  const sway = t < 6 ? 0 : Math.sin((t - 6) * 1.1) * 10 * clamp((t - 6) / 4);
  return {pose: pressHandstand(k, ADULT, sway), rot: failRot(t)};
};
/** The red circle is fitted to the frozen body: hands → toes after the topple rotation. */
const rotAbout = (p: V2, deg: number): V2 => {
  const t = (deg * Math.PI) / 180, dx = p[0] - HX, dy = p[1] - HG;
  return [HX + dx * Math.cos(t) - dy * Math.sin(t), HG + dx * Math.sin(t) + dy * Math.cos(t)];
};
const FJ = solve(failPose(FREEZE).pose, ADULT);
const toFrozen = (p: V2): V2 => rotAbout([HX + p[0] * HS, HG - 9 + p[1] * HS], failRot(FREEZE));
const FA = toFrozen(FJ.handN), FB = toFrozen(FJ.toeN);
const FOCUS: V2 = [(FA[0] + FB[0]) / 2, (FA[1] + FB[1]) / 2];
const F_ANG = (Math.atan2(FB[0] - FA[0], -(FB[1] - FA[1])) * 180) / Math.PI;
const F_RY = Math.hypot(FB[0] - FA[0], FB[1] - FA[1]) / 2 + 80;

export const HomeVideo: React.FC<SP> = ({F}) => {
  const dragA = 60, dragB = 82;
  const vt = F < FREEZE ? F : F < dragA ? FREEZE : F < dragB ? lerp(FREEZE, 0, E.inOutCubic((F - dragA) / (dragB - dragA))) : 0;
  const {pose, rot} = failPose(vt);
  const frozen = F >= FREEZE && F < dragA;
  const playing = F < FREEZE || F >= dragB;
  const jx = playing ? Math.sin(F * 0.9) * 4 + Math.sin(F * 2.3) * 2 : 0; // handheld wobble
  const jy = playing ? Math.cos(F * 1.1) * 3 : 0;
  const zoom = F < FREEZE ? 1 : lerp(1, 1.25, E.outCubic(clamp((F - FREEZE) / 6))) * (F > dragA ? lerp(1, 0.8, E.inOutCubic(clamp((F - dragA) / 22))) : 1);
  const focus = FOCUS;
  const color = seg(F, 98, 108);
  // eased (not switched) freeze dim and rewind look, so no single-frame jumps
  const dimK = seg(F, FREEZE, FREEZE + 3, E.linear) * (1 - seg(F, dragA - 2, dragA + 6, E.linear));
  const rw = seg(F, dragA - 3, dragA + 1, E.linear) * (1 - seg(F, dragB, dragB + 4, E.linear));
  const playerIn = E.outCubic(clamp((F - 48) / 8));
  const head = F < dragA ? 0.34 : F < dragB ? lerp(0.34, 0.02, E.inOutCubic((F - dragA) / (dragB - dragA))) : 0.02;
  const barX0 = 160, barW = 760;
  const playX = 110, playY = 1640;
  const cur: V2 = F < 56 ? [lerp(980, barX0 + head * barW, E.inOutCubic(clamp((F - 50) / 6))), lerp(1780, 1660, E.inOutCubic(clamp((F - 50) / 6)))]
    : F < 86 ? [barX0 + head * barW, 1660] : [lerp(barX0 + head * barW, playX, E.inOutCubic(clamp((F - 86) / 8))), 1660];
  const press = F >= 58 && F < dragB ? 1 : F >= 95 && F < 99 ? 1 : 0;
  const morph = E.outBack(clamp((F - 97) / 7)); // the play button swells into the orange ball
  const circleP = E.outCubic(clamp((F - FREEZE - 1) / 9)) * (1 - E.inCubic(clamp((F - (dragA - 3)) / 9))); // draws on, then un-draws as the rewind starts
  return (
    <AbsoluteFill style={{background: '#CFCAC4', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${jx}px, ${jy}px) scale(${zoom * punch(F, FREEZE, 0.05)})`, transformOrigin: `${focus[0]}px ${focus[1]}px`}}>
        <AbsoluteFill style={{filter: `grayscale(${1 - color}) contrast(${lerp(1.15, 1, color)}) brightness(${lerp(1.02 - 0.12 * dimK, 1, color)})`}}>
          {/* plain room */}
          <AbsoluteFill style={{background: 'linear-gradient(180deg, #D9D4CE 0%, #CEC8C2 62%, #B9B2AB 62.2%, #A9A29B 100%)'}} />
          <div style={{position: 'absolute', left: 700, top: 380, width: 260, height: 330, border: '14px solid #E8E4DF', background: '#BFC6CC'}} />
          <div style={{position: 'absolute', left: HX - 220, top: HG - 4, width: 640, height: 30, borderRadius: 8, background: '#7E8C9A'}} />
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <ContactShadow x={HX + 60} y={HG} w={320} opacity={0.35} />
            <g transform={`rotate(${rot} ${HX} ${HG})`}>
              <Figure j={solve(pose, ADULT)} P={ADULT} o={OUTFITS.athlete2} x={HX} y={HG - 9} scale={HS} />
            </g>
          </svg>
        </AbsoluteFill>
        {/* the red "this is you" circle stays in color over the grey footage */}
        {F >= FREEZE + 1 && circleP > 0.001 ? (
          <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
            <ellipse cx={focus[0]} cy={focus[1]} rx={190} ry={F_RY} fill="none" stroke="#E2241B" strokeWidth={13} strokeLinecap="round"
              strokeDasharray={2200} strokeDashoffset={2200 * (1 - circleP)} transform={`rotate(${F_ANG} ${focus[0]} ${focus[1]})`} />
          </svg>
        ) : null}
      </AbsoluteFill>
      {/* camera viewfinder UI */}
      <AbsoluteFill style={{opacity: 1 - color}}>
        <div style={{position: 'absolute', left: 60, top: 130, fontFamily: FONT.data, fontWeight: 700, fontSize: 42, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.5)'}}>
          {frozen ? <span style={{letterSpacing: -6}}>❚❚</span> : <span style={{color: '#FF2B2B', opacity: Math.floor(F / 8) % 2 ? 1 : 0.25}}>●</span>} REC
        </div>
        <div style={{position: 'absolute', right: 60, top: 130, fontFamily: FONT.data, fontWeight: 600, fontSize: 42, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.5)'}}>
          00:0{Math.min(9, Math.floor(vt / 6))}
        </div>
        {[[50, 220, 1, 1], [1030, 220, -1, 1], [50, 1480, 1, -1], [1030, 1480, -1, -1]].map(([x, y, sx, sy], i) => (
          <div key={i} style={{position: 'absolute', left: x - (sx < 0 ? 60 : 0), top: y - (sy < 0 ? 60 : 0), width: 60, height: 60,
            borderLeft: sx > 0 ? '6px solid #fff' : undefined, borderRight: sx < 0 ? '6px solid #fff' : undefined, borderTop: sy > 0 ? '6px solid #fff' : undefined, borderBottom: sy < 0 ? '6px solid #fff' : undefined, opacity: 0.8}} />
        ))}
        {rw > 0 ? <div style={{position: 'absolute', right: 70, top: 220, fontSize: 90, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.5)', fontFamily: FONT.data, opacity: rw}}>◀◀</div> : null}
      </AbsoluteFill>
      <Scanlines o={lerp(0.18 * (1 - color), 0.6, rw)} f={F} />
      {rw > 0 ? <AbsoluteFill style={{opacity: rw, background: 'linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 31%, rgba(255,255,255,0) 34%)', transform: `translateY(${((F * 53) % 1900) - 900}px)`}} /> : null}
      <Flash f={F} at={FREEZE} color="#FFFFFF" max={0.35} />
      {/* «هذا إنت؟» */}
      <Punch text="هذا إنت؟" f={F} at={21} out={dragA - 6} size={190} y={470} color="#FFFFFF" shadow="#E2241B" rot={-4} />
      {/* subtitle for «طيب… شوف هذا» */}
      {F >= AT.V2 && F < END.V2 + 4 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', direction: 'rtl', fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: '#fff',
          textShadow: '0 0 10px rgba(0,0,0,0.65), 0 4px 0 rgba(0,0,0,0.5)'}}>
          {F < wAt('V2', 1) - 2 ? 'طيب…' : F < wAt('V2', 2) - 2 ? 'طيب… شوف' : 'طيب… شوف هذا.'}
        </div>
      ) : null}
      {/* video player UI (prompt 001: the cursor drives every change) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1580, height: 170, transform: `translateY(${(1 - playerIn) * 220}px)`, background: 'rgba(20,21,24,0.82)'}}>
        <div style={{position: 'absolute', left: barX0, top: 74, width: barW, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.25)'}} />
        <div style={{position: 'absolute', left: barX0, top: 74, width: barW * head, height: 12, borderRadius: 6, background: C.orange}} />
        <div style={{position: 'absolute', left: barX0 + head * barW - 18, top: 62, width: 36, height: 36, borderRadius: 18, background: '#fff', transform: `scale(${press && F < dragB ? 1.3 : 1})`}} />
      </div>
      {F < 104 ? (
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, transform: `translateY(${(1 - playerIn) * 220}px)`}}>
          <circle cx={playX} cy={playY + 20} r={lerp(42, 34, morph) * (F >= 95 && F < 99 ? 0.85 : 1)} fill={morph > 0 ? C.orange : '#fff'} />
          {morph < 0.4 ? <path d={`M${playX - 12} ${playY} L${playX + 20} ${playY + 20} L${playX - 12} ${playY + 40} Z`} fill={C.ink} opacity={1 - morph * 2.5} /> : null}
        </svg>
      ) : null}
      {F >= 102 ? <Ball f={F} pos={(t) => [lerp(playX, 540, E.inCubic(clamp((t - 102) / 7))), lerp(playY + 20, -60, E.inCubic(clamp((t - 102) / 7)))]} r={34} /> : null}
      {F >= 48 && F < 99 ? <Cursor x={cur[0]} y={cur[1]} press={press} /> : null}
    </AbsoluteFill>
  );
};

/* ═════════ B — «أول عقلة!» ═════════ */
export const PullUpScene: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V3', 1));
  const h = kf<number>(F, [[109, 0], [hit - 8, 0.05, E.linear], [hit, 1, E.outCubic], [hit + 12, 1, E.linear], [CUTS.toHand + 6, 0.35, E.inOutSine]]);
  const barY = 640, gx = 540;
  const ballPos = (t: number): V2 => {
    if (t < hit - 3) return [lerp(540, 600, clamp((t - 109) / 8)), lerp(-60, barY - 30, E.inQuad(clamp((t - 109) / 8)))];
    if (t < 141) { const u = (t - (hit - 3)) / (141 - (hit - 3)); return [lerp(600, 980, u), barY - 30 - Math.sin(u * Math.PI) * 360]; }
    return [lerp(980, -120, E.inOutCubic(clamp((t - 141) / 9))), lerp(barY - 30, 1100, clamp((t - 141) / 9))];
  };
  const z = lerp(1, 1.07, clamp((F - 109) / 40)) * punch(F, hit, 0.07);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '540px 760px'}}>
        <Stage spotX={540} spotY={900} />
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <GlowDefs />
          <LightPool x={540} y={1500} rx={460} ry={90} color={C.light} opacity={0.12} />
          <rect x={250} y={barY - 6} width={22} height={900} rx={8} fill="#45464C" />
          <rect x={808} y={barY - 6} width={22} height={900} rx={8} fill="#45464C" />
          <Figure j={solve(pullUp(h, ADULT), ADULT)} P={ADULT} o={OUTFITS.athlete} x={gx} y={barY} scale={1.55} rim={RIM} />
          <rect x={240} y={barY - 10} width={600} height={20} rx={10} fill="#C9CBD2" />
          <MotionPath pts={[[230, barY], [850, barY]]} to={seg(F, hit - 1, hit + 6)} width={8} glow={0.6} opacity={1 - seg(F, hit + 16, hit + 30)} />
        </svg>
        <Starburst p={seg(F, hit, hit + 14, E.linear)} x={gx} y={barY - 60} r0={90} r1={480} />
      </AbsoluteFill>
      <Ball f={F} pos={ballPos} squash={F >= hit - 4 && F <= hit - 1 ? 1 : 0} />
      <Punch text="أول عقلة!" f={F} at={hit - 1} size={200} y={1390} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
      <LightLeak p={seg(F, 104, 124, E.linear)} seed={2} strength={0.85} />
    </AbsoluteFill>
  );
};

/* ═════════ C — «أول وقفة يد!» ═════════ */
export const HandstandScene: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V4', 2));
  const k = kf<number>(F, [[142, 2], [hit - 10, 2, E.linear], [hit, 3, E.outCubic]]);
  const sway = F < hit ? Math.sin(F * 0.5) * 2 : Math.sin(F * 0.4) * 2 * Math.exp(-(F - hit) / 6);
  const gx = 540, gy = 1280;
  const line = E.outCubic(clamp((F - hit + 1) / 6));
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `scale(${punch(F, hit, 0.07)})`}}>
      <Stage tint="#30313A" spotX={540} spotY={800} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        {/* plumb line behind the body: the line is the point */}
        {F >= hit - 1 ? (
          <>
            <line x1={gx} y1={gy + 70} x2={gx} y2={gy + 70 - 980 * line} stroke={C.orange} strokeWidth={14} opacity={0.55} filter="url(#glowS)" />
            <line x1={gx} y1={gy + 70} x2={gx} y2={gy + 70 - 980 * line} stroke={C.orangeHot} strokeWidth={5} />
          </>
        ) : null}
        <ContactShadow x={gx} y={gy + 40} w={360} />
        <rect x={gx - 80} y={gy - 8} width={160} height={14} rx={7} fill="#A9ABB3" />
        <rect x={gx - 70} y={gy} width={12} height={46} fill="#5A5B61" />
        <rect x={gx + 58} y={gy} width={12} height={46} fill="#5A5B61" />
        <Figure j={solve(pressHandstand(k, ADULT, sway), ADULT)} P={ADULT} o={OUTFITS.athlete} x={gx} y={gy} scale={1.6} rim={RIM} />
      </svg>
      <Punch text="أول وقفة يد!" f={F} at={hit - 1} size={170} y={380} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
    </AbsoluteFill>
  );
};

/* ═════════ D — «أول ليفر!» ═════════ */
export const LeverScene: React.FC<SP> = ({F}) => {
  const hit = Math.round(wAt('V5', 1));
  const s = kf<number>(F, [[197, 0], [hit - 9, 0.4, E.linear], [hit - 4, 1.6, E.inOutCubic], [hit, 3, E.outCubic]]);
  const barY = 760;
  const j = solve(frontLever(s, ADULT), ADULT);
  const sc = 1.45;
  const line = seg(F, hit, hit + 6, E.outCubic);
  const ly = barY + (j.pelvis[1] + 2) * sc;
  const lx0 = 506 + (j.shoulder[0] - 50) * sc, lx1 = 506 + (j.shoulder[0] + (j.toeN[0] - j.shoulder[0] + 120) * line) * sc;
  return (
    <AbsoluteFill style={{overflow: 'hidden', transform: `scale(${punch(F, hit, 0.08)}) rotate(${lerp(-2, 0, clamp((F - 197) / 20))}deg)`}}>
      <Stage tint="#2E2F35" spotX={600} spotY={900} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        <rect x={496} y={barY - 6} width={20} height={1000} rx={8} fill="#45464C" />
        <Figure j={j} P={ADULT} o={OUTFITS.athlete} x={506} y={barY} scale={sc} rim={RIM} />
        <rect x={380} y={barY - 10} width={250} height={20} rx={10} fill="#C9CBD2" />
        {line > 0 ? (
          <>
            <line x1={lx0} y1={ly} x2={lx1} y2={ly} stroke={C.orange} strokeWidth={10} opacity={0.6} filter="url(#glowS)" />
            <line x1={lx0} y1={ly} x2={lx1} y2={ly} stroke={C.orangeHot} strokeWidth={4} />
          </>
        ) : null}
      </svg>
      <Punch text="أول ليفر!" f={F} at={hit - 1} size={200} y={1330} />
      <Flash f={F} at={hit} max={HIT_FLASH} />
    </AbsoluteFill>
  );
};

/* ═════════ E — rapid word flashes (prompt 006) ═════════ */
const FLASHES: Array<{w: string; bg: string; fg: string; pose: () => PoseCtl; ground: boolean}> = [
  {w: 'قوة', bg: C.orange, fg: C.ink, pose: () => pushUp(0.9), ground: true},
  {w: 'تحكّم', bg: C.charcoal, fg: C.light, pose: () => pressHandstand(3, ADULT, 0), ground: true},
  {w: 'مهارة', bg: C.light, fg: C.ink, pose: () => frontLever(3, ADULT), ground: false},
  {w: 'ثبات', bg: C.orange, fg: C.light, pose: () => squat(1), ground: true},
  {w: 'توازن', bg: C.charcoal, fg: C.orange, pose: () => storkBalance(0.4, ADULT), ground: true},
  {w: 'ثقة', bg: C.light, fg: C.orange, pose: () => coachGesture(2, 0), ground: true},
];
export const FLASH_STEP = 4;
export const FlashScene: React.FC<SP> = ({F}) => {
  const i = clamp(Math.floor((F - CUTS.toFlash) / FLASH_STEP), 0, FLASHES.length - 1);
  const fl = FLASHES[i];
  const local = Math.min(F - CUTS.toFlash - i * FLASH_STEP, FLASH_STEP);
  return (
    <AbsoluteFill style={{background: fl.bg, overflow: 'hidden'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <g opacity={0.22}>
          <Figure j={solve(fl.pose(), ADULT)} P={ADULT} o={{...OUTFITS.athlete, top: fl.fg, topShade: fl.fg, bottom: fl.fg, bottomShade: fl.fg, skin: fl.fg, skinShade: fl.fg, shoe: fl.fg, sole: fl.fg, hair: fl.fg, accent: fl.fg}}
            x={fl.ground ? 600 : 520} y={fl.ground ? 1500 : 820} scale={1.9} flat />
        </g>
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 960, transform: `translateY(-50%) scale(${1.12 - local * 0.035}) rotate(${i % 2 ? 3 : -3}deg)`, textAlign: 'center', direction: 'rtl',
        fontFamily: FONT.display, fontWeight: 900, fontSize: 300, color: fl.fg, lineHeight: 1}}>{fl.w}</div>
    </AbsoluteFill>
  );
};

/* ═════════ F — kids: «وللصغار؟ أول خطوة… بثقة!» (hop through rings → high five) ═════════ */
const KG = 1460, KS = 1.8; // floor y, figure scale (both figures)
const KX0 = 190, HOPL = 185; // kid start x, hop length (the rings sit where each hop lands)
const CX = 790; // coach x (faces left)
const H5: V2 = [640, KG - 400]; // where the palms meet
// hops are timed back from the high five on «بثقة!», so a new take re-times them automatically
const FIVE = Math.round(wAt('V6', 3));
const HOP_END = FIVE - 8, HOP2 = HOP_END - 20, HOP1 = HOP2 - 22;
const angTo = (a: V2, b: V2) => Math.atan2(b[0] - a[0], -(b[1] - a[1]));
/** FK angles that put the near hand on `target` (rig space). */
const reach = (P: Props, pose: PoseCtl, target: V2, bend: 1 | -1): [number, number] => {
  const j = solve(pose, P);
  const [el, hand] = ik2(j.shoulder, target, P.upper, P.fore, bend);
  return [angTo(j.shoulder, el), angTo(el, hand)];
};
const fkOf = (l: PoseCtl['aN']): [number, number] => ('fk' in l ? l.fk : [Math.PI, Math.PI]);
const lerpFK = (a: [number, number], b: [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export const KidsScene: React.FC<SP> = ({F}) => {
  const five = FIVE;
  // ── kid ──
  let kx = KX0, kPose: PoseCtl = stand(CHILD, F / 30), kdy = 0;
  if (F >= HOP1 && F < HOP2) { const hp = hop((F - HOP1) / (HOP2 - HOP1), CHILD); kPose = hp.pose; kdy = hp.dy; kx = KX0 + hp.dx * HOPL; }
  else if (F >= HOP2 && F < HOP_END) { const hp = hop((F - HOP2) / (HOP_END - HOP2), CHILD); kPose = hp.pose; kdy = hp.dy; kx = KX0 + (1 + hp.dx) * HOPL; }
  else if (F >= HOP_END) {
    kx = KX0 + 2 * HOPL;
    const base = stand(CHILD, F / 30);
    const target: V2 = [(H5[0] - kx) / KS, (H5[1] - KG) / KS];
    const up = reach(CHILD, base, target, 1);
    const t = E.outCubic(clamp((F - (five - 6)) / 6));
    kPose = {...base, aN: {fk: lerpFK(fkOf(base.aN), up, t)}};
  }
  // ── coach ──
  const cBase = coachGesture(1, F / 30);
  const lean = 0.06 + 0.12 * E.inOutSine(clamp((F - (five - 16)) / 10));
  const cLean: PoseCtl = {...cBase, torso: cBase.torso + lean};
  const cTarget: V2 = [-(H5[0] - CX) / KS, (H5[1] - KG) / KS];
  const cUp = reach(ADULT, cLean, cTarget, 1);
  const ct = E.inOutCubic(clamp((F - (five - 14)) / 14));
  const cPose: PoseCtl = {...cLean, aN: {fk: lerpFK(fkOf(cBase.aN), cUp, ct)}};
  const touch = F >= five - 1;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #F3ECE6 0%, #EADFD7 70%, #DCCFC6 70.2%, #D2C4BA 100%)', overflow: 'hidden', transform: `scale(${punch(F, five, 0.06)})`}}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(255,255,255,0.6), rgba(255,255,255,0) 70%)'}} />
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        {[1, 2].map((k) => {
          const lit = (k === 1 && F >= HOP2 - 4) || (k === 2 && F >= HOP_END - 3);
          return <ellipse key={k} cx={KX0 + k * HOPL} cy={KG + 6} rx={86} ry={19} fill={lit ? 'rgba(255,84,32,0.18)' : 'none'} stroke={C.orange} strokeWidth={9} />;
        })}
        <ContactShadow x={kx} y={KG} w={170 * (1 + kdy / 260)} opacity={0.3} />
        <Figure j={solve(kPose, CHILD)} P={CHILD} o={OUTFITS.kidA} x={kx} y={KG + kdy * KS} scale={KS} />
        <ContactShadow x={CX} y={KG} w={200} opacity={0.3} />
        <Figure j={solve(cPose, ADULT)} P={ADULT} o={OUTFITS.coach} x={CX} y={KG} scale={KS} flip />
      </svg>
      {touch ? <Starburst p={seg(F, five - 1, five + 13, E.linear)} x={H5[0]} y={H5[1] - 10} r0={40} r1={300} rays={14} /> : null}
      <Punch text="وللصغار؟" f={F} at={wAt('V6', 0) - 1} out={wAt('V6', 1) - 10} size={170} y={430} color={C.charcoal} shadow={C.orange} />
      <Punch text="أول خطوة…" f={F} at={wAt('V6', 1) - 1} out={END.V6 + 10} size={140} y={400} color={C.charcoal} shadow={C.sand} rot={-2} />
      <Punch text="بثقة!" f={F} at={five - 1} out={END.V6 + 10} size={210} y={610} color={C.orange} shadow={C.charcoal} />
      <Flash f={F} at={five} color="#FFFFFF" max={0.4} />
    </AbsoluteFill>
  );
};

/* ═════════ G — mosaic recap (009) + glass pills (006) ═════════ */
export const PillsScene: React.FC<SP & {render: (id: string, F: number) => React.ReactNode}> = ({F, render}) => {
  const st = CUTS.toPills - 12;
  const drift = clamp((F - st) / 90);
  const dim = seg(F, st + 16, st + 26);
  const tiles: Array<[string, number]> = [['a', FREEZE + 8], ['b', Math.round(wAt('V3', 1)) + 6], ['c', Math.round(wAt('V4', 2)) + 6], ['d', Math.round(wAt('V5', 1)) + 6], ['f', Math.round(wAt('V6', 3)) + 4], ['b', 132]];
  const bob = (k: number) => Math.sin((F + k * 11) / 9) * 6;
  return (
    <AbsoluteFill style={{background: C.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${lerp(1, 1.2, drift)}) rotate(${lerp(-6, -3, drift)}deg) translateX(${lerp(0, -40, drift)}px)`, filter: `blur(${dim * 14}px) brightness(${lerp(1, 0.5, dim)})`}}>
        {tiles.map(([id, fr], i) => (
          <div key={i} style={{position: 'absolute', left: -180 + (i % 3) * 480, top: -120 + Math.floor(i / 3) * 860, width: 1080, height: 1920, transform: 'scale(0.42)', transformOrigin: '0 0', overflow: 'hidden', border: '10px solid #000'}}>
            {render(id, fr)}
          </div>
        ))}
      </AbsoluteFill>
      <GlassPill text="في ريشيب…" p={seg(F, wAt('V7', 0) - 2, wAt('V7', 1) + 6)} x={540} y={800 + bob(0)} size={112} tint="rgba(255,84,32,0.55)" />
      <GlassPill text="تدريب حضوري" p={seg(F, wAt('V7', 2) - 2, wAt('V7', 3) + 6)} x={540} y={1030 + bob(1)} size={128} />
      <LightLeak p={seg(F, st + 4, st + 30, E.linear)} seed={5} strength={0.7} />
    </AbsoluteFill>
  );
};

/* ═════════ H — progress bar → routes → logo slam → «ابدأ اليوم» click ═════════ */
const LW = 600, K = LW / contour.logoW, LX = 540 - LW / 2, LY = 660;
const MB = contour.markBBox;
const markLocal: V2[] = (contour.mark as number[][]).map(([x, y]) => [x - (MB[0] + MB[2]) / 2, y - (MB[1] + MB[3]) / 2]);
const MC_LOGO: V2 = [LX + ((MB[0] + MB[2]) / 2) * K, LY + ((MB[1] + MB[3]) / 2) * K];
const HERO_C: V2 = [540, 900], HERO_S = 4.4;
const heroPts: V2[] = markLocal.map(([x, y]) => [HERO_C[0] + x * HERO_S, HERO_C[1] + y * HERO_S]);
const NN = heroPts.length;
const BAR = {x0: 170, x1: 910, y: 1010, h: 78};
const BW = BAR.x1 - BAR.x0;
/** RTL progress: the bar fills from the right in steps, snapping full on «ينشاف!». */
const FULL = Math.round(wAt('V8', 1)); // «ينشاف!»
export const LEVEL_FRAMES = [FULL - 27, FULL - 20, FULL - 13, FULL - 6, FULL - 1];
const LEVELS: Array<[number, number]> = LEVEL_FRAMES.map((f, i) => [f, [0.2, 0.42, 0.63, 0.8, 1][i]]);
const barFill = (F: number) => LEVELS.reduce((acc, [t, v], i) => acc + (v - (i ? LEVELS[i - 1][1] : 0)) * E.outCubic(clamp((F - t) / (i === LEVELS.length - 1 ? 3 : 4))), 0);
const SEGC: V2[] = [0, 1, 2, 3, 4].map((i) => [BAR.x1 - ((i + 0.5) * BW) / 5, BAR.y]);
const ROUTES = [0, 1, 2, 3, 4].map((i) => {
  const a = Math.round((i * NN) / 5), b = Math.round(((i + 1) * NN) / 5);
  const arc: V2[] = [];
  for (let k = a; k <= b; k++) arc.push(heroPts[k % NN]);
  const S = SEGC[i];
  const th0 = Math.atan2(S[1] - HERO_C[1], S[0] - HERO_C[0]);
  const r0 = Math.hypot(S[0] - HERO_C[0], S[1] - HERO_C[1]);
  let th1 = Math.atan2(arc[0][1] - HERO_C[1], arc[0][0] - HERO_C[0]);
  const r1 = Math.hypot(arc[0][0] - HERO_C[0], arc[0][1] - HERO_C[1]);
  while (th1 < th0 + Math.PI * 0.9) th1 += Math.PI * 2;
  const ctrl: V2[] = [];
  for (let k = 0; k <= 7; k++) {
    const u = k / 7, th = lerp(th0, th1, u), rl = lerp(r0, r1, u), bump = Math.sin(Math.PI * u) * (320 + i * 24);
    ctrl.push([HERO_C[0] + Math.cos(th) * (rl + bump), HERO_C[1] + Math.sin(th) * (rl + bump * 1.3)]);
  }
  const approach = catmull(ctrl, 10);
  const full = [...approach.slice(0, -1), ...arc];
  let L = 0, La = 0;
  for (let k = 1; k < full.length; k++) {
    L += Math.hypot(full[k][0] - full[k - 1][0], full[k][1] - full[k - 1][1]);
    if (k === approach.length - 1) La = L;
  }
  return {pts: full, arcStart: La / L};
});
export const FinaleScene: React.FC<SP> = ({F}) => {
  const slam = AT.V9 + 1; // «ريشيب»
  const t0 = CUTS.toFinale;
  const full = FULL;
  const fill = seg(F, slam - 3, slam + 2);
  const logoIn = seg(F, slam + 8, slam + 13);
  const res = E.inOutCubic(seg(F, slam + 4, slam + 14, E.linear));
  const sc = lerp(HERO_S, K, res) * punch(F, slam, 0.06);
  const cx = lerp(HERO_C[0], MC_LOGO[0], res), cy = lerp(HERO_C[1], MC_LOGO[1], res);
  const heroD = 'M' + markLocal.map(([x, y]) => `${(cx + x * sc).toFixed(1)} ${(cy + y * sc).toFixed(1)}`).join('L') + 'Z';
  const sweep = seg(F, slam + 14, slam + 34, E.inOutSine);
  const btnAt = Math.round(wAt('V9', 1)) - 2;
  const btn = spring01((F - btnAt) / 30, 2.8, 0.55);
  const clickAt = END.V9 - 4;
  const cur: V2 = [lerp(1000, 600, E.inOutCubic(clamp((F - (clickAt - 12)) / 10))), lerp(1700, 1180, E.inOutCubic(clamp((F - (clickAt - 12)) / 10)))];
  const pressed = F >= clickAt && F < clickAt + 4 ? 1 : 0;
  const done = seg(F, clickAt + 2, clickAt + 9, E.outBack);
  // progress bar
  const fv = barFill(F);
  const barIn = E.outBack(seg(F, t0, t0 + 7, E.linear));
  const barO = 1 - seg(F, full + 4, full + 13, E.linear);
  const hot = Math.max(0, 1 - Math.abs(F - full) / 6);
  const pct = Math.round(fv * 100);
  const headX = clamp(BAR.x1 - BW * fv, BAR.x0 + 70, BAR.x1 - 70);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 45% at 50% 42%, #3A3B40 0%, ${C.dark} 45%, ${C.ink} 100%)`, overflow: 'hidden'}}>
      {barO > 0 ? (
        <AbsoluteFill style={{opacity: barO, transform: `scale(${punch(F, full, 0.05)})`}}>
          <div style={{position: 'absolute', left: BAR.x0, top: BAR.y - BAR.h / 2, width: BW, height: BAR.h, borderRadius: BAR.h / 2, background: 'rgba(255,255,255,0.10)',
            boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.55)', transform: `scaleX(${barIn})`}}>
            <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: BW * fv, borderRadius: BAR.h / 2,
              background: `linear-gradient(270deg, ${C.orangeDeep}, ${C.orange} 60%, ${C.orangeHot})`, boxShadow: `0 0 ${24 + hot * 70}px rgba(255,84,32,${0.5 + hot * 0.5})`}} />
            {[1, 2, 3, 4].map((k) => <div key={k} style={{position: 'absolute', left: (BW * k) / 5 - 2, top: 16, bottom: 16, width: 4, borderRadius: 2, background: 'rgba(20,21,24,0.35)'}} />)}
          </div>
          {fv > 0.01 ? (
            <div style={{position: 'absolute', left: headX, top: BAR.y - 136, transform: `translateX(-50%) scale(${punch(F, full, 0.25)})`, fontFamily: FONT.body, fontWeight: 700, fontSize: 84,
              color: fv >= 0.999 ? C.orange : C.light, direction: 'rtl', whiteSpace: 'nowrap'}}>{toAr(pct)}٪</div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        {ROUTES.map((r, i) => {
          const a = full + 3 + i * 2, b = slam - 10 + i, c = slam - 3;
          const to = F < b ? lerp(0, r.arcStart, E.inOutSine(seg(F, a, b, E.linear))) : lerp(r.arcStart, 1, E.outCubic(seg(F, b, c, E.linear)));
          const from = F < b ? Math.max(0, to - 0.4) : lerp(Math.max(0, r.arcStart - 0.4), r.arcStart, E.outCubic(seg(F, b, c + 2, E.linear)));
          return F >= a ? <MotionPath key={i} pts={r.pts} from={from} to={to} width={14} taper={0.5} head={F < c ? 16 : 0} glow={0.6} opacity={1 - fill} /> : null;
        })}
        {F >= slam - 3 ? (
          <g opacity={1 - logoIn}>
            <path d={heroD} fill={C.red} opacity={fill} />
            <path d={heroD} fill="none" stroke={C.orange} strokeWidth={10} strokeLinejoin="round" opacity={1 - fill} />
          </g>
        ) : null}
      </svg>
      <Punch text="والتقدّم…" f={F} at={AT.V8 + 2} out={full + 14} size={150} y={720} color={C.light} shadow={C.charcoal} />
      <Punch text="ينشاف!" f={F} at={full - 1} out={full + 18} size={230} y={1300} color={C.orange} shadow={C.ink} />
      <Starburst p={seg(F, slam, slam + 16, E.linear)} x={HERO_C[0]} y={HERO_C[1]} color={C.orange} rays={22} r0={200} r1={900} />
      {logoIn > 0 ? (
        <div style={{position: 'absolute', left: LX, top: LY, width: LW, height: contour.logoH * K, opacity: logoIn, transform: `scale(${punch(F, slam + 8, 0.05)})`}}>
          <Img src={staticFile('brand/reshape-logo.png')} style={{width: LW, height: 'auto', display: 'block'}} />
          {sweep > 0 && sweep < 1 ? (
            <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', WebkitMaskImage: `url(${staticFile('brand/reshape-logo.png')})`, WebkitMaskSize: '100% 100%',
              background: `linear-gradient(105deg, rgba(255,84,32,0) ${sweep * 140 - 40}%, rgba(255,190,150,0.95) ${sweep * 140 - 22}%, rgba(255,84,32,0) ${sweep * 140 - 4}%)`}} />
          ) : null}
        </div>
      ) : null}
      {/* «ابدأ اليوم» button (prompt 001: one shape morphs: pill → pressed → check) */}
      {F >= btnAt ? (
        <div style={{position: 'absolute', left: 540, top: 1180, transform: `translate(-50%, -50%) scale(${btn * (pressed ? 0.92 : 1)})`, width: lerp(520, 150, done), height: 150, borderRadius: 75,
          background: done > 0.5 ? C.light : C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          fontFamily: FONT.display, fontWeight: 900, fontSize: 92, color: done > 0.5 ? C.orange : C.light, direction: 'rtl', overflow: 'hidden', whiteSpace: 'nowrap'}}>
          {done > 0.5 ? '✓' : 'ابدأ اليوم'}
        </div>
      ) : null}
      <div style={{position: 'absolute', left: 0, right: 0, top: 1330, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 56, color: C.sand, opacity: seg(F, clickAt + 4, clickAt + 12)}}>reshape-sa.com</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1405, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 56, color: C.orange, opacity: seg(F, clickAt + 7, clickAt + 15)}}>@reshape.sa</div>
      {F >= clickAt - 14 && F < clickAt + 14 ? <Cursor x={cur[0]} y={cur[1]} press={pressed} o={1 - seg(F, clickAt + 6, clickAt + 14)} /> : null}
      <Flash f={F} at={t0} max={0.35} />
      <Flash f={F} at={full} max={0.45} />
      <Flash f={F} at={slam} max={0.5} />
      <LightLeak p={seg(F, slam - 2, slam + 18, E.linear)} seed={7} strength={0.45} />
    </AbsoluteFill>
  );
};
