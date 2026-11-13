import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {ContactShadow, Figure, OUTFITS, type Outfit} from '../../kit/Figure';
import {clamp, E, kf, lerp, seg, spring01, type V2} from '../../kit/math';
import {coachGesture, pressHandstand, pullUp, pushUp, squat, stand, storkBalance} from '../../kit/poses';
import {ADULT, CHILD, d2r as A, solve, type PoseCtl} from '../../kit/rig';
import {Answer, Captions, Chip, clean, Head, Mascot, Paper, pathKeys, Rounds, SlideIn, Stamp, Wave} from './kit';
import {ar, Q, QF} from './style';
import {AT, END, FPS, LINES, SEC, wordAt, type LineId} from './timeline';

/* ───────── flat outfits (no gradients, brand colours) ───────── */
const FLAT: Record<string, Outfit> = {
  athlete: {...OUTFITS.athlete, top: Q.charcoal, topShade: Q.charcoal, bottom: Q.ink, bottomShade: Q.ink, skin: '#C79F86', skinShade: '#A9836B', shoe: Q.cream, sole: Q.orange},
  athleteLight: {...OUTFITS.athlete2, top: Q.cream, topShade: Q.cream, bottom: Q.charcoal, bottomShade: Q.charcoal, skin: '#C79F86', skinShade: '#A9836B', shoe: Q.charcoal, sole: Q.orange},
  coach: {...OUTFITS.coach, top: Q.orange, topShade: Q.orange, bottom: Q.charcoal, bottomShade: Q.charcoal, skin: '#B88E74', skinShade: '#94725D'},
  kid: {...OUTFITS.kidA, top: Q.cream, topShade: Q.cream, bottom: Q.orange, bottomShade: Q.orange},
};
const Fig: React.FC<{pose: PoseCtl; x: number; y: number; s: number; o?: Outfit; child?: boolean; flip?: boolean}> = ({pose, x, y, s, o = FLAT.athlete, child, flip}) => (
  <Figure j={solve(pose, child ? CHILD : ADULT)} P={child ? CHILD : ADULT} o={o} x={x} y={y} scale={s} flat far={0.86} flip={flip} />
);

/* ───────── generic case card ───────── */
const CaseCard: React.FC<{
  f: number; n: number; enter: number; fill: string; chipFill: string; qColor: string; illusAt: number;
  waveIds: LineId[]; waveColor: string; waveDim: string; children: React.ReactNode;
}> = ({f, n, enter, fill, chipFill, qColor, illusAt, waveIds, waveColor, waveDim, children}) => {
  const p = spring01((f - enter) / FPS, 2.2, 0.62);
  const rot = lerp(-7, -1.2, p);
  const ill = E.outCubic(clamp((f - illusAt) / 10));
  const W = 860, H = 690;
  return (
    <div style={{position: 'absolute', left: 540 - W / 2, top: 300, width: W, height: H, transform: `translateY(${(1 - p) * 900}px) rotate(${rot}deg)`,
      background: fill, borderRadius: 18, boxShadow: '0 22px 50px rgba(0,0,0,0.28)'}}>
      <div style={{position: 'absolute', left: 26, top: -26}}><Chip text={`الحالة ${ar(n)}`} fill={chipFill} size={32} /></div>
      {/* big question mark, shrinking to a corner badge when the illustration arrives */}
      <div style={{position: 'absolute', left: lerp(W / 2, W - 60, ill), top: lerp(250, 58, ill), transform: `translate(-50%, -50%) scale(${lerp(1, 0.32, ill)})`,
        fontFamily: QF.head, fontWeight: 900, fontSize: 300, color: qColor, lineHeight: 1}}>؟</div>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: 560, opacity: ill, overflow: 'hidden', borderRadius: 18}}>
        <svg width={W} height={560} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{children}</svg>
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 590, height: 2, borderTop: `3px dotted ${waveDim}`, opacity: 0.0}} />
      <Wave f={f} ids={waveIds} x={50} y={575} w={W - 100} h={86} color={waveColor} dimColor={waveDim} />
    </div>
  );
};

/* ═════════════════════ HOOK ═════════════════════ */
export const Hook: React.FC<{f: number}> = ({f}) => {
  const h3 = AT.H3, h4 = AT.H4;
  const panelsIn = E.outCubic(clamp((f - (h3 - 4)) / 12));
  const panelsOut = E.inOutCubic(clamp((f - (h4 - 6)) / 12));
  const mascot = pathKeys([
    [0, -90, 1480], [AT.H1 + 6, 250, 1060, 160], [AT.H2 + 4, 860, 700, 180], [h3 - 2, 540, 1240, 120],
    [h4, 540, 1240], [h4 + 14, 860, 1180, 150], [AT.R1a, 860, 1180],
  ]);
  const anchor: V2 = f < h3 - 2 ? [-60, 1700] : f < h4 ? [540, -60] : [-60, 1700];
  return (
    <AbsoluteFill>
      <Paper />
      <Head text="اختبار سريع" size={74} x={540} y={420} p={seg(f, AT.H1 - 3, AT.H1 + 9, E.linear)} out={seg(f, h3 - 6, h3)} font={QF.text} weight={700} shadow={null} />
      <Head text={`${ar(3)} حالات`} size={190} x={540} y={600} p={seg(f, AT.H2 - 2, AT.H2 + 10, E.linear)} out={seg(f, h3 - 6, h3)} />
      {/* split panels: تمرين؟ (charcoal, right) / تقدُّم؟ (orange, left) */}
      {f >= h3 - 4 && panelsOut < 1 ? (
        <AbsoluteFill style={{transform: `translateX(${-panelsOut * 110}%)`}}>
          <div style={{position: 'absolute', left: 540, top: 0, width: 540, height: 1920, background: Q.charcoal, transform: `translateY(${(1 - panelsIn) * -100}%)`}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920, background: Q.orange, transform: `translateY(${(1 - E.outCubic(clamp((f - h3) / 12))) * 100}%)`}} />
          <Head text="قُول لي…" size={46} x={930} y={420} p={seg(f, wordAt('H3', 0) - 2, wordAt('H3', 0) + 10, E.linear)} color={Q.cream} font={QF.text} weight={700} shadow={null} align="right" />
          <Head text="تمرين؟" size={150} x={810} y={860} p={seg(f, wordAt('H3', 2) - 3, wordAt('H3', 2) + 9, E.linear)} color={Q.cream} shadow={Q.orange} />
          <Head text="تقدُّم؟" size={150} x={270} y={860} p={seg(f, wordAt('H3', 4) - 3, wordAt('H3', 4) + 9, E.linear)} color={Q.cream} shadow={Q.charcoal} />
        </AbsoluteFill>
      ) : null}
      {/* ٣ من ٣ … وأنت البطل */}
      <Head text={`${ar(3)} من ${ar(3)}`} size={200} x={540} y={640} p={seg(f, wordAt('H4', 0) - 2, wordAt('H4', 0) + 10, E.linear)} />
      <Head text="وأنت" size={70} x={540} y={850} p={seg(f, wordAt('H4', 3) - 2, wordAt('H4', 3) + 8, E.linear)} font={QF.text} weight={700} shadow={null} />
      <Stamp f={f} at={wordAt('H4', 4) - 1} text="البطل" x={540} y={1010} size={120} />
      <Mascot f={f} pos={mascot} anchor={anchor} body={f >= h3 - 2 && f < h4 + 6 ? Q.cream : Q.charcoal} />
    </AbsoluteFill>
  );
};

/* ═════════════════════ ROUND 1 — same routine, a year ═════════════════════ */
const Illus1: React.FC<{f: number}> = ({f}) => {
  const d = 0.5 - 0.5 * Math.cos(((f % 26) / 26) * Math.PI * 2);
  const w100 = wordAt('R1b', 2), wSame = wordAt('R1b', 4), wWay = wordAt('R1b', 6), wYear = wordAt('R1b', 8);
  const day = Math.round(kf<number>(f, [[wYear - 2, 1], [wYear + 26, 365, E.inQuad]]));
  const repeat = seg(f, wSame - 2, wSame + 8);
  const loop = seg(f, wWay - 2, wWay + 10);
  return (
    <g>
      <rect x={140} y={470} width={580} height={16} rx={8} fill={Q.sand} />
      <Fig pose={pushUp(d)} x={500} y={478} s={0.92} />
      {/* counter */}
      <g opacity={seg(f, w100 - 3, w100 + 6)} transform={`translate(780 150) scale(${0.7 + 0.3 * spring01((f - w100) / FPS, 3, 0.6)})`}>
        <text x={0} y={0} textAnchor="end" fontFamily={QF.text} fontWeight={700} fontSize={104} fill={Q.ink}>{ar(100)}</text>
        <text x={0} y={52} textAnchor="end" fontFamily={QF.text} fontWeight={700} fontSize={34} fill={Q.charcoal2}>ضغطة · كل يوم</text>
      </g>
      {/* same count, same way: repeat marks */}
      <g opacity={repeat}>
        {[0, 1, 2].map((k) => (
          <text key={k} x={780 - k * 0} y={240 + k * 46} textAnchor="end" fontFamily={QF.text} fontWeight={700} fontSize={38} fill={Q.charcoal2} opacity={0.5 - k * 0.12}>= {ar(100)}</text>
        ))}
      </g>
      {loop > 0 ? (
        <g opacity={loop}>
          <path d="M300 330 A150 70 0 1 1 300 331" fill="none" stroke={Q.orange} strokeWidth={6} strokeDasharray="14 12" transform="translate(130 20)" />
          <path d="M572 352 l18 -14 l4 22 z" fill={Q.orange} />
        </g>
      ) : null}
      {/* calendar + flat level line */}
      <g opacity={seg(f, wYear - 4, wYear + 4)}>
        <rect x={60} y={60} width={170} height={150} rx={14} fill={Q.charcoal} />
        <rect x={60} y={60} width={170} height={42} rx={14} fill={Q.orange} />
        <text x={145} y={90} textAnchor="middle" fontFamily={QF.text} fontWeight={700} fontSize={24} fill={Q.cream}>يوم</text>
        <text x={145} y={175} textAnchor="middle" fontFamily={QF.text} fontWeight={700} fontSize={60} fill={Q.cream}>{ar(day)}</text>
        <text x={60} y={262} fontFamily={QF.text} fontWeight={700} fontSize={26} fill={Q.charcoal2}>المستوى</text>
        <line x1={60} y1={292} x2={60 + 220 * seg(f, wYear, wYear + 24)} y2={292} stroke={Q.charcoal2} strokeWidth={6} strokeLinecap="round" />
      </g>
    </g>
  );
};

export const Round1: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.r1.from;
  const mascot = pathKeys([[enter, 980, 1700], [AT.R1a + 4, 930, 1210, 140], [END.R1b, 930, 1210], [AT.R1c, 540, 1470, 120], [END.R1c + 50, 540, 1470]]);
  return (
    <SlideIn f={f} at={enter} from="bottom">
      <Paper color={Q.deep} vignette={0.3} />
      <Rounds active={1} dark p={seg(f, enter + 6, enter + 14)} />
      <CaseCard f={f} n={1} enter={enter + 4} fill={Q.cream} chipFill={Q.charcoal} qColor={Q.orange} illusAt={AT.R1b - 2}
        waveIds={['R1a', 'R1b', 'R1c']} waveColor={Q.orange} waveDim="rgba(29,30,33,0.22)">
        <Illus1 f={f} />
      </CaseCard>
      <Captions f={f} ids={['R1a', 'R1b', 'R1c']} y={1050} size={58} color={Q.cream} />
      <Answer f={f} at={AT.R1c + 2} cdAt={END.R1c + 2} y={1330} onDark />
      <Mascot f={f} pos={mascot} anchor={[1140, 1500]} body={Q.cream} />
    </SlideIn>
  );
};

/* ═════════════════════ ROUND 2 — copying videos alone ═════════════════════ */
const Illus2: React.FC<{f: number}> = ({f}) => {
  const wWatch = wordAt('R2b', 0), wCopy = wordAt('R2b', 2), wNobody = wordAt('R2b', 4);
  const cyc = 54;
  const t = ((f - wCopy + 400) % cyc) / cyc; // 0..1 per attempt
  const trying = f >= wCopy - 4;
  let k = 2, sway = 0, fall = 0;
  if (trying) {
    k = t < 0.25 ? lerp(2, 3, E.inOutSine(t / 0.25)) : 3;
    sway = t < 0.25 ? 0 : Math.sin((t - 0.25) * 22) * 10 * (t / 0.7);
    fall = t > 0.7 ? E.inCubic((t - 0.7) / 0.3) : 0;
  }
  const pose = trying ? pressHandstand(k, ADULT, sway) : stand(ADULT, f / 30);
  const ground = 482;
  return (
    <g>
      <rect x={120} y={ground} width={620} height={14} rx={7} fill={Q.charcoal2} />
      {/* phone with the tutorial */}
      <g opacity={seg(f, wWatch - 4, wWatch + 6)} transform="translate(560 140)">
        <rect x={0} y={0} width={190} height={330} rx={26} fill={Q.ink} />
        <rect x={12} y={16} width={166} height={298} rx={16} fill={Q.charcoal2} />
        <g transform="translate(95 250) scale(0.32)">
          <Figure j={solve(pressHandstand(3, ADULT, Math.sin(f / 8) * 2), ADULT)} P={ADULT} o={FLAT.athleteLight} flat />
        </g>
        <circle cx={95} cy={70} r={30} fill={Q.orange} />
        <path d="M86 56 L110 70 L86 84 Z" fill={Q.cream} />
      </g>
      {/* the copier, alone */}
      <g transform={`translate(330 ${ground}) rotate(${fall * 82}) translate(-330 ${-ground})`} opacity={1 - fall * 0.5}>
        <Fig pose={pose} x={330} y={ground - (trying ? 9 : 0)} s={0.84} o={FLAT.athleteLight} />
      </g>
      {/* nobody to correct him: an empty dashed place */}
      <g opacity={seg(f, wNobody - 4, wNobody + 8)}>
        <rect x={120} y={150} width={130} height={300} rx={60} fill="none" stroke={Q.cream} strokeWidth={4} strokeDasharray="12 10" opacity={0.7} />
        <text x={185} y={320} textAnchor="middle" fontFamily={QF.head} fontWeight={900} fontSize={110} fill={Q.orange}>؟</text>
      </g>
    </g>
  );
};

export const Round2: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.r2.from;
  const mascot = pathKeys([[enter, -120, 1250], [AT.R2a + 6, 150, 1230, 160], [END.R2b, 150, 1230], [AT.R2c, 540, 1470, 120], [END.R2c + 50, 540, 1470]]);
  return (
    <SlideIn f={f} at={enter} from="right">
      <Paper />
      <Rounds active={2} p={seg(f, enter + 6, enter + 14)} />
      <CaseCard f={f} n={2} enter={enter + 4} fill={Q.charcoal} chipFill={Q.orange} qColor={Q.cream} illusAt={AT.R2b - 2}
        waveIds={['R2a', 'R2b', 'R2c']} waveColor={Q.orange} waveDim="rgba(246,240,235,0.25)">
        <Illus2 f={f} />
      </CaseCard>
      <Captions f={f} ids={['R2a', 'R2b', 'R2c']} y={1050} size={58} color={Q.ink} />
      <Answer f={f} at={AT.R2c + 2} cdAt={END.R2c + 2} y={1330} />
      <Mascot f={f} pos={mascot} anchor={[-60, 1560]} />
    </SlideIn>
  );
};

/* ═════════════════════ ROUND 3 — a coach, a plan, a step every week ═════════════════════ */
const Illus3: React.FC<{f: number}> = ({f}) => {
  const wCoach = wordAt('R3b', 0), wPlan = wordAt('R3b', 2), wWeek = wordAt('R3b', 4), wStep = wordAt('R3b', 6);
  const t = f / 30;
  const point = seg(f, wCoach - 2, wCoach + 8) * (1 - seg(f, wPlan + 10, wPlan + 18));
  const sq = 0.5 - 0.5 * Math.cos(((f % 34) / 34) * Math.PI * 2);
  const weeks = [0, 1, 2, 3];
  return (
    <g>
      <rect x={60} y={482} width={480} height={14} rx={7} fill={Q.sand} />
      <Fig pose={coachGesture(point, t)} x={150} y={488} s={0.8} o={FLAT.coach} />
      <Fig pose={squat(sq * 0.9)} x={360} y={488} s={0.8} o={FLAT.athlete} flip />
      {/* the plan */}
      <g opacity={seg(f, wPlan - 4, wPlan + 6)} transform="translate(560 70)">
        <rect x={0} y={0} width={240} height={250} rx={16} fill={Q.charcoal} />
        <text x={210} y={46} textAnchor="end" fontFamily={QF.text} fontWeight={700} fontSize={30} fill={Q.cream}>الخطة</text>
        {[0, 1, 2].map((k) => {
          const on = seg(f, wPlan + 6 + k * 7, wPlan + 12 + k * 7);
          return (
            <g key={k} transform={`translate(0 ${80 + k * 54})`}>
              <rect x={170} y={0} width={34} height={34} rx={7} fill={on > 0.5 ? Q.orange : 'none'} stroke={Q.orange} strokeWidth={4} />
              {on > 0 ? <path d="M178 17 l7 8 l13 -15" fill="none" stroke={Q.cream} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - on)} /> : null}
              <rect x={30} y={10} width={120} height={14} rx={7} fill={Q.charcoal2} />
            </g>
          );
        })}
      </g>
      {/* a new step every week: rising bars */}
      <g opacity={seg(f, wWeek - 4, wWeek + 6)} transform="translate(560 360)">
        {weeks.map((k) => {
          const g = seg(f, wStep - 6 + k * 5, wStep + 4 + k * 5, E.outBack);
          const h = (30 + k * 26) * g;
          return (
            <g key={k}>
              <rect x={190 - k * 58} y={120 - h} width={44} height={h} rx={6} fill={k === 3 ? Q.orange : Q.charcoal} />
              <text x={212 - k * 58} y={148} textAnchor="middle" fontFamily={QF.text} fontWeight={700} fontSize={22} fill={Q.charcoal2}>{ar(k + 1)}</text>
            </g>
          );
        })}
        <text x={234} y={-10} textAnchor="end" fontFamily={QF.text} fontWeight={700} fontSize={24} fill={Q.charcoal2}>أسبوع</text>
      </g>
    </g>
  );
};

export const Round3: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.r3.from;
  const mascot = pathKeys([[enter, 1200, 1250], [AT.R3a + 6, 930, 1235, 160], [END.R3b, 930, 1235], [AT.R3c, 540, 1470, 120], [END.R3c + 50, 540, 1470]]);
  return (
    <SlideIn f={f} at={enter} from="top">
      <Paper color={Q.orange} vignette={0.18} />
      <Rounds active={3} dark p={seg(f, enter + 6, enter + 14)} />
      <CaseCard f={f} n={3} enter={enter + 4} fill={Q.cream} chipFill={Q.charcoal} qColor={Q.orange} illusAt={AT.R3b - 2}
        waveIds={['R3a', 'R3b', 'R3c']} waveColor={Q.orange} waveDim="rgba(29,30,33,0.2)">
        <Illus3 f={f} />
      </CaseCard>
      <Captions f={f} ids={['R3a', 'R3b', 'R3c']} y={1050} size={58} color={Q.cream} />
      <Answer f={f} at={AT.R3c + 2} cdAt={END.R3c + 2} y={1330} onOrange />
      <Mascot f={f} pos={mascot} anchor={[1140, 1620]} body={Q.charcoal} />
    </SlideIn>
  );
};

/* ═════════════════════ REVEAL ═════════════════════ */
const Tile: React.FC<{f: number; x: number; n: number; label: string; front: string; back: string; backText: string; flipAt: number; good?: boolean}> = ({f, x, n, label, front, back, backText, flipAt, good}) => {
  const fl = E.inOutCubic(clamp((f - flipAt) / 10));
  const ang = fl * 180;
  const showBack = ang > 90;
  const S = 240;
  return (
    <div style={{position: 'absolute', left: x - S / 2, top: 520, width: S}}>
      <div style={{width: S, height: S, transform: `perspective(900px) rotateY(${ang}deg)`, background: showBack ? back : front, borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px rgba(0,0,0,0.22)'}}>
        <div style={{transform: showBack ? 'scaleX(-1)' : undefined, fontFamily: showBack ? QF.head : QF.text, fontWeight: showBack ? 900 : 700, fontSize: showBack ? 64 : 140, color: Q.cream, direction: 'rtl', textAlign: 'center', lineHeight: 1.05}}>
          {showBack ? backText : ar(n)}
          {showBack && good ? <div style={{fontSize: 46, marginTop: 6}}>✓</div> : null}
        </div>
      </div>
      <div style={{marginTop: 18, textAlign: 'center', fontFamily: QF.text, fontWeight: 700, fontSize: 34, color: Q.ink, direction: 'rtl'}}>{label}</div>
    </div>
  );
};

export const Reveal: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.reveal.from;
  const a2 = wordAt('A2', 2), a3 = wordAt('A3', 2), a4 = wordAt('A4', 0), a4b = wordAt('A4', 2);
  const mascot = pathKeys([[enter, 540, -120], [AT.A1 + 8, 880, 300, 0], [a3 - 8, 880, 300], [a3, 260, 410, 160], [a4 + 4, 260, 410], [a4b, 818, 1185, 220], [END.A4 + 60, 818, 1185]]);
  return (
    <SlideIn f={f} at={enter} from="bottom" tilt={4}>
      <Paper />
      <Head text="الجواب؟" size={150} x={540} y={330} p={seg(f, AT.A1 - 2, AT.A1 + 10, E.linear)} />
      <Tile f={f} x={820} n={1} label="نفس الروتين" front={Q.charcoal} back={Q.charcoal2} backText="تمرين" flipAt={a2 - 8} />
      <Tile f={f} x={540} n={2} label="لحاله" front={Q.charcoal} back={Q.charcoal2} backText="تمرين" flipAt={a2 - 3} />
      <Tile f={f} x={260} n={3} label="مع مدرّب" front={Q.orange} back={Q.orange} backText="تقدُّم" flipAt={a3 - 6} good />
      <Stamp f={f} at={a3 + 4} text="✓" x={260} y={640} size={1} />
      <Head text="كم جبت؟" size={120} x={540} y={1010} p={seg(f, a4 - 2, a4 + 10, E.linear)} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1140, display: 'flex', justifyContent: 'center', gap: 18, direction: 'rtl', opacity: seg(f, a4 + 4, a4 + 12)}}>
        {[3, 2, 1, 0].map((k) => (
          <div key={k} style={{width: 150, height: 86, border: `4px solid ${Q.ink}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: QF.text, fontWeight: 700, fontSize: 40, color: k === 3 && f > a4b ? Q.cream : Q.ink, background: k === 3 && f > a4b ? Q.orange : 'transparent'}}>
            {ar(k)}/{ar(3)}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1300, textAlign: 'center', opacity: seg(f, a4b - 2, a4b + 8)}}>
        <Chip text="💬 اكتبها بالتعليقات" fill={Q.charcoal} size={40} />
      </div>
      <Mascot f={f} pos={mascot} anchor={[540, -80]} />
    </SlideIn>
  );
};

/* ═════════════════════ MOSAIC + TWIST ═════════════════════ */
export const Mosaic: React.FC<{f: number; render: (id: string, frame: number) => React.ReactNode}> = ({f, render}) => {
  const st = SEC.mosaic.from;
  const z = lerp(3, 1, E.inOutCubic(clamp((f - st) / 22)));
  const rot = lerp(0, -2.5, E.inOutCubic(clamp((f - st) / 22)));
  const tiles: Array<[string, number]> = [
    ['hook', wordAt('H2', 0) + 24], ['hook', wordAt('H3', 4) + 12], ['hook', wordAt('H4', 4) + 18],
    ['r1', END.R1b - 4], ['reveal', f], ['r2', END.R2b - 4],
    ['r3', END.R3b - 4], ['r1', END.R1c + 24], ['r3', END.R3c + 24],
  ];
  const band = E.outCubic(clamp((f - (wordAt('T1', 1) - 6)) / 10));
  return (
    <AbsoluteFill style={{background: Q.ink, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${z}) rotate(${rot}deg)`, transformOrigin: '50% 50%'}}>
        {tiles.map(([id, fr], i) => (
          <div key={i} style={{position: 'absolute', left: (i % 3) * 360, top: Math.floor(i / 3) * 640, width: 1080, height: 1920, transform: 'scale(0.3333)', transformOrigin: '0 0', overflow: 'hidden'}}>
            {render(id, fr)}
          </div>
        ))}
      </AbsoluteFill>
      {/* the message band */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, height: 330, background: Q.charcoal, transform: `translateX(${(1 - band) * 100}%) rotate(-3deg)`,
        boxShadow: '0 18px 40px rgba(0,0,0,0.4)'}} />
      <Head text="مو كل حركة…" size={104} x={540} y={930} p={seg(f, wordAt('T1', 1) - 2, wordAt('T1', 1) + 10, E.linear)} color={Q.cream} shadow={null} rot={-3} />
      <Head text="تعني تقدُّم." size={124} x={540} y={1060} p={seg(f, wordAt('T1', 4) - 2, wordAt('T1', 4) + 10, E.linear)} color={Q.orange} shadow={null} rot={-3} />
    </AbsoluteFill>
  );
};

/* ═════════════════════ PITCH ═════════════════════ */
export const Pitch: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.pitch.from;
  const p2 = AT.P2, p3 = AT.P3;
  const toPaper = E.inOutCubic(clamp((f - (p2 - 8)) / 12));
  const steps = [0, 1, 2, 3, 4];
  const stepAt = (k: number) => lerp(wordAt('P2', 4) - 4, END.P3 - 10, k / 4);
  const stairX = (k: number) => 860 - k * 150, stairY = (k: number) => 1640 - k * 58;
  const mascot = pathKeys([
    [enter, 1200, 1080], [AT.P1 + 10, 540, 1080, 120], [p2 - 6, 540, 1080],
    ...steps.map((k): [number, number, number, number] => [stepAt(k), stairX(k), stairY(k) - 52, 90]),
    [END.P3 + 40, stairX(4), stairY(4) - 52],
  ]);
  const kids = seg(f, wordAt('P2', 3) - 4, wordAt('P2', 3) + 8, E.outBack);
  const adults = seg(f, wordAt('P2', 2) - 4, wordAt('P2', 2) + 8, E.outBack);
  const t = f / 30;
  return (
    <SlideIn f={f} at={enter} from="right">
      <Paper color={Q.orange} />
      <Head text="في ريشيب،" size={128} x={540} y={720} p={seg(f, wordAt('P1', 1) - 3, wordAt('P1', 1) + 9, E.linear)} color={Q.cream} shadow={Q.orangeDeep} />
      <Head text="التقدُّم له خطة." size={128} x={540} y={880} p={seg(f, wordAt('P1', 2) - 3, wordAt('P1', 2) + 9, E.linear)} color={Q.ink} shadow={null} />
      {/* paper sheet slides up for «تدريب حضوري للكبار والصغار… خطوة بخطوة» */}
      <AbsoluteFill style={{transform: `translateY(${(1 - toPaper) * 100}%)`}}>
        <Paper />
        <Head text="تدريب حضوري" size={110} x={540} y={300} p={seg(f, wordAt('P2', 0) - 2, wordAt('P2', 1) + 8, E.linear)} />
        {/* adults card (right) */}
        <div style={{position: 'absolute', left: 560, top: 420, width: 400, height: 470, background: Q.charcoal, borderRadius: 16, transform: `scale(${adults}) rotate(2deg)`, overflow: 'hidden'}}>
          <svg width={400} height={470}>
            <line x1={90} y1={120} x2={310} y2={120} stroke={Q.sand} strokeWidth={8} strokeLinecap="round" />
            <g transform="translate(200 120)"><Figure j={solve(pullUp(0.5 - 0.5 * Math.cos(t * 3.4)), ADULT)} P={ADULT} o={FLAT.athleteLight} scale={0.62} flat /></g>
            <Figure j={solve(coachGesture(1, t), ADULT)} P={ADULT} o={FLAT.coach} x={95} y={430} scale={0.55} flat />
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: QF.text, fontWeight: 700, fontSize: 40, color: Q.cream}}>للكبار</div>
        </div>
        {/* kids card (left) */}
        <div style={{position: 'absolute', left: 120, top: 440, width: 400, height: 470, background: Q.orange, borderRadius: 16, transform: `scale(${kids}) rotate(-2deg)`, overflow: 'hidden'}}>
          <svg width={400} height={470}>
            <rect x={110} y={352} width={200} height={14} rx={7} fill={Q.cream} />
            <Figure j={solve(storkBalance(t, CHILD), CHILD)} P={CHILD} o={FLAT.kid} x={215} y={354} scale={0.95} flat />
            <Figure j={solve(coachGesture(1, t), ADULT)} P={ADULT} o={{...FLAT.coach, top: Q.charcoal, topShade: Q.charcoal}} x={330} y={430} scale={0.55} flat flip />
          </svg>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 14, textAlign: 'center', fontFamily: QF.text, fontWeight: 700, fontSize: 40, color: Q.cream}}>للصغار</div>
        </div>
        {/* step by step: a staircase the mascot climbs */}
        <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
          {steps.map((k) => {
            const on = seg(f, stepAt(k) - 6, stepAt(k));
            return <rect key={k} x={stairX(k) - 75} y={stairY(k)} width={150} height={1920} fill={k === 4 ? Q.orange : Q.charcoal} opacity={on} />;
          })}
        </svg>
        <Head text="خطوة بخطوة" size={88} x={540} y={1010} p={seg(f, wordAt('P2', 4) - 2, wordAt('P2', 5) + 6, E.linear)} out={seg(f, p3 - 6, p3)} font={QF.text} weight={700} shadow={null} />
        <Head text="من أول حركة…" size={92} x={540} y={985} p={seg(f, wordAt('P3', 0) - 2, wordAt('P3', 0) + 10, E.linear)} shadow={null} />
        <Head text="لأقوى نسخة منك." size={108} x={540} y={1100} p={seg(f, wordAt('P3', 3) - 2, wordAt('P3', 3) + 10, E.linear)} color={Q.orange} shadow={Q.ink} />
      </AbsoluteFill>
      <Mascot f={f} pos={mascot} anchor={f < p2 ? [1160, 1000] : [1160, 1700]} body={f < p2 - 4 ? Q.cream : Q.charcoal} />
    </SlideIn>
  );
};

/* ═════════════════════ CTA ═════════════════════ */
export const CTA: React.FC<{f: number}> = ({f}) => {
  const enter = SEC.cta.from;
  const w0 = wordAt('C1', 0), w1 = wordAt('C1', 1), w2 = wordAt('C1', 2);
  const logo = spring01((f - (enter + 6)) / FPS, 2.2, 0.7);
  const box = spring01((f - (w1 - 4)) / FPS, 2.6, 0.55);
  const mascot = pathKeys([[enter, -100, 1050], [w0 + 2, 250, 990, 130], [w2, 300, 1010], [w2 + 14, 250, 990, 60]]);
  return (
    <SlideIn f={f} at={enter} from="bottom">
      <Paper />
      <div style={{position: 'absolute', left: 0, right: 0, top: 360, display: 'flex', justifyContent: 'center', opacity: Math.min(1, logo * 1.4), transform: `translateY(${(1 - logo) * 40}px)`}}>
        <Img src={staticFile('brand/reshape-logo.png')} style={{width: 520, height: 'auto'}} />
      </div>
      <div style={{position: 'absolute', left: 540, top: 820, transform: `translate(-50%, -50%) scale(${box}) rotate(-2deg)`, direction: 'rtl'}}>
        <div style={{position: 'absolute', right: 18, top: -48, fontFamily: QF.text, fontWeight: 700, fontSize: 40, color: Q.ink, opacity: seg(f, w0 - 2, w0 + 6)}}>اكتب:</div>
        <div style={{background: Q.orange, color: Q.cream, fontFamily: QF.head, fontWeight: 900, fontSize: 170, lineHeight: 1.1, padding: '6px 70px 18px', borderRadius: 14, boxShadow: `8px 8px 0 ${Q.ink}`}}>ابدأ</div>
      </div>
      <Head text="ونبدأ معك" size={72} x={540} y={1040} p={seg(f, w2 - 2, w2 + 10, E.linear)} font={QF.text} weight={700} shadow={null} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1170, textAlign: 'center', fontFamily: QF.latin, fontWeight: 600, fontSize: 52, color: Q.charcoal, opacity: seg(f, w2 + 4, w2 + 14)}}>reshape-sa.com</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: QF.latin, fontWeight: 600, fontSize: 52, color: Q.orange, opacity: seg(f, w2 + 8, w2 + 18)}}>@reshape.sa</div>
      <Mascot f={f} pos={mascot} anchor={[-60, 1600]} />
    </SlideIn>
  );
};

export const SECTION_COMPONENTS: Record<string, React.FC<{f: number}>> = {hook: Hook, r1: Round1, r2: Round2, r3: Round3, reveal: Reveal, pitch: Pitch, cta: CTA};
export {clean, LINES};
