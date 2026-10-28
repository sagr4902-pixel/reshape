import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { COLORS } from "../lib/brand";

/** Fine animated film grain (new seed every frame), kept subtle so text stays crisp. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${frame}`) * 1000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
    }}
  />
);

/** Short exposure flash on a hit; `at` is a frame relative to the parent sequence. */
export const Flash: React.FC<{ at: number; color?: string; peak?: number; length?: number }> = ({
  at,
  color = COLORS.white,
  peak = 0.85,
  length = 7,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + length], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Warm anamorphic light leak drifting across frame (pure CSS, deterministic). */
export const LightLeak: React.FC<{ from: number; to: number; intensity?: number; y?: number }> = ({
  from,
  to,
  intensity = 0.55,
  y = 40,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const o = Math.sin(p * Math.PI) * intensity;
  if (o <= 0.001) return null;
  const x = interpolate(p, [0, 1], [-30, 130]);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: o, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 18% at ${x}% ${y}%, rgba(255,120,60,0.9), rgba(255,84,32,0.35) 40%, rgba(0,0,0,0) 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,0) ${x - 25}%, rgba(255,170,120,0.35) ${x}%, rgba(0,0,0,0) ${x + 25}%)`,
          height: 6,
          top: `${y}%`,
          filter: "blur(4px)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Hand-held style camera shake that decays after a hit (deterministic). */
export const useShake = (at: number, amount = 26, decay = 10) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > decay * 3) return { x: 0, y: 0, r: 0 };
  const k = Math.exp(-t / decay);
  return {
    x: (random(`sx${t}`) - 0.5) * amount * k,
    y: (random(`sy${t}`) - 0.5) * amount * k,
    r: (random(`sr${t}`) - 0.5) * 0.8 * k,
  };
};
