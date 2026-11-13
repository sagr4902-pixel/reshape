import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {catmull, clamp, E, lerp, seg, spring01, type V2} from '../../../kit/math';
import {GlowDefs, LightPool, MotionPath} from '../../../kit/Path';
import {Word} from '../../../kit/Text';
import {C, FONT} from '../../../kit/theme';
import type {SceneProps} from '../Film';
import contour from '../logo_contour.json';
import {lineEnd, wordAt} from '../timeline';

/** Finale: every path converges, traces the RESHAPE mark, and resolves into the official logo. */
const LW = 560; // logo display width (official PNG, unmodified)
const K = LW / contour.logoW;
const LX = 540 - LW / 2;
const LY = 700; // logo top
const MB = contour.markBBox;
const markLocal: V2[] = (contour.mark as number[][]).map(([x, y]) => [x - (MB[0] + MB[2]) / 2, y - (MB[1] + MB[3]) / 2]);
const MC_LOGO: V2 = [LX + ((MB[0] + MB[2]) / 2) * K, LY + ((MB[1] + MB[3]) / 2) * K];
const HERO_C: V2 = [540, 860];
const HERO_S = 4.1; // hero mark scale (logo px → screen px)
const heroPts: V2[] = markLocal.map(([x, y]) => [HERO_C[0] + x * HERO_S, HERO_C[1] + y * HERO_S]);

// closed contour split into five arcs, one per incoming path
const N = heroPts.length;
const arcs = [0, 1, 2, 3, 4].map((i) => {
  const a = Math.round((i * N) / 5), b = Math.round(((i + 1) * N) / 5);
  const out: V2[] = [];
  for (let k = a; k <= b; k++) out.push(heroPts[k % N]);
  return out;
});
// spiral approaches from outside the frame
const routes = arcs.map((arc, i) => {
  const a0 = -Math.PI / 2 + i * ((2 * Math.PI) / 5) + 0.4;
  const spiral: V2[] = [0, 1, 2, 3].map((k) => {
    const r = 1250 - k * 300;
    const a = a0 + k * 0.62;
    return [HERO_C[0] + Math.cos(a) * r * 0.75, HERO_C[1] + Math.sin(a) * r];
  });
  const approach = catmull([...spiral, arc[0]], 16);
  const full = [...approach.slice(0, -1), ...arc];
  let L = 0, La = 0;
  for (let k = 1; k < full.length; k++) {
    L += Math.hypot(full[k][0] - full[k - 1][0], full[k][1] - full[k - 1][1]);
    if (k === approach.length - 1) La = L;
  }
  return {pts: full, arcStart: La / L, t0: 1078 + [0, 3, 1, 4, 2][i] * 2};
});

const LOGO_AT = 1120; // outline closes and fills on «ريشيب»
const RESOLVE = [1140, 1162] as const; // hero mark → official logo

export const S6Reveal: React.FC<SceneProps> = ({f}) => {
  const bgIn = seg(f, 1076, 1098, E.inOutSine);
  const zoom = lerp(1.18, 1, E.outCubic(seg(f, 1076, 1124)));
  const fill = seg(f, LOGO_AT - 3, LOGO_AT + 3);
  const heroPulse = 1 + 0.04 * (1 - spring01((f - LOGO_AT) / 30, 2.6, 0.6)) * (f >= LOGO_AT ? 1 : 0);
  const res = E.inOutCubic(seg(f, RESOLVE[0], RESOLVE[1], E.linear));
  // hero mark transform: big centre → the mark's place inside the official logo
  const sc = lerp(HERO_S, K, res) * heroPulse;
  const cx = lerp(HERO_C[0], MC_LOGO[0], res), cy = lerp(HERO_C[1], MC_LOGO[1], res);
  const logoIn = seg(f, RESOLVE[1] - 3, RESOLVE[1] + 4);
  const wordWipe = E.inOutCubic(seg(f, RESOLVE[1] - 2, RESOLVE[1] + 18));
  const sweep = seg(f, RESOLVE[1] + 14, RESOLVE[1] + 50, E.inOutSine);
  const impact = seg(f, LOGO_AT, LOGO_AT + 3) * (1 - seg(f, LOGO_AT + 3, LOGO_AT + 34, E.outCubic));
  const endAt = Math.max(lineEnd('L6') + 2, RESOLVE[1] + 60);
  const markFrac = (MB[2] + 8) / contour.logoW;
  const reveal = markFrac + (1 - markFrac) * wordWipe;
  const tf = `translate(${HERO_C[0]}px, ${HERO_C[1]}px) scale(${zoom}) translate(${-HERO_C[0]}px, ${-HERO_C[1]}px)`;
  const heroD = 'M' + markLocal.map(([x, y]) => `${(cx + x * sc).toFixed(1)} ${(cy + y * sc).toFixed(1)}`).join('L') + 'Z';
  return (
    <AbsoluteFill style={{opacity: bgIn}}>
      {/* charcoal studio */}
      <AbsoluteFill style={{background: `linear-gradient(180deg, #26272B 0%, ${C.dark} 46%, #26272B 62%, ${C.night} 100%)`}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 62% 40% at 50% 42%, rgba(233,221,215,0.13) 0%, rgba(233,221,215,0.04) 45%, rgba(0,0,0,0) 72%)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)'}} />

      <AbsoluteFill style={{transform: tf}}>
        <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
          <GlowDefs />
          {impact > 0 ? <LightPool x={cx} y={cy} rx={520 * (0.6 + impact * 0.5)} ry={520 * (0.6 + impact * 0.5)} color={C.orange} opacity={0.3 * impact} /> : null}
          {routes.map((r, i) => {
            const t1 = 1104 + i * 2, t2 = LOGO_AT - 1;
            const to = f < t1 ? lerp(0, r.arcStart, E.inOutSine(seg(f, r.t0, t1, E.linear))) : lerp(r.arcStart, 1, E.outCubic(seg(f, t1, t2, E.linear)));
            const from = f < t1 ? Math.max(0, to - 0.5) : lerp(Math.max(0, r.arcStart - 0.5), r.arcStart, E.outCubic(seg(f, t1, t2 + 3, E.linear)));
            return (
              <MotionPath key={i} pts={r.pts} from={from} to={to} width={lerp(13, 9, seg(f, t1, t2))} taper={0.55}
                head={f < t2 ? 15 : 0} color={C.orange} glow={0.55} opacity={1 - fill} />
            );
          })}
          {/* hero mark: fills on «ريشيب», then resolves into the logo */}
          {f >= LOGO_AT - 3 ? (
            <g opacity={1 - logoIn}>
              <path d={heroD} fill={C.red} opacity={fill} />
              <path d={heroD} fill="none" stroke={C.orange} strokeWidth={9} strokeLinejoin="round" opacity={1 - fill} />
            </g>
          ) : null}
        </svg>
        {/* the official logo (unmodified PNG) */}
        {logoIn > 0 ? (
          <div style={{position: 'absolute', left: LX, top: LY, width: LW, height: contour.logoH * K, opacity: logoIn, clipPath: `inset(-10% ${(1 - reveal) * 100}% -10% -10%)`}}>
            <Img src={staticFile('brand/reshape-logo.png')} style={{width: LW, height: 'auto', display: 'block'}} />
            {sweep > 0 && sweep < 1 ? (
              <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen',
                WebkitMaskImage: `url(${staticFile('brand/reshape-logo.png')})`, WebkitMaskSize: '100% 100%', maskImage: `url(${staticFile('brand/reshape-logo.png')})`, maskSize: '100% 100%',
                background: `linear-gradient(105deg, rgba(255,84,32,0) ${sweep * 140 - 40}%, rgba(255,160,110,0.9) ${sweep * 140 - 22}%, rgba(255,84,32,0) ${sweep * 140 - 4}%)`}} />
            ) : null}
          </div>
        ) : null}
        {logoIn > 0 ? (
          <div style={{position: 'absolute', left: LX, top: LY + contour.logoH * K * 2 + 30, width: LW, transform: 'scaleY(-1)', transformOrigin: 'top', opacity: 0.08 * logoIn,
            clipPath: `inset(-10% ${(1 - reveal) * 100}% -10% -10%)`, filter: 'blur(2px)', WebkitMaskImage: 'linear-gradient(0deg, rgba(0,0,0,0.9), rgba(0,0,0,0) 70%)'}}>
            <Img src={staticFile('brand/reshape-logo.png')} style={{width: LW, height: 'auto', display: 'block'}} />
          </div>
        ) : null}
      </AbsoluteFill>

      {/* campaign line, word by word with the narration, then hands over to the end card */}
      {(() => {
        const ws = [
          {t: 'من', i: 1}, {t: 'أول', i: 2}, {t: 'حركة…', i: 3}, {t: 'لأقوى', i: 4, c: C.orange}, {t: 'نسخة', i: 5}, {t: 'منك', i: 6},
        ];
        const out = seg(f, endAt - 14, endAt - 2, E.inCubic);
        if (out >= 1) return null;
        return (
          <div style={{position: 'absolute', left: 0, right: 0, top: 1100, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center',
            direction: 'rtl', gap: 18, opacity: 1 - out, filter: `blur(${out * 6}px)`}}>
            {ws.map((w) => {
              const at = wordAt('L6', w.i);
              const pe = E.outCubic(seg(f, at - 3, at + 11, E.linear));
              return (
                <span key={w.i} style={{fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: w.c ?? C.sand, opacity: Math.min(1, pe * 1.6),
                  transform: `translateY(${(1 - pe) * 18}px)`, filter: `blur(${(1 - pe) * 6}px)`, clipPath: `inset(-30% 0 -30% ${(1 - pe) * 100}%)`, display: 'inline-block'}}>{w.t}</span>
              );
            })}
          </div>
        );
      })()}

      {/* end card */}
      <Word text="ابدأ رحلتك اليوم" p={seg(f, endAt, endAt + 16, E.linear)} size={96} x={540} y={1100} color={C.light} weight={800} />
      <div style={{position: 'absolute', left: 0, right: 0, top: 1196, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 46,
        letterSpacing: 1.5, color: C.sand, opacity: E.outCubic(seg(f, endAt + 10, endAt + 24)), transform: `translateY(${(1 - E.outCubic(seg(f, endAt + 10, endAt + 24))) * 16}px)`}}>
        reshape-sa.com
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1262, textAlign: 'center', fontFamily: FONT.data, fontWeight: 600, fontSize: 46,
        letterSpacing: 1.5, color: C.orange, opacity: E.outCubic(seg(f, endAt + 16, endAt + 30)), transform: `translateY(${(1 - E.outCubic(seg(f, endAt + 16, endAt + 30))) * 16}px)`}}>
        @reshape.sa
      </div>
      <div style={{position: 'absolute', left: 540 - 60 * clamp((f - endAt - 6) / 18), top: 1168, width: 120 * E.outCubic(clamp((f - endAt - 6) / 18)), height: 3, background: C.orange, borderRadius: 2, opacity: 0.9}} />
    </AbsoluteFill>
  );
};
