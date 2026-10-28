import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { KineticWords } from "../../components/KineticWords";
import { useShake } from "../../components/Finish";
import { LogoLockup } from "../../components/Logo";
import { LOGO_BOX, MARK_BOX, MARK_PATH, WORD_PATH } from "../../components/logoPaths";
import { COLORS, DISPLAY_URL, FONTS, INSTAGRAM } from "../../lib/brand";
import { END_CARD, FINAL_HIT, T } from "./timing";

// END CARD (29.5 s -> 35.0 s). Brand black, thin orange diagonals at the angle of the mark's
// top stroke, a slow-breathing orange glow and a few soft bokeh motes. The copy builds on the
// VO, gets one pulse + logo glint on the final hit, then holds perfectly still to be read.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------------------------------------------------------- layout (px, 1080x1920)
const LOGO_W = 760;
const LOGO_H = (LOGO_W * LOGO_BOX.h) / LOGO_BOX.w;
const LOGO_TOP = 540 - LOGO_H / 2;
const LOGO_LEFT = (1080 - LOGO_W) / 2;
const MARK_W = (LOGO_W * MARK_BOX.w) / LOGO_BOX.w;
/** how far the lockup sits right of centre while only the mark is visible */
const MARK_CENTRE_SHIFT = 540 - (LOGO_LEFT + MARK_W / 2);

const CLASS_Y = 760;
const BTN_Y = 980;
const URL_Y = 1170;
const HANDLE_Y = 1250;

// timing (scene-relative frames)
const MARK_IN = END_CARD;
const WORD_IN: [number, number] = [END_CARD + 6, END_CARD + 22];
const CLASS_IN = END_CARD + 18;
const URL_IN = END_CARD + 32;
const HANDLE_IN = END_CARD + 38;
const STILL_FROM = FINAL_HIT + 10;

// ---------------------------------------------------------------- background
// Direction of the mark's top stroke (from logoPaths: 46.75,30.6 -> 11.25,64.25).
const ANG = Math.atan2(64.25 - 30.625, 11.25 - 46.75);
const DIR = [Math.cos(ANG), Math.sin(ANG)] as const;
const NRM = [-DIR[1], DIR[0]] as const;

type Diag = { cx: number; cy: number; len: number; off: number; o: number; w: number; delay: number };
const DIAGS: Diag[] = [
  // top-left corner, above the logo
  { cx: 205, cy: 200, len: 620, off: 0, o: 0.75, w: 3, delay: 0 },
  { cx: 205, cy: 200, len: 470, off: 46, o: 0.45, w: 2, delay: 3 },
  { cx: 205, cy: 200, len: 330, off: 92, o: 0.25, w: 2, delay: 6 },
  // bottom-right corner, below the handle
  { cx: 900, cy: 1690, len: 640, off: 0, o: 0.7, w: 3, delay: 2 },
  { cx: 900, cy: 1690, len: 480, off: -46, o: 0.42, w: 2, delay: 5 },
  { cx: 900, cy: 1690, len: 340, off: -92, o: 0.24, w: 2, delay: 8 },
];

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const id = useId().replace(/:/g, "");
  const t = frame - END_CARD;
  const breath = 0.5 + 0.5 * Math.sin((t / 150) * Math.PI * 2 - Math.PI / 2);
  const glow = 0.11 + 0.035 * breath + interpolate(frame, [FINAL_HIT, FINAL_HIT + 3, FINAL_HIT + 24], [0, 0.05, 0], clamp);
  const drift = t * 0.12; // px along the line direction - barely perceptible
  return (
    <AbsoluteFill style={{ background: COLORS.black }}>
      {/* soft depth: lifted centre, darker edges */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 60% at 50% 48%, #1f2023 0%, #17181a 55%, #111214 100%)" }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 34% at 50% 47%, rgba(255,84,32,${glow}) 0%, rgba(255,84,32,${glow * 0.35}) 45%, rgba(255,84,32,0) 100%)`,
        }}
      />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id={`dg-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={COLORS.orange} stopOpacity="0" />
            <stop offset="0.35" stopColor={COLORS.orange} stopOpacity="1" />
            <stop offset="0.7" stopColor={COLORS.orange} stopOpacity="1" />
            <stop offset="1" stopColor={COLORS.orange} stopOpacity="0" />
          </linearGradient>
        </defs>
        {DIAGS.map((d, i) => {
          const draw = interpolate(frame, [END_CARD + 2 + d.delay, END_CARD + 22 + d.delay], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const cx = d.cx + NRM[0] * d.off + DIR[0] * (drift - 20 * (1 - draw));
          const cy = d.cy + NRM[1] * d.off + DIR[1] * (drift - 20 * (1 - draw));
          return (
            <g key={i} transform={`translate(${cx} ${cy}) rotate(${(ANG * 180) / Math.PI})`} opacity={d.o * draw}>
              <rect x={-d.len / 2} y={-d.w / 2} width={d.len * draw} height={d.w} fill={`url(#dg-${id})`} />
            </g>
          );
        })}
      </svg>
      <Bokeh />
    </AbsoluteFill>
  );
};

/** A dozen big, soft, out-of-focus motes drifting very slowly (not pin-point "stars"). */
const Bokeh: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame - END_CARD;
  const fade = interpolate(t, [0, 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: 14 }, (_, i) => {
        const x0 = 60 + random(`bk-x-${i}`) * 960;
        const y0 = 260 + random(`bk-y-${i}`) * 1500;
        const size = 26 + random(`bk-s-${i}`) * 40;
        const a = 0.06 + random(`bk-a-${i}`) * 0.12;
        const x = x0 + Math.sin(t / 70 + i) * 6;
        const y = y0 - t * (0.12 + random(`bk-v-${i}`) * 0.18);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(255,150,100,${a * fade}) 0%, rgba(255,110,60,${a * 0.5 * fade}) 45%, rgba(255,84,32,0) 72%)`,
              filter: "blur(7px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- logo + glint
const LogoGlint: React.FC<{ p: number }> = ({ p }) => {
  const id = useId().replace(/:/g, "");
  if (p <= 0 || p >= 1) return null;
  const x = LOGO_BOX.x - 70 + (LOGO_BOX.w + 140) * p;
  const o = Math.sin(p * Math.PI);
  return (
    <svg
      viewBox={`${LOGO_BOX.x} ${LOGO_BOX.y} ${LOGO_BOX.w} ${LOGO_BOX.h}`}
      style={{ position: "absolute", left: 0, top: 0, width: LOGO_W, height: LOGO_H, overflow: "visible" }}
    >
      <defs>
        <clipPath id={`lg-${id}`}>
          <path d={MARK_PATH} />
          <path d={WORD_PATH} />
        </clipPath>
        <linearGradient id={`gl-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6ee" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#lg-${id})`} opacity={o}>
        <rect x={x - 22} y={LOGO_BOX.y - 40} width={44} height={LOGO_BOX.h + 80} fill={`url(#gl-${id})`} transform={`skewX(-22)`} style={{ transformOrigin: `${x}px ${LOGO_BOX.y + LOGO_BOX.h / 2}px` }} />
      </g>
    </svg>
  );
};

const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - MARK_IN, fps, config: { damping: 14, stiffness: 210, mass: 0.7 }, durationInFrames: 14 });
  const reveal = interpolate(frame, WORD_IN, [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const shake = useShake(MARK_IN, 14, 3);
  const scale = interpolate(s, [0, 1], [1.4, 1]);
  const blur = interpolate(s, [0, 1], [14, 0], clamp);
  const glint = interpolate(frame, [FINAL_HIT, STILL_FROM], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  // keep the scaling centred on the mark while only the mark is showing
  const origin = `${LOGO_W / 2 - MARK_CENTRE_SHIFT}px 50%`;
  return (
    <div
      style={{
        position: "absolute",
        left: LOGO_LEFT,
        top: LOGO_TOP,
        width: LOGO_W,
        height: LOGO_H,
        transform: `translate(${MARK_CENTRE_SHIFT * (1 - reveal) + shake.x}px, ${shake.y}px) scale(${scale})`,
        transformOrigin: origin,
        opacity: Math.min(1, s * 2.5),
        filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
      }}
    >
      <LogoLockup width={LOGO_W} wordReveal={reveal} />
      <LogoGlint p={glint} />
    </div>
  );
};

// ---------------------------------------------------------------- CTA label
// A flat, slanted brand bar (angle borrowed from the mark), deliberately NOT a button:
// no shadow, bevel, sheen or pulse, so nothing in the MP4 pretends to be tappable.
const CtaLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // starts 3 frames early so it has landed as the VO says "سجّل"
  const at = T.sajjil - 3;
  const s = spring({ frame: frame - at, fps, config: { damping: 200, stiffness: 170 }, durationInFrames: 16 });
  if (frame < at) return null;
  const wipe = interpolate(s, [0, 1], [0, 100]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: BTN_Y - 80,
        height: 160,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 150,
          padding: "0 84px",
          background: COLORS.orange,
          transform: "skewX(-12deg)",
          clipPath: `inset(0 0 0 ${100 - wipe}%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            direction: "rtl",
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1,
            color: COLORS.black,
            whiteSpace: "nowrap",
            transform: `skewX(12deg) translateY(4px) translateX(${(1 - s) * 30}px)`,
            opacity: Math.min(1, s * 1.6),
          }}
        >
          سجّل الآن
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- latin lines
const Line: React.FC<{ y: number; at: number; size: number; weight: number; color: string; children: React.ReactNode; spacing?: number }> = ({
  y,
  at,
  size,
  weight,
  color,
  children,
  spacing = 0.02,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200, stiffness: 150 }, durationInFrames: 16 });
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 115,
        width: 850,
        top: y - size * 0.62,
        textAlign: "center",
        direction: "ltr",
        fontFamily: FONTS.latin,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.24,
        letterSpacing: `${spacing}em`,
        color,
        opacity: p,
        transform: `translateY(${(1 - p) * 26}px)`,
        filter: p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined,
      }}
    >
      {children}
    </div>
  );
};

export const EndCard: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Logo />
    <div style={{ position: "absolute", left: 115, width: 850, top: CLASS_Y - 55 }}>
      <KineticWords
        fontSize={72}
        weight={800}
        style="rise"
        gap={0.18}
        words={[
          { text: "الحصص", at: CLASS_IN },
          { text: "الجماعية", at: CLASS_IN + 3 },
          { text: "بالنادي", at: CLASS_IN + 6 },
        ]}
      />
    </div>
    <CtaLabel />
    <Line y={URL_Y} at={URL_IN} size={66} weight={700} color={COLORS.white}>
      {DISPLAY_URL}
    </Line>
    <Line y={HANDLE_Y} at={HANDLE_IN} size={52} weight={600} color={COLORS.warm} spacing={0.03}>
      {INSTAGRAM}
    </Line>
  </AbsoluteFill>
);
