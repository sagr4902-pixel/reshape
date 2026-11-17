import React from 'react';
import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {ensureFonts} from '../../kit/fonts';
import {ContactShadow, Figure, OUTFITS} from '../../kit/Figure';
import {catmull, clamp, E, lerp, seg, spring01, type V2} from '../../kit/math';
import {GlowDefs, MotionPath} from '../../kit/Path';
import {pressHandstand} from '../../kit/poses';
import {ADULT, solve} from '../../kit/rig';
import {Grain} from '../../kit/Stage';
import {C, FONT} from '../../kit/theme';

ensureFonts();

/**
 * «لوحة تقدّمك» — one continuous camera glide over a tilted bento board of training widgets that fill in
 * as the camera reaches them (ref: library 015, refined.motion). Animation only, no music: UI sounds only.
 */
export const FPS = 30;
const toAr = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
const LIGHT = '#F7F2EE', DARK = C.dark, MUTED = '#9C938D', DIM = '#55565C';

/* ── timeline (frames) ── */
export const T = {
  build: 0, cal: 45, str: 118, clock: 178, skill: 236, next: 318, ring: 376, route: 426, pull: 486, end: 546, total: 612,
};

/* ── board layout (board px) ── */
const G = 24, BW = 1040;
type Box = {x: number; y: number; w: number; h: number; dark?: boolean};
const B: Record<string, Box> = {
  cal: {x: 0, y: 0, w: 620, h: 520, dark: true},
  str: {x: 644, y: 0, w: 396, h: 520},
  clock: {x: 0, y: 544, w: 380, h: 380},
  skill: {x: 404, y: 544, w: 636, h: 380, dark: true},
  next: {x: 0, y: 948, w: 620, h: 380, dark: true},
  ring: {x: 644, y: 948, w: 396, h: 380},
  route: {x: 0, y: 1352, w: BW, h: 380},
};
const BH = 1732;
const centre = (b: Box): V2 => [b.x + b.w / 2, b.y + b.h / 2];

/* ── camera: [frame, focus x, focus y, zoom] ── */
const CAM: Array<[number, number, number, number]> = [
  [0, 520, 700, 0.62], [T.cal - 12, 520, 700, 0.66], [T.cal + 6, ...centre(B.cal), 1.22],
  [T.str - 8, ...centre(B.cal), 1.26], [T.str + 8, ...centre(B.str), 1.24],
  [T.clock - 8, ...centre(B.str), 1.27], [T.clock + 8, ...centre(B.clock), 1.36],
  [T.skill - 8, ...centre(B.clock), 1.4], [T.skill + 8, ...centre(B.skill), 1.2],
  [T.next - 8, ...centre(B.skill), 1.24], [T.next + 8, ...centre(B.next), 1.24],
  [T.ring - 8, ...centre(B.next), 1.27], [T.ring + 8, ...centre(B.ring), 1.34],
  [T.route - 8, ...centre(B.ring), 1.37], [T.route + 10, ...centre(B.route), 1.0],
  [T.pull - 6, ...centre(B.route), 1.03], [T.pull + 26, 520, BH / 2, 0.6], [T.end, 520, BH / 2, 0.58],
];
const cam = (f: number): [number, number, number] => {
  let i = 0;
  while (i < CAM.length - 1 && f >= CAM[i + 1][0]) i++;
  const a = CAM[i], b = CAM[Math.min(i + 1, CAM.length - 1)];
  const t = b[0] === a[0] ? 0 : E.inOutCubic(clamp((f - a[0]) / (b[0] - a[0])));
  return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
};
/** Frames where the camera travels fast (motion blur on). */
export const MOVING = (f: number) => CAM.some(([k], i) => i > 0 && f >= CAM[i - 1][0] && f <= k && k - CAM[i - 1][0] <= 32 && CAM[i - 1][1] !== CAM[i][1]);

/* ── shared bits ── */
const pop = (f: number, at: number, d = 10) => spring01((f - at) / d / 1.6, 2.6, 0.55);
const Tile: React.FC<{b: Box; f: number; i: number; children?: React.ReactNode}> = ({b, f, i, children}) => {
  const p = spring01((f - (4 + i * 4)) / 18, 2.2, 0.6);
  return (
    <div style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 48, background: b.dark ? DARK : LIGHT, overflow: 'hidden',
      transform: `translateY(${(1 - clamp(p)) * 140}px) scale(${lerp(0.82, 1, clamp(p))})`, opacity: clamp(p * 2),
      boxShadow: b.dark ? '0 26px 50px rgba(30,25,22,0.32), inset 0 1px 0 rgba(255,255,255,0.08)' : '0 26px 50px rgba(30,25,22,0.18), inset 0 2px 0 #FFFFFF, inset 0 -3px 0 rgba(0,0,0,0.05)'}}>
      {children}
    </div>
  );
};
const Title: React.FC<{text: string; dark?: boolean; o?: number}> = ({text, dark, o = 1}) => (
  <div style={{position: 'absolute', right: 40, top: 34, fontFamily: FONT.display, fontWeight: 800, fontSize: 46, color: dark ? C.light : DARK, direction: 'rtl', opacity: o}}>{text}</div>
);
const Num: React.FC<{v: string; size: number; color: string; style?: React.CSSProperties}> = ({v, size, color, style}) => (
  <div style={{fontFamily: FONT.body, fontWeight: 700, fontSize: size, color, lineHeight: 1, direction: 'rtl', ...style}}>{v}</div>
);

/* ── W1: training-day calendar ── */
const TRAIN_DAYS = [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20]; // 12 sessions out of 21 days
const Calendar: React.FC<{f: number}> = ({f}) => {
  const t0 = T.cal + 8;
  const lit = (d: number) => {
    const k = TRAIN_DAYS.indexOf(d);
    return k < 0 ? -1 : t0 + k * 4;
  };
  const count = TRAIN_DAYS.filter((d) => f >= lit(d)).length;
  return (
    <>
      <Title text="أيام تمرينك" dark />
      <div style={{position: 'absolute', left: 40, top: 40, padding: '6px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', fontFamily: FONT.body, fontWeight: 600, fontSize: 24, color: MUTED}}>نوفمبر</div>
      {Array.from({length: 21}, (_, i) => {
        const d = i + 1, col = 6 - (i % 7), row = Math.floor(i / 7); // RTL: day 1 on the right
        const cx = 70 + col * 80, cy = 170 + row * 104;
        const at = lit(d), on = at >= 0 && f >= at;
        const s = on ? pop(f, at, 8) : 1;
        return (
          <div key={d} style={{position: 'absolute', left: cx - 32, top: cy - 32, width: 64, height: 64, borderRadius: 32, transform: `scale(${s})`,
            background: on ? C.orange : 'transparent', border: on ? 'none' : `3px solid ${at >= 0 ? DIM : '#3C3D42'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 700, fontSize: 26, color: on ? '#FFF' : at >= 0 ? MUTED : '#5E5F64'}}>
            {toAr(d)}
          </div>
        );
      })}
      <div style={{position: 'absolute', right: 40, bottom: 34, display: 'flex', alignItems: 'baseline', gap: 14, direction: 'rtl'}}>
        <Num v={toAr(count)} size={64} color={C.orange} style={{transform: `scale(${count ? pop(f, lit(TRAIN_DAYS[count - 1]), 6) : 1})`}} />
        <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 34, color: C.light}}>حصة هالشهر</div>
      </div>
    </>
  );
};

/* ── W2: pull-up strength (battery bars) ── */
const STEPS: Array<[number, number]> = [[T.str + 4, 2], [T.str + 20, 5], [T.str + 36, 8]];
const Strength: React.FC<{f: number}> = ({f}) => {
  let v = 0, at = -99;
  for (const [t, n] of STEPS) if (f >= t) { v = n; at = t; }
  return (
    <>
      <Title text="العقلة" />
      <div style={{position: 'absolute', right: 40, top: 112, display: 'flex', alignItems: 'baseline', gap: 10, direction: 'rtl'}}>
        <Num v={toAr(v)} size={150} color={C.orange} style={{transform: `scale(${at > 0 ? pop(f, at, 7) : 1})`, transformOrigin: 'right bottom'}} />
        <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 36, color: MUTED}}>عقلات</div>
      </div>
      <div style={{position: 'absolute', left: 36, right: 36, bottom: 92, height: 120, display: 'flex', flexDirection: 'row-reverse', gap: 10}}>
        {Array.from({length: 8}, (_, i) => {
          const on = i < v;
          const stepAt = STEPS.find(([, n]) => n > i)?.[0] ?? 0;
          const g = on ? clamp((f - stepAt) / 4 + 0.001) : 0;
          return <div key={i} style={{flex: 1, borderRadius: 12, background: on ? C.orange : '#E6DDD6', transform: `scaleY(${on ? lerp(0.4, 1, E.outBack(g)) : 1})`, transformOrigin: 'bottom'}} />;
        })}
      </div>
      <div style={{position: 'absolute', right: 40, bottom: 34, fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: MUTED, direction: 'rtl', opacity: seg(f, T.str + 38, T.str + 46)}}>
        +{toAr(6)} خلال {toAr(8)} أسابيع
      </div>
    </>
  );
};

/* ── W3: session clock ── */
const Clock: React.FC<{f: number}> = ({f}) => {
  const s = spring01((f - (T.clock + 4)) / 40, 1.6, 0.72);
  const minA = lerp(0, 360 * 2 + 180, s), hourA = lerp(0, 165, s); // → 5:30
  const R = 140, cx = 190, cy = 170;
  return (
    <>
      <svg width={380} height={380} style={{position: 'absolute', inset: 0}}>
        <circle cx={cx} cy={cy} r={R} fill="#FFFFFF" stroke="#E6DDD6" strokeWidth={4} />
        {Array.from({length: 12}, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={cx + Math.sin(a) * (R - 14)} y1={cy - Math.cos(a) * (R - 14)} x2={cx + Math.sin(a) * (R - (i % 3 ? 26 : 36))} y2={cy - Math.cos(a) * (R - (i % 3 ? 26 : 36))} stroke={i % 3 ? '#CFC5BE' : DARK} strokeWidth={i % 3 ? 4 : 7} strokeLinecap="round" />;
        })}
        <line x1={cx} y1={cy} x2={cx + Math.sin((hourA * Math.PI) / 180) * 72} y2={cy - Math.cos((hourA * Math.PI) / 180) * 72} stroke={DARK} strokeWidth={12} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={cx + Math.sin((minA * Math.PI) / 180) * 110} y2={cy - Math.cos((minA * Math.PI) / 180) * 110} stroke={C.orange} strokeWidth={7} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={11} fill={C.orange} />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 22, textAlign: 'center', direction: 'rtl', opacity: seg(f, T.clock + 30, T.clock + 38)}}>
        <span style={{fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: DARK}}>{toAr(5)}:{toAr(30)} م</span>
      </div>
    </>
  );
};

/* ── W4: handstand skill (drawn figure + progress) ── */
const Skill: React.FC<{f: number}> = ({f}) => {
  const p = E.inOutSine(clamp((f - (T.skill + 6)) / 56));
  const k = lerp(0, 3, p);
  const done = f >= T.skill + 62;
  const pct = Math.round(p * 100);
  return (
    <>
      <Title text="وقفة اليد" dark />
      <svg width={300} height={380} style={{position: 'absolute', left: 6, top: 0}}>
        <ContactShadow x={150} y={336} w={170} opacity={0.4} />
        <rect x={86} y={330} width={128} height={9} rx={4} fill="#6A6B71" />
        <Figure j={solve(pressHandstand(k, ADULT, done ? Math.sin(f * 0.4) * 1.2 * Math.exp(-(f - T.skill - 62) / 8) : 0), ADULT)} P={ADULT} o={OUTFITS.athlete} x={150} y={330} scale={0.62} rim={{color: C.orange, dx: 1.6, dy: -0.8, opacity: 0.9}} />
      </svg>
      <div style={{position: 'absolute', right: 40, top: 128, display: 'flex', alignItems: 'baseline', gap: 6, direction: 'rtl'}}>
        <Num v={`${toAr(pct)}٪`} size={92} color={done ? C.orange : C.light} style={{transform: `scale(${done ? pop(f, T.skill + 62, 7) : 1})`, transformOrigin: 'right bottom'}} />
      </div>
      <div style={{position: 'absolute', right: 40, top: 250, width: 300, height: 22, borderRadius: 11, background: '#45464C', overflow: 'hidden'}}>
        <div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: `${p * 100}%`, borderRadius: 11, background: `linear-gradient(270deg, ${C.orangeDeep}, ${C.orange} 70%, ${C.orangeHot})`}} />
      </div>
      <div style={{position: 'absolute', right: 40, top: 300, padding: '6px 20px', borderRadius: 22, background: C.orange, fontFamily: FONT.display, fontWeight: 800, fontSize: 30, color: '#FFF', direction: 'rtl',
        transform: `scale(${done ? pop(f, T.skill + 64, 8) : 0})`, transformOrigin: 'right center'}}>✓ أتقنتها</div>
    </>
  );
};

/* ── W5: next session (like a flight card) ── */
const typed = (s: string, f: number, at: number, cps = 1.4) => s.slice(0, Math.max(0, Math.floor((f - at) * cps)));
const Next: React.FC<{f: number}> = ({f}) => {
  const a = T.next + 4;
  const line = clamp((f - (a + 10)) / 14);
  return (
    <>
      <Title text="حصتك الجاية" dark />
      <svg width={620} height={380} style={{position: 'absolute', inset: 0}}>
        <circle cx={560} cy={168} r={12} fill={C.orange} opacity={seg(f, a, a + 4)} />
        <line x1={560} y1={184} x2={560} y2={184 + 100 * line} stroke="#5E5F64" strokeWidth={4} strokeDasharray="8 10" />
        <circle cx={560} cy={296} r={12} fill="none" stroke={C.light} strokeWidth={4} opacity={seg(f, a + 22, a + 26)} />
      </svg>
      <div style={{position: 'absolute', right: 96, top: 142, direction: 'rtl', fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.light}}>{typed('الأحد · ٥:٣٠ م', f, a + 2)}</div>
      <div style={{position: 'absolute', right: 96, top: 192, direction: 'rtl', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: MUTED}}>{typed('تدريب حضوري', f, a + 12)}</div>
      <div style={{position: 'absolute', right: 96, top: 270, direction: 'rtl', fontFamily: FONT.display, fontWeight: 800, fontSize: 40, color: C.light}}>{typed('مع مدربك', f, a + 24)}</div>
      <div style={{position: 'absolute', left: 40, top: 262, width: 64, height: 64, borderRadius: 32, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${pop(f, a + 34, 8)})`, color: '#FFF', fontSize: 34, fontFamily: FONT.display, fontWeight: 900}}>✓</div>
    </>
  );
};

/* ── W6: streak ring ── */
const Ring: React.FC<{f: number}> = ({f}) => {
  const p = E.outCubic(clamp((f - (T.ring + 4)) / 34));
  const n = Math.round(p * 12);
  const R = 118, L = 2 * Math.PI * R;
  return (
    <>
      <svg width={396} height={380} style={{position: 'absolute', inset: 0}}>
        <circle cx={198} cy={196} r={R} fill="none" stroke="#E6DDD6" strokeWidth={26} />
        <circle cx={198} cy={196} r={R} fill="none" stroke={C.orange} strokeWidth={26} strokeLinecap="round" strokeDasharray={L} strokeDashoffset={L * (1 - p * (12 / 14))} transform="rotate(-90 198 196)" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 126, textAlign: 'center'}}>
        <Num v={toAr(n)} size={100} color={DARK} />
        <div style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 24, color: MUTED, direction: 'rtl', marginTop: 2}}>يوم ما وقفت</div>
      </div>
    </>
  );
};

/* ── W7: milestone route (like the map) ── */
const NODES: Array<[number, number, string]> = [[960, 250, 'البداية'], [700, 150, 'أول عقلة'], [420, 260, 'أول وقفة يد'], [130, 150, 'أول ليفر']];
const ROUTE: V2[] = catmull(NODES.map(([x, y]) => [x, y] as V2), 16);
const Route: React.FC<{f: number}> = ({f}) => {
  const p = E.inOutSine(clamp((f - (T.route + 8)) / 46));
  const seglen = ROUTE.map((pt, i) => (i ? Math.hypot(pt[0] - ROUTE[i - 1][0], pt[1] - ROUTE[i - 1][1]) : 0));
  const cum: number[] = []; seglen.reduce((a, b, i) => (cum[i] = a + b), 0);
  const total = cum[cum.length - 1];
  const nodeT = NODES.map((_, k) => cum[k * 16] / total);
  const head = (() => {
    const target = p * total; let i = 1;
    while (i < cum.length - 1 && cum[i] < target) i++;
    const u = (target - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return [lerp(ROUTE[i - 1][0], ROUTE[i][0], u), lerp(ROUTE[i - 1][1], ROUTE[i][1], u)] as V2;
  })();
  return (
    <>
      <Title text="مسارك" />
      <svg width={1040} height={380} style={{position: 'absolute', inset: 0}}>
        <GlowDefs />
        <MotionPath pts={ROUTE} to={1} width={10} color="#E6DDD6" glow={0} />
        <MotionPath pts={ROUTE} to={p} width={10} glow={0.4} />
        {NODES.map(([x, y], k) => {
          const on = p >= nodeT[k] - 0.001;
          const at = T.route + 8 + nodeT[k] * 46;
          return <circle key={k} cx={x} cy={y} r={on ? 20 * pop(f, at, 7) : 14} fill={on ? C.orange : '#FFFFFF'} stroke={on ? 'none' : '#CFC5BE'} strokeWidth={5} />;
        })}
        {p > 0 && p < 1 ? <circle cx={head[0]} cy={head[1]} r={12} fill="#FFFFFF" stroke={C.orange} strokeWidth={6} /> : null}
      </svg>
      {NODES.map(([x, y, label], k) => (
        <div key={k} style={{position: 'absolute', left: x, top: y + (y < 200 ? 40 : -90), transform: 'translateX(-50%)', whiteSpace: 'nowrap', direction: 'rtl',
          fontFamily: FONT.display, fontWeight: 800, fontSize: 32, color: p >= nodeT[k] ? DARK : '#B5ABA4'}}>{label}</div>
      ))}
    </>
  );
};

const WIDGETS: Array<[keyof typeof B, React.FC<{f: number}>]> = [
  ['cal', Calendar], ['str', Strength], ['clock', Clock], ['skill', Skill], ['next', Next], ['ring', Ring], ['route', Route],
];

/* ── scene ── */
const BoardScene: React.FC<{f: number}> = ({f}) => {
  const [fx, fy, z] = cam(f);
  const tilt = lerp(22, 16, seg(f, T.pull, T.pull + 26));
  const endO = seg(f, T.end - 6, T.end + 2, E.linear);
  const head = seg(f, 6, 16) * (1 - seg(f, T.cal - 6, T.cal + 4));
  const outro = seg(f, T.pull + 18, T.pull + 30);
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 60% at 50% 45%, #EFE7E1 0%, ${C.sand} 70%, #CDBFB5 100%)`, overflow: 'hidden'}}>
      <AbsoluteFill style={{perspective: 2400, perspectiveOrigin: '540px 960px'}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: BW, height: BH, transformOrigin: '0 0',
          transform: `translate(540px, 960px) rotateX(${tilt}deg) rotateZ(-9deg) scale(${z}) translate(${-fx}px, ${-fy}px)`}}>
          {WIDGETS.map(([k, W], i) => (
            <Tile key={k} b={B[k]} f={f} i={i}>{f >= T.cal - 10 ? <W f={f} /> : null}</Tile>
          ))}
        </div>
      </AbsoluteFill>
      {/* opening line + pull-back line (screen space) */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', direction: 'rtl', fontFamily: FONT.display, fontWeight: 900, fontSize: 120, color: DARK,
        opacity: head, transform: `translateY(${(1 - head) * 30}px)`}}>لوحة تقدّمك</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', direction: 'rtl', fontFamily: FONT.display, fontWeight: 900, fontSize: 116, color: DARK,
        opacity: outro, transform: `scale(${lerp(0.9, 1, outro)})`}}>تقدّمك… <span style={{color: C.orange}}>ينشاف.</span></div>
      {/* end card */}
      {endO > 0 ? (
        <AbsoluteFill style={{opacity: endO, background: `radial-gradient(ellipse 70% 45% at 50% 42%, #3A3B40 0%, ${C.dark} 45%, ${C.ink} 100%)`}}>
          <Img src={staticFile('brand/reshape-logo.png')} style={{position: 'absolute', left: 540 - 290, top: 640, width: 580, transform: `scale(${pop(f, T.end, 8)})`}} />
          <div style={{position: 'absolute', left: 540, top: 1080, transform: `translate(-50%, -50%) scale(${pop(f, T.end + 10, 9)})`, padding: '30px 90px', borderRadius: 80, background: C.orange,
            fontFamily: FONT.display, fontWeight: 900, fontSize: 84, color: '#FFF', direction: 'rtl', whiteSpace: 'nowrap', boxShadow: '0 20px 40px rgba(0,0,0,0.35)'}}>ابدأ اليوم</div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 52, color: C.sand, opacity: seg(f, T.end + 20, T.end + 28)}}>reshape-sa.com</div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Now: React.FC = () => <BoardScene f={useCurrentFrame()} />;

export const Board: React.FC<{mixFile?: string; blur?: boolean}> = ({mixFile, blur = false}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.sand}}>
      {blur && MOVING(f) ? <CameraMotionBlur shutterAngle={160} samples={5}><Now /></CameraMotionBlur> : <Now />}
      <Grain frame={f} opacity={0.05} />
      {mixFile ? <Audio src={staticFile(mixFile)} /> : null}
    </AbsoluteFill>
  );
};
