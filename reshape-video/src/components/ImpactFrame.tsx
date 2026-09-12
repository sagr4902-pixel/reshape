import React from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE } from "../brand/tokens";

export type ImpactFrameProps = {
  readonly children: React.ReactNode;
  /** Frames the whole hit lasts. Keep it under ~0.5s. */
  readonly duration: number;
  readonly delay?: number;
  /** Punch-in amount. 0.04 = 4%. */
  readonly punch?: number;
  readonly shake?: number;
};

/**
 * The hit on a strong pose: a short punch zoom, a one-frame dim, a hairline
 * burst either side of the athlete, and a camera knock that decays almost
 * immediately.
 *
 * Restraint is the whole point — the effect is over before the viewer can name
 * it, and the pose is what they remember.
 */
export const ImpactFrame: React.FC<ImpactFrameProps> = ({
  children,
  duration,
  delay = 0,
  punch = 0.045,
  shake = 8,
}) => {
  const frame = useCurrentFrame() - delay;
  const { fps, width } = useVideoConfig();

  // Snap in, then ride the zoom out slowly so the frame keeps breathing.
  const zoom = interpolate(frame, [0, 0.12 * fps, duration], [1, 1 + punch, 1 + punch * 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE.impact),
  });

  const knock = interpolate(frame, [0, 0.3 * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE.out),
  });

  const burst = interpolate(frame, [0, 0.22 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE.out),
  });

  return (
    <AbsoluteFill
      name="Impact"
      style={{
        overflow: "hidden",
        scale: String(zoom),
        translate: `${(random(`kx${Math.floor(frame)}`) - 0.5) * shake * knock}px ${
          (random(`ky${Math.floor(frame)}`) - 0.5) * shake * knock
        }px`,
      }}
    >
      {children}

      {/* One-frame dip, so the pose reads as a photograph for an instant. */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.ink,
          opacity: interpolate(frame, [0, 2, 0.22 * fps], [0, 0.34, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Hairlines driving out from the centre of the pose. */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: "44%",
            height: 3,
            backgroundColor: COLORS.orange,
            width: burst * width * 0.92,
            opacity: interpolate(frame, [0, 0.1 * fps, 0.42 * fps], [0.95, 0.8, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
