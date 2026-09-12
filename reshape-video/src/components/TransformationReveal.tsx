import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE } from "../brand/tokens";

export type TransformationRevealProps = {
  /** Frozen BEFORE frame. */
  readonly from: React.ReactNode;
  /** Live AFTER footage. */
  readonly to: React.ReactNode;
  /** Frames the wipe takes to cross the frame. */
  readonly duration: number;
  readonly delay?: number;
};

/**
 * THE RISE — the signature RESHAPE transformation.
 *
 * A single hairline of #FF5420 lifts from the bottom of the frame to the top,
 * and the transformed athlete rises into existence behind it. It runs in the
 * same direction as the movement in the footage, which is why it reads as
 * progress rather than as a wipe.
 *
 * This is the one transition that should appear in every RESHAPE transformation
 * reel. Everything else in the edit can adapt to the footage; this shouldn't.
 */
export const TransformationReveal: React.FC<TransformationRevealProps> = ({
  from,
  to,
  duration,
  delay = 0,
}) => {
  const frame = useCurrentFrame() - delay;
  const { height } = useVideoConfig();

  // 0 -> 1 as the line travels bottom to top.
  const travel = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE.drive),
  });

  const lineY = height * (1 - travel);

  return (
    <AbsoluteFill name="The Rise">
      <AbsoluteFill
        style={{
          // The outgoing frame settles back very slightly as it is replaced.
          scale: String(interpolate(frame, [0, duration], [1.04, 1.0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.drive),
          })),
        }}
      >
        {from}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          // Revealed from the bottom edge upward, behind the travelling line.
          clipPath: `inset(${(1 - travel) * 100}% 0 0 0)`,
          scale: String(interpolate(frame, [0, duration], [1.06, 1.0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          })),
        }}
      >
        {to}
      </AbsoluteFill>

      {/* Light spilling off the leading edge. */}
      <AbsoluteFill
        style={{
          top: lineY - 190,
          height: 190,
          backgroundImage: `linear-gradient(to bottom, rgba(255,84,32,0) 0%, rgba(255,84,32,0.22) 100%)`,
          opacity: interpolate(frame, [0, 3, duration - 5, duration], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* The line itself. */}
      <AbsoluteFill
        style={{
          top: lineY,
          height: 5,
          backgroundColor: COLORS.orange,
          boxShadow: "0 0 60px 6px rgba(255,84,32,0.65)",
          opacity: interpolate(frame, [0, 2, duration - 4, duration], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
