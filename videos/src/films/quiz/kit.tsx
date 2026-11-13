import React from 'react';
import {AbsoluteFill} from 'remotion';
import {catmull, clamp, E, lerp, seg, spring01, type V2} from '../../kit/math';
import {AT, END, FPS, LINES, wordAt, type LineId} from './timeline';
import {ar, Q, QF} from './style';

/** Display text: drop short vowels/sukun (keep shadda), keep punctuation. */
export const clean = (s: string) => s.replace(/[ً-ِْ]/g, '').replace(/گ/g, 'ق').replace(/إنت/g, 'أنت');

/* ─────────────── backgrounds & transitions ─────────────── */
export const Paper: React.FC<{color?: string; vignette?: number}> = ({color = Q.paper, vignette = 0.16}) => (
  <AbsoluteFill style={{background: color}}>
    <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 65% at 50% 45%, rgba(255,255,255,0.10) 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`}} />
  </AbsoluteFill>
);

/** Section entry: the whole section slides in over the previous one (the reference's panel moves). */
export const SlideIn: React.FC<{f: number; at: number; dur?: number; from: 'bottom' | 'top' | 'left' | 'right'; children: React.ReactNode; tilt?: number}> = ({f, at, dur = 16, from, children, tilt = 0}) => {
  const p = E.inOutCubic(clamp((f - at) / dur));
  const d = (1 - p) * 100;
  const tx = from === 'left' ? -d : from === 'right' ? d : 0;
  const ty = from === 'top' ? -d : from === 'bottom' ? d : 0;
  return (
    <AbsoluteFill style={{transform: `translate(${tx}%, ${ty}%) rotate(${(1 - p) * tilt}deg)`, transformOrigin: '50% 100%', overflow: 'hidden'}}>
      {children}
    </AbsoluteFill>
  );
};

/* ─────────────── typography ─────────────── */
/** Render Arabic-Indic digit runs in IBM Plex (the display face draws them as Western numerals). */
export const Digits: React.FC<{text: string}> = ({text}) => (
  <>
    {text.split(/([٠-٩]+(?:[\/][٠-٩]+)?)/).map((part, i) =>
      /^[٠-٩]/.test(part) ? <span key={i} style={{fontFamily: QF.text, fontWeight: 700}}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>,
    )}
  </>
);
export const Head: React.FC<{
  text: string; size: number; x: number; y: number; p: number; out?: number; color?: string; shadow?: string | null; rot?: number;
  font?: string; weight?: number; align?: 'center' | 'right' | 'left'; style?: React.CSSProperties;
}> = ({text, size, x, y, p, out = 0, color = Q.ink, shadow = Q.orange, rot = 0, font = QF.head, weight = 900, align = 'center', style}) => {
  const pe = E.outBack(clamp(p)), oe = E.inCubic(clamp(out));
  if (p <= 0 || oe >= 1) return null;
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0%';
  const off = Math.max(3, size * 0.035);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%) rotate(${rot}deg) scale(${0.9 + 0.1 * pe})`, transformOrigin: 'center',
      fontFamily: font, fontWeight: weight, fontSize: size, color, direction: 'rtl', whiteSpace: 'nowrap', lineHeight: 1.1,
      opacity: Math.min(1, clamp(p) * 2) * (1 - oe), clipPath: `inset(-40% 0 -40% ${(1 - E.outCubic(clamp(p * 1.4))) * 100}%)`,
      textShadow: shadow ? `${off}px ${off}px 0 ${shadow}` : undefined, ...style}}>
      <Digits text={text} />
    </div>
  );
};

/** Caption segments: each voice line is split into phrases at its punctuation so no caption line overflows. */
type Seg = {id: LineId; w0: number; w1: number};
const segmentsOf = (ids: LineId[]): Seg[] => {
  const out: Seg[] = [];
  for (const id of ids) {
    const ws = LINES[id].words;
    let w0 = 0;
    ws.forEach((w, i) => {
      const end = /[،…\.؟!]$/.test(w.w) || i === ws.length - 1;
      if (end && (i - w0 >= 1 || i === ws.length - 1)) {
        out.push({id, w0, w1: i});
        w0 = i + 1;
      }
    });
  }
  // merge one-word fragments into their neighbour
  const merged: Seg[] = [];
  for (const sg of out) {
    const last = merged[merged.length - 1];
    if (last && last.id === sg.id && sg.w1 - sg.w0 === 0 && last.w1 - last.w0 < 3) last.w1 = sg.w1;
    else merged.push({...sg});
  }
  return merged;
};
const segText = (sg: Seg) => LINES[sg.id].words.slice(sg.w0, sg.w1 + 1).map((w) => clean(w.w)).join(' ');

/** Two-line karaoke captions: the current phrase builds word by word, the previous phrase sits above in grey. */
export const Captions: React.FC<{f: number; ids: LineId[]; y: number; size?: number; color?: string; dim?: string; until?: number}> = ({f, ids, y, size = 60, color = Q.ink, dim, until}) => {
  const segs = segmentsOf(ids);
  let cur = -1;
  segs.forEach((sg, i) => { if (f >= wordAt(sg.id, sg.w0) - 2) cur = i; });
  if (cur < 0) return null;
  if (until !== undefined && f > until) return null;
  const lineH = size * 1.32;
  const sg = segs[cur];
  const at0 = wordAt(sg.id, sg.w0);
  const shift = E.inOutCubic(clamp((f - (at0 - 2)) / 8));
  const prev = cur > 0 ? segs[cur - 1] : null;
  const words = LINES[sg.id].words.slice(sg.w0, sg.w1 + 1);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: y, direction: 'rtl', fontFamily: QF.text, fontWeight: 700, textAlign: 'center'}}>
      {prev ? (
        <div style={{fontSize: size * 0.82, color: dim ?? color, opacity: 0.4, transform: `translateY(${(1 - shift) * lineH}px)`, lineHeight: 1.25, whiteSpace: 'nowrap'}}>
          {segText(prev)}
        </div>
      ) : (
        <div style={{height: size * 0.82 * 1.25}} />
      )}
      <div style={{fontSize: size, color, lineHeight: 1.25, whiteSpace: 'nowrap', opacity: prev ? shift : 1}}>
        {words.map((w, i) => {
          const at = wordAt(sg.id, sg.w0 + i);
          const p = E.outCubic(clamp((f - at + 2) / 6));
          return (
            <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 14}px)`, marginInline: size * 0.12}}>
              {clean(w.w)}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────── UI pieces ─────────────── */
export const Chip: React.FC<{text: string; fill: string; color?: string; size?: number; style?: React.CSSProperties; border?: string}> = ({text, fill, color = Q.cream, size = 30, style, border}) => (
  <div style={{display: 'inline-block', background: fill, color, fontFamily: QF.text, fontWeight: 700, fontSize: size, lineHeight: 1, padding: `${size * 0.32}px ${size * 0.55}px`,
    borderRadius: 6, direction: 'rtl', whiteSpace: 'nowrap', border: border ? `3px solid ${border}` : undefined, ...style}}>
    {text}
  </div>
);

/** Round indicator ١ ٢ ٣ (top-left, like the reference). */
export const Rounds: React.FC<{active: number; dark?: boolean; p?: number}> = ({active, dark = false, p = 1}) => (
  <div style={{position: 'absolute', left: 58, top: 128, display: 'flex', gap: 8, opacity: p}}>
    {[1, 2, 3].map((n) => (
      <div key={n} style={{width: 38, height: 38, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: n === active ? Q.orange : n < active ? (dark ? Q.cream : Q.charcoal) : 'transparent',
        border: `3px solid ${n === active ? Q.orange : dark ? Q.cream : Q.charcoal}`,
        color: n === active ? Q.cream : n < active ? (dark ? Q.ink : Q.cream) : dark ? Q.cream : Q.charcoal,
        fontFamily: QF.text, fontWeight: 700, fontSize: 24}}>
        {ar(n)}
      </div>
    ))}
  </div>
);

/** Voice-note waveform: bars of the line's loudness fill as it is spoken. */
export const Wave: React.FC<{f: number; ids: LineId[]; x: number; y: number; w: number; h: number; color: string; dimColor: string}> = ({f, ids, x, y, w, h, color, dimColor}) => {
  let id: LineId | null = null;
  for (const i of ids) if (f >= AT[i] - 1 && f <= END[i] + 4) id = i;
  const n = 44;
  const gap = w / n;
  if (!id) {
    return (
      <svg style={{position: 'absolute', left: x, top: y}} width={w} height={h}>
        {Array.from({length: n}, (_, i) => <circle key={i} cx={w - (i + 0.5) * gap} cy={h / 2} r={2.2} fill={dimColor} />)}
      </svg>
    );
  }
  const L = LINES[id];
  const prog = clamp((f - AT[id]) / (L.duration * FPS));
  const live = L.env[Math.max(0, Math.min(L.env.length - 1, Math.floor(f - AT[id])))] ?? 0;
  return (
    <svg style={{position: 'absolute', left: x, top: y}} width={w} height={h}>
      {L.bars.map((b, i) => {
        const played = i / n < prog;
        const atHead = Math.abs(i / n - prog) < 1.5 / n;
        const bh = Math.max(4, h * (0.12 + 0.88 * b) * (atHead ? 0.8 + 0.5 * live : 1));
        // right-to-left, like reading Arabic
        const cx = w - (i + 0.5) * gap;
        return <rect key={i} x={cx - gap * 0.28} y={(h - bh) / 2} width={gap * 0.56} height={bh} rx={gap * 0.28} fill={played ? color : dimColor} />;
      })}
    </svg>
  );
};

/** Answer chips with a 3-2-1 countdown ring between them. */
export const Answer: React.FC<{f: number; at: number; cdAt: number; y: number; onDark?: boolean; onOrange?: boolean}> = ({f, at, cdAt, y, onDark = false, onOrange = false}) => {
  const p = spring01((f - at) / FPS, 2.6, 0.7);
  if (f < at) return null;
  const cd = f - cdAt;
  const n = cd < 0 ? 3 : cd < 15 ? 3 : cd < 30 ? 2 : 1;
  const ring = clamp(cd / 45);
  const r = 40, C = 2 * Math.PI * r;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, direction: 'rtl',
      transform: `translateY(${(1 - p) * 60}px) scale(${0.85 + 0.15 * p})`, opacity: Math.min(1, p * 1.5)}}>
      <Chip text="تمرين" fill={onOrange ? Q.charcoal : onDark ? Q.cream : Q.charcoal} color={onOrange ? Q.cream : onDark ? Q.ink : Q.cream} size={54} />
      <svg width={104} height={104}>
        <circle cx={52} cy={52} r={r} fill="none" stroke={onDark || onOrange ? 'rgba(246,240,235,0.3)' : 'rgba(29,30,33,0.18)'} strokeWidth={7} />
        <circle cx={52} cy={52} r={r} fill="none" stroke={onOrange ? Q.cream : Q.orange} strokeWidth={7} strokeDasharray={C} strokeDashoffset={C * (1 - ring)} transform="rotate(-90 52 52)" strokeLinecap="round" />
        <text x={52} y={52} textAnchor="middle" dominantBaseline="central" fontFamily={QF.text} fontWeight={700} fontSize={44} fill={onDark || onOrange ? Q.cream : Q.ink}
          opacity={cd >= 0 ? 1 : 0.35}>{ar(n)}</text>
      </svg>
      <Chip text="تقدُّم" fill={onOrange ? Q.cream : Q.orange} color={onOrange ? Q.orange : Q.cream} size={54} />
    </div>
  );
};

/* ─────────────── mascot + cord ─────────────── */
export type PosFn = (f: number) => V2;
/** Keyframed path with little hops between keys. keys: [frame, x, y, hop?] */
export const pathKeys = (keys: Array<[number, number, number, number?]>): PosFn => (f) => {
  if (f <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    const [f1, x1, y1, hop = 0] = keys[i];
    const [f0, x0, y0] = keys[i - 1];
    if (f <= f1) {
      const t = (f - f0) / (f1 - f0);
      const e = E.inOutCubic(t);
      return [lerp(x0, x1, e), lerp(y0, y1, e) - Math.sin(Math.PI * t) * hop];
    }
  }
  const k = keys[keys.length - 1];
  return [k[1], k[2]];
};

export const Mascot: React.FC<{f: number; pos: PosFn; anchor: V2; size?: number; body?: string; cord?: string; opacity?: number; look?: number}> = ({f, pos, anchor, size = 80, body = Q.charcoal, cord = Q.orange, opacity = 1}) => {
  const p0 = pos(f), p1 = pos(f - 1), pL1 = pos(f - 6), pL2 = pos(f - 16);
  const v: V2 = [p0[0] - p1[0], p0[1] - p1[1]];
  const speed = Math.hypot(v[0], v[1]);
  const stretch = clamp(speed / 40, 0, 0.22);
  const ang = (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  const dist = Math.hypot(p0[0] - anchor[0], p0[1] - anchor[1]);
  const sag = Math.min(260, dist * 0.22);
  const mid: V2 = [lerp(anchor[0], pL2[0], 0.55), lerp(anchor[1], pL2[1], 0.55) + sag];
  const pts = catmull([anchor, mid, pL1, [p0[0], p0[1] + size * 0.45]], 14);
  const blink = (f % 97) < 4 ? 0.15 : 1;
  const s = size;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity, overflow: 'visible'}}>
      <path d={'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('L')} fill="none" stroke={cord} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(${p0[0]} ${p0[1]}) rotate(${speed > 0.5 ? ang : 0}) scale(${1 + stretch} ${1 - stretch * 0.6}) rotate(${speed > 0.5 ? -ang : 0})`}>
        <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.16} fill={body} />
        <rect x={-s * 0.24} y={-s * 0.2} width={s * 0.12} height={s * 0.26 * blink} rx={s * 0.06} fill={body === Q.cream ? Q.ink : Q.cream} />
        <rect x={s * 0.12} y={-s * 0.2} width={s * 0.12} height={s * 0.26 * blink} rx={s * 0.06} fill={body === Q.cream ? Q.ink : Q.cream} />
        <path d={`M${-s * 0.2} ${s * 0.14} Q0 ${s * 0.32} ${s * 0.2} ${s * 0.14}`} fill="none" stroke={Q.orange} strokeWidth={s * 0.07} strokeLinecap="round" />
      </g>
    </svg>
  );
};

/** Stamp: a word in a tilted box with a dotted burst (the reference's «الفايز»). */
export const Stamp: React.FC<{f: number; at: number; text: string; x: number; y: number; size?: number; color?: string}> = ({f, at, text, x, y, size = 80, color = Q.orange}) => {
  if (f < at) return null;
  const p = spring01((f - at) / FPS, 3.2, 0.5);
  const burst = clamp((f - at) / 18);
  const dots = Array.from({length: 18}, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 120 + burst * 90;
    return <circle key={i} cx={Math.cos(a) * r * 1.5} cy={Math.sin(a) * r} r={5 * (1 - burst * 0.6)} fill={Q.ink} opacity={1 - burst} />;
  });
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(-7deg) scale(${p})`}}>
      <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}><g>{dots}</g></svg>
      <div style={{border: `${size * 0.07}px solid ${color}`, color, fontFamily: QF.head, fontWeight: 900, fontSize: size, padding: `${size * 0.02}px ${size * 0.25}px`, lineHeight: 1.15, direction: 'rtl', whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.0)', transform: 'translate(-50%, -50%)', position: 'absolute'}}>
        {text}
      </div>
    </div>
  );
};

export const fadeWin = (f: number, a: number, b: number, c: number, d: number) => seg(f, a, b) * (1 - seg(f, c, d));
