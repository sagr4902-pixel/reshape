import { evolvePath } from "@remotion/paths";
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONTS } from "../lib/brand";
import { MCOLORS, SLANT } from "./design";

// Reusable motion-graphics building blocks. Everything is a pure function of the frame.

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 over [a, b] with a premium ease-out. */
export const prog = (frame: number, a: number, b: number, ease = easeOut) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing: ease });

/** In/out envelope: rises over [a, a+inLen], falls over [b-outLen, b]. */
export const env = (frame: number, a: number, b: number, inLen = 10, outLen = 8) =>
  Math.min(prog(frame, a, a + inLen), 1 - prog(frame, b - outLen, b, Easing.in(Easing.cubic)));

// ------------------------------------------------------------------ background
/** Fine technical grid drifting diagonally, with a slow parallax second layer. */
export const Grid: React.FC<{ opacity?: number; size?: number; speed?: number }> = ({ opacity = 1, size = 90, speed = 0.35 }) => {
  const frame = useCurrentFrame();
  const o = (frame * speed) % size;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${MCOLORS.line} 1px, transparent 1px), linear-gradient(90deg, ${MCOLORS.line} 1px, transparent 1px)`,
          backgroundSize: `${size}px ${size}px`,
          backgroundPosition: `${-o}px ${o}px`,
          maskImage: "radial-gradient(ellipse 80% 65% at 50% 45%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 65% at 50% 45%, black 30%, transparent 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: `${size * 4}px ${size * 4}px`,
          backgroundPosition: `0px ${(frame * speed * 2.2) % (size * 4)}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Soft orange glow blob (depth / light). */
export const Glow: React.FC<{ x: number; y: number; r: number; opacity?: number; color?: string }> = ({ x, y, r, opacity = 0.35, color = MCOLORS.orange }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, rgba(255,84,32,0) 70%)`,
      opacity,
      filter: "blur(10px)",
      pointerEvents: "none",
    }}
  />
);

// ------------------------------------------------------------------ geometric elements
/** Brand slanted bar (parallelogram) that wipes in from one side and optionally out. */
export const SlantBar: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  inAt: number;
  outAt?: number;
  color?: string;
  from?: "left" | "right";
  dur?: number;
  opacity?: number;
}> = ({ x, y, w, h, inAt, outAt, color = MCOLORS.orange, from = "right", dur = 12, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, inAt, inAt + dur);
  const b = outAt === undefined ? 0 : prog(frame, outAt, outAt + dur, Easing.in(Easing.cubic));
  if (a <= 0 || b >= 1) return null;
  const clip = from === "right" ? `inset(0 0 0 ${(1 - a) * 100}%)` : `inset(0 ${(1 - a) * 100}% 0 0)`;
  const clipOut = from === "right" ? `inset(0 ${b * 100}% 0 0)` : `inset(0 0 0 ${b * 100}%)`;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: `skewX(${SLANT}deg)`, opacity }}>
      <div style={{ width: "100%", height: "100%", background: color, clipPath: b > 0 ? clipOut : clip }} />
    </div>
  );
};

/** SVG path drawn on progressively (stroke). */
export const DrawPath: React.FC<{
  d: string;
  at: number;
  dur?: number;
  stroke?: string;
  width?: number;
  out?: number;
  opacity?: number;
  cap?: "round" | "butt";
}> = ({ d, at, dur = 18, stroke = MCOLORS.orange, width = 6, out, opacity = 1, cap = "round" }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur, easeInOut);
  if (p <= 0) return null;
  const o = out === undefined ? 1 : 1 - prog(frame, out, out + 8);
  const ev = evolvePath(p, d);
  return (
    <path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap={cap}
      strokeLinejoin="round"
      strokeDasharray={ev.strokeDasharray}
      strokeDashoffset={ev.strokeDashoffset}
      opacity={opacity * o}
    />
  );
};

/** Expanding ring (shock / energy). */
export const Ring: React.FC<{ x: number; y: number; at: number; r0?: number; r1?: number; dur?: number; width?: number; color?: string; squash?: number }> = ({
  x,
  y,
  at,
  r0 = 20,
  r1 = 220,
  dur = 22,
  width = 5,
  color = MCOLORS.orange,
  squash = 1,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + dur);
  if (p <= 0 || p >= 1) return null;
  return <ellipse cx={x} cy={y} rx={r0 + (r1 - r0) * p} ry={(r0 + (r1 - r0) * p) * squash} fill="none" stroke={color} strokeWidth={width * (1 - p * 0.6)} opacity={1 - p} />;
};

/** Column of chevrons travelling upward (progress / ascent). */
export const Chevrons: React.FC<{ x: number; y: number; count?: number; gap?: number; size?: number; speed?: number; opacity?: number; color?: string }> = ({
  x,
  y,
  count = 5,
  gap = 46,
  size = 34,
  speed = 2.2,
  opacity = 1,
  color = MCOLORS.orange,
}) => {
  const frame = useCurrentFrame();
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const off = (frame * speed + i * gap) % (gap * count);
        const yy = y - off;
        const a = Math.sin((off / (gap * count)) * Math.PI);
        return (
          <path key={i} d={`M${x - size},${yy + size * 0.55} L${x},${yy - size * 0.2} L${x + size},${yy + size * 0.55}`} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={a} />
        );
      })}
    </g>
  );
};

/** Floating orange particles drifting upward (deterministic). */
export const Particles: React.FC<{ count?: number; seed?: string; opacity?: number; area?: [number, number, number, number] }> = ({
  count = 40,
  seed = "p",
  opacity = 0.7,
  area = [0, 0, 1080, 1920],
}) => {
  const frame = useCurrentFrame();
  const [ax, ay, aw, ah] = area;
  return (
    <g opacity={opacity}>
      {Array.from({ length: count }, (_, i) => {
        const x = ax + random(`${seed}x${i}`) * aw + Math.sin(frame / 40 + i) * 8;
        const sp = 0.6 + random(`${seed}s${i}`) * 1.8;
        const y = ay + ((random(`${seed}y${i}`) * ah - frame * sp) % ah + ah) % ah;
        const r = 2 + random(`${seed}r${i}`) * 4;
        return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? MCOLORS.white : MCOLORS.orange} opacity={0.35 + random(`${seed}o${i}`) * 0.5} />;
      })}
    </g>
  );
};

/** Perspective floor grid (2.5D stage for the athletes). */
export const PerspectiveFloor: React.FC<{ horizon: number; bottom?: number; opacity?: number; lines?: number; scroll?: number }> = ({
  horizon,
  bottom = 1920,
  opacity = 1,
  lines = 9,
  scroll = 0,
}) => {
  const vx = 540;
  const rows = 10;
  return (
    <g opacity={opacity}>
      {Array.from({ length: lines * 2 + 1 }, (_, i) => {
        const k = i - lines;
        return <line key={`v${i}`} x1={vx + k * 18} y1={horizon} x2={vx + k * 260} y2={bottom} stroke="rgba(255,255,255,0.10)" strokeWidth={2} />;
      })}
      {Array.from({ length: rows }, (_, i) => {
        const t = ((i + scroll) % rows) / rows;
        const y = horizon + (bottom - horizon) * t * t;
        return <line key={`h${i}`} x1={0} x2={1080} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />;
      })}
      <line x1={0} x2={1080} y1={horizon} y2={horizon} stroke={MCOLORS.orange} strokeWidth={3} opacity={0.6} />
    </g>
  );
};

/** Horizontal progress bar that fills RIGHT→LEFT (reading direction), with tick marks. */
export const ProgressBar: React.FC<{ x: number; y: number; w: number; value: number; ticks?: number; h?: number }> = ({ x, y, w, value, ticks = 5, h = 14 }) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={h / 2} fill="rgba(255,255,255,0.12)" />
    <rect x={x + w * (1 - value)} y={y} width={w * value} height={h} rx={h / 2} fill={MCOLORS.orange} />
    {Array.from({ length: ticks + 1 }, (_, i) => (
      <rect key={i} x={x + (w * i) / ticks - 1.5} y={y + h + 12} width={3} height={18} fill={i / ticks >= 1 - value ? MCOLORS.orange : "rgba(255,255,255,0.25)"} />
    ))}
  </g>
);

// ------------------------------------------------------------------ typography
/**
 * Headline word with layered depth: two outlined echoes behind the solid word that settle
 * into place (2.5D parallax), plus a slanted mask reveal from below.
 */
export const LayeredWord: React.FC<{
  text: string;
  at: number;
  size: number;
  color?: string;
  echo?: string;
  out?: number;
  weight?: number;
  font?: string;
}> = ({ text, at, size, color = MCOLORS.white, echo = MCOLORS.orange, out, weight = 900, font = FONTS.display }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 170, mass: 0.8 } });
  const o = out === undefined ? 1 : 1 - prog(frame, out, out + 8, Easing.in(Easing.cubic));
  if (frame < at || o <= 0) return null;
  const base: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    direction: "rtl",
    fontFamily: font,
    fontWeight: weight,
    fontSize: size,
    lineHeight: 1.15,
    whiteSpace: "nowrap",
  };
  const echoOff = (1 - s) * 60 + 10;
  return (
    <div style={{ position: "relative", height: size * 1.25, opacity: o, transform: `translateY(${(1 - o) * -30}px)` }}>
      {[2, 1].map((k) => (
        <div
          key={k}
          style={{
            ...base,
            color: "transparent",
            WebkitTextStroke: `2px ${echo}`,
            opacity: (0.5 / k) * s,
            transform: `translate(${-echoOff * k * 0.6}px, ${echoOff * k * 0.45}px)`,
          }}
        >
          {text}
        </div>
      ))}
      <div style={{ ...base, overflow: "hidden", padding: `${size * 0.1}px 0`, top: -size * 0.1 }}>
        <div style={{ color, transform: `translateY(${(1 - s) * 105}%) skewY(${(1 - s) * 6}deg)`, textShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>{text}</div>
      </div>
    </div>
  );
};

/** Full-height slanted orange wipe that covers a cut (centre at `at`). Sweeps right → left. */
export const SlantWipe: React.FC<{ at: number; dur?: number }> = ({ at, dur = 14 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at - dur / 2, at + dur / 2], [0, 1], { ...clamp, easing: easeInOut });
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [1500, -1400]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: -200, height: 2320, left: x, width: 900, background: MCOLORS.orange, transform: `skewX(${SLANT}deg)` }} />
      <div style={{ position: "absolute", top: -200, height: 2320, left: x + 900, width: 520, background: MCOLORS.black, transform: `skewX(${SLANT}deg)` }} />
      <div style={{ position: "absolute", top: -200, height: 2320, left: x - 70, width: 40, background: MCOLORS.white, transform: `skewX(${SLANT}deg)`, opacity: 0.9 }} />
    </AbsoluteFill>
  );
};

/** Small all-caps Latin label (section marker). */
export const Label: React.FC<{ text: string; at: number; x: number; y: number; align?: "left" | "right" | "center" }> = ({ text, at, x, y, align = "center" }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 14);
  if (p <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - 400 : x,
        width: align === "center" ? 800 : undefined,
        top: y,
        textAlign: align,
        fontFamily: FONTS.latin,
        fontWeight: 700,
        fontStyle: "italic",
        fontSize: 30,
        letterSpacing: "0.32em",
        color: MCOLORS.mute,
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
      }}
    >
      {text}
    </div>
  );
};
