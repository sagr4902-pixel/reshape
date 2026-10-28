import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticWords } from "../../components/KineticWords";
import { LogoLockup } from "../../components/Logo";
import { DISPLAY_URL, FONTS, INSTAGRAM } from "../../lib/brand";
import { Athlete, jumpSquat, squat } from "../Athlete";
import { MCOLORS, SLANT } from "../design";
import { DrawPath, Glow, Ring, clamp, easeInOut, easeOut, prog } from "../kit";
import { MT, mscene, msec, mword } from "../timeline";

// SCENE 5 — CTA + END CARD (24.7–35.0 s)
// "RESHAPE… غيّر أداءك، وارفع مستواك. سجّل الحين، وخلّ التحدّي يبدا!"
// The logo lands on "RESHAPE" and stays as the anchor of the end card. The end card is fully
// built ~29 s and holds untouched (apart from the class training below it) to 35 s.

const w = (t: string, n = 0) => mword("cta", t, n);
const T = {
  brand: w("RESHAPE"),
  ghayyir: w("غيّر"),
  adaak: w("أداءك"),
  wirfa: w("وارفع"),
  mustawak: w("مستواك", 1),
  sajjil: w("سجّل"),
};
const END_CARD = msec(MT.endCardAt) - mscene("cta").from;
const LINES_OUT = END_CARD - 12;

const LOGO_W = 700;
const LOGO_Y = 430; // centre of the lockup on the end card

/** Animated registration CTA: flat slanted brand label (not a fake UI button). */
const CtaLabel: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180, mass: 0.7 } });
  if (frame < at - 1) return null;
  const sheen = ((frame - at - 14) % 54) / 54; // periodic light sweep
  const W = 560;
  const H = 136;
  return (
    <div style={{ position: "absolute", left: 540 - W / 2, top: 790, width: W, height: H, transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 1.4) }}>
      <div style={{ position: "absolute", inset: 0, transform: `skewX(${SLANT}deg)`, background: MCOLORS.orange, overflow: "hidden", boxShadow: "0 18px 60px rgba(255,84,32,0.35)" }}>
        {frame > at + 14 ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 120,
              left: interpolate(sheen, [0, 0.45], [W + 40, -160], clamp),
              background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)",
            }}
          />
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          direction: "rtl",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 92,
          lineHeight: 1,
          color: MCOLORS.black,
          paddingTop: 6,
        }}
      >
        سجّل الآن
      </div>
      {/* chevrons pointing in the reading direction (left) */}
      <svg width={150} height={H} style={{ position: "absolute", left: -168, top: 0, overflow: "visible" }}>
        {[0, 1, 2].map((i) => {
          const t = (((frame - at) / 16 + i / 3) % 1 + 1) % 1;
          const x = 130 - t * 90;
          return (
            <path
              key={i}
              d={`M${x + 22},${H / 2 - 30} L${x - 8},${H / 2} L${x + 22},${H / 2 + 30}`}
              fill="none"
              stroke={MCOLORS.orange}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={Math.sin(t * Math.PI) * prog(frame, at + 8, at + 16)}
            />
          );
        })}
      </svg>
    </div>
  );
};

/** Minimal outlined Instagram-style glyph. */
const InstaGlyph: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: "block" }}>
    <rect x={4} y={4} width={40} height={40} rx={12} fill="none" stroke={color} strokeWidth={4} />
    <circle cx={24} cy={24} r={9} fill="none" stroke={color} strokeWidth={4} />
    <circle cx={35} cy={13} r={2.6} fill={color} />
  </svg>
);

export const M5Cta: React.FC = () => {
  const frame = useCurrentFrame();

  // --- logo: lands centre-screen on "RESHAPE", then lifts to its end-card position
  const logoIn = prog(frame, T.brand - 2, T.brand + 14, easeOut);
  const wordReveal = prog(frame, T.brand + 4, T.brand + 20, easeInOut);
  const lift = prog(frame, T.ghayyir - 14, T.ghayyir + 2, easeInOut);
  const logoW = interpolate(lift, [0, 1], [880, LOGO_W]);
  const logoY = interpolate(lift, [0, 1], [860, LOGO_Y]);
  const logoH = (logoW * 91) / 389;

  // --- performance block before the end card
  const perfOut = prog(frame, LINES_OUT, LINES_OUT + 10, Easing.in(Easing.cubic));
  const heroIn = prog(frame, T.ghayyir - 4, T.ghayyir + 10);
  const heroPhase = (frame - T.ghayyir) / 26;
  const meter = prog(frame, T.wirfa - 2, T.mustawak + 14, easeInOut);

  // --- end card
  const card = (a: number, len = 12) => prog(frame, END_CARD + a, END_CARD + a + len, easeOut);
  const rowIn = card(20, 16);

  return (
    <AbsoluteFill>
      <Glow x={540} y={logoY} r={480} opacity={0.2 * logoIn} />

      {/* shockwave on the brand name */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <Ring x={540} y={860} at={T.brand} r0={60} r1={760} dur={22} width={8} />
        <Ring x={540} y={860} at={T.brand + 5} r0={40} r1={520} dur={20} width={3} color={MCOLORS.white} />
      </svg>

      {/* logo */}
      <div
        style={{
          position: "absolute",
          left: 540 - logoW / 2,
          top: logoY - logoH / 2,
          opacity: logoIn,
          transform: `scale(${0.82 + 0.18 * logoIn})`,
          filter: logoIn < 1 ? `blur(${(1 - logoIn) * 12}px)` : undefined,
        }}
      >
        <LogoLockup width={logoW} wordReveal={wordReveal} />
      </div>

      {/* --- "غيّر أداءك، وارفع مستواك" with an athlete and a rising level meter --- */}
      <AbsoluteFill style={{ opacity: 1 - perfOut, transform: `translateY(${-perfOut * 40}px)` }}>
        <div style={{ position: "absolute", left: 90, width: 900, top: 600 }}>
          <KineticWords
            fontSize={130}
            style="slam"
            words={[
              { text: "غيّر", at: T.ghayyir },
              { text: "أداءك", at: T.adaak },
            ]}
          />
        </div>
        <div style={{ position: "absolute", left: 90, width: 900, top: 770 }}>
          <KineticWords
            fontSize={130}
            style="slam"
            words={[
              { text: "وارفع", at: T.wirfa },
              { text: "مستواك", at: T.mustawak, color: MCOLORS.orange },
            ]}
          />
        </div>
        {heroIn > 0 ? (
          <svg width={1080} height={1920} style={{ position: "absolute" }}>
            <line x1={160} x2={920} y1={1540} y2={1540} stroke={MCOLORS.white} strokeWidth={4} opacity={0.35 * heroIn} />
            {/* level meter: slanted columns rising behind the athlete */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const k = Math.max(0, Math.min(1, meter * 6 - i));
              const h = (60 + i * 46) * k;
              const x0 = 830 - i * 74;
              const sk = Math.tan((14 * Math.PI) / 180);
              return (
                <path
                  key={i}
                  d={`M${x0},1540 L${x0 + 44},1540 L${x0 + 44 + sk * h},${1540 - h} L${x0 + sk * h},${1540 - h} Z`}
                  fill={i === 5 ? MCOLORS.orange : `rgba(255,84,32,${0.25 + i * 0.1})`}
                />
              );
            })}
            <g opacity={heroIn} style={{ clipPath: `inset(${(1 - heroIn) * 100}% 0 0 0)` }}>
              <Athlete pose={jumpSquat(heroPhase)} x={300} y={1540} scale={1.4} rim={6} trail={[jumpSquat(heroPhase - 0.05), jumpSquat(heroPhase - 0.1)]} />
            </g>
            {[0, 1, 2, 3].map((k) => (
              <Ring key={k} x={320} y={1540} at={Math.round(T.ghayyir + (k + 0.7) * 26)} r0={30} r1={210} dur={16} width={6} squash={0.22} />
            ))}
          </svg>
        ) : null}
      </AbsoluteFill>

      {/* --- END CARD --- */}
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        <DrawPath d="M840,568 L240,568" at={END_CARD} dur={14} width={4} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: 600,
          textAlign: "center",
          direction: "rtl",
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 84,
          lineHeight: 1.2,
          color: MCOLORS.white,
          opacity: card(4),
          transform: `translateY(${(1 - card(4)) * 30}px)`,
        }}
      >
        الحصص الجماعية <span style={{ color: MCOLORS.orange }}>بالنادي</span>
      </div>

      <CtaLabel at={Math.max(END_CARD + 8, T.sajjil - 2)} />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 990,
          textAlign: "center",
          fontFamily: FONTS.latin,
          fontWeight: 700,
          fontSize: 70,
          letterSpacing: "0.02em",
          color: MCOLORS.white,
          opacity: card(14),
          transform: `translateY(${(1 - card(14)) * 24}px)`,
        }}
      >
        {DISPLAY_URL}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1086,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          fontFamily: FONTS.latin,
          fontWeight: 600,
          fontSize: 52,
          color: MCOLORS.warm,
          opacity: card(18),
          transform: `translateY(${(1 - card(18)) * 24}px)`,
        }}
      >
        <InstaGlyph size={50} color={MCOLORS.warm} />
        <span>{INSTAGRAM}</span>
      </div>

      {/* the class keeps training under the end card */}
      {rowIn > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          <line x1={540 - 400 * rowIn} x2={540 + 400 * rowIn} y1={1450} y2={1450} stroke={MCOLORS.orange} strokeWidth={5} />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = card(22 + i * 3, 12);
            return (
              <g key={i} style={{ clipPath: `inset(${(1 - a) * 100}% 0 0 0)` }}>
                <Athlete pose={squat((frame - END_CARD) / 34)} x={210 + i * 160} y={1446} scale={0.62} color={i === 2 ? MCOLORS.white : "#C9CACD"} farColor="#55565B" />
              </g>
            );
          })}
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};
