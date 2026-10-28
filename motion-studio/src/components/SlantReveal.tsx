import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { color, ease } from "../brand/tokens";
import { lerp, SLANT_TAN } from "../lib/motion";

/**
 * The RESHAPE scene transition. The incoming scene is uncovered by an edge
 * that leans at the logo's slant and travels in Arabic reading direction
 * (right → left): a sand hairline leads, a signal-red band follows, and the
 * new scene is behind it. Wrap the *incoming* scene; the outgoing scene keeps
 * rendering underneath for `length` frames.
 */
export const SlantReveal: React.FC<{ length: number; children: React.ReactNode; enabled?: boolean }> = ({
  length,
  children,
  enabled = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (!enabled || frame >= length) return <AbsoluteFill>{children}</AbsoluteFill>;

  const lean = (height * SLANT_TAN) / 2;
  const hair = 10;
  const band = 150;
  const far = width + lean * 2 + band + hair;

  // x = left edge of the hairline at mid-height
  const x = lerp(frame, [0, length], [width + lean, -(hair + band + lean)], ease.inOut);

  /** A parallelogram covering [a, b] at mid-height, leaning like the wordmark. */
  const slab = (a: number, b: number) =>
    `polygon(${a + lean}px 0px, ${b + lean}px 0px, ${b - lean}px ${height}px, ${a - lean}px ${height}px)`;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: slab(x + hair + band, far) }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: color.signalRed, clipPath: slab(x + hair, x + hair + band) }} />
      <AbsoluteFill style={{ background: color.sand, clipPath: slab(x, x + hair) }} />
    </AbsoluteFill>
  );
};
