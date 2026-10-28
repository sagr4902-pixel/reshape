import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color, grid } from "../brand/tokens";

/**
 * The RESHAPE stage: the app's dark ink background, a static film grain
 * (the app's --grain token, scaled up for video) and an optional warm glow
 * borrowed from the app's "hot" glass cards.
 */
export const Stage: React.FC<{
  children?: React.ReactNode;
  glow?: { x: number; y: number; strength?: number } | null;
  showGrid?: boolean;
  tone?: "ink" | "deep";
  /** Slow push-in over the scene (scale gain at the scene's last frame). 0 disables. */
  push?: number;
}> = ({ children, glow = null, showGrid = false, tone = "ink", push = 0.03 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();
  const t = Math.min(1, frame / Math.max(1, durationInFrames));
  // Ambient life: the camera keeps easing in and the glow keeps drifting, so a
  // settled scene never sits frozen while the voice is still talking.
  const scale = 1 + push * t;
  const gx = glow ? glow.x + Math.sin(frame / 45) * 60 : 0;
  const gy = glow ? glow.y + Math.cos(frame / 60) * 40 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: tone === "ink" ? color.ink : color.deep, overflow: "hidden" }}>
      {glow ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(900px 900px at ${gx}px ${gy}px, rgba(255,110,60,${0.16 * (glow.strength ?? 1)}), rgba(255,84,32,0) 70%)`,
          }}
        />
      ) : null}
      {showGrid ? <GridLines /> : null}
      <AbsoluteFill style={{ scale: `${scale}`, transformOrigin: `${width / 2}px ${height * 0.45}px` }}>{children}</AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="rs-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" seed="7" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#rs-grain)" />
    </svg>
  </AbsoluteFill>
);

/** Six-column layout grid inside the safe area. Faint: a structural hint, not decoration. */
export const GridLines: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => {
  const inner = grid.width - grid.safe.left - grid.safe.right;
  const col = (inner - grid.gutter * (grid.columns - 1)) / grid.columns;
  const xs: number[] = [];
  for (let i = 0; i <= grid.columns; i++) {
    xs.push(grid.safe.left + i * (col + grid.gutter) - (i === grid.columns ? grid.gutter : 0));
  }
  return (
    <AbsoluteFill style={{ opacity }}>
      {xs.map((x) => (
        <div key={x} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: 1, background: color.bone }} />
      ))}
    </AbsoluteFill>
  );
};
