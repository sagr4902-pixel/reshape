import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE } from "../brand/tokens";
import { BrandLabel } from "./BrandLabel";
import { FilmTexture } from "./FilmTexture";
import { SmartVideo } from "./SmartVideo";
import type { Shot } from "../config/transformationData";

export type BeforeSceneProps = {
  readonly src: string;
  readonly shot: Shot;
  readonly label: string;
  readonly rtl?: boolean;
  readonly durationInFrames: number;
  readonly ambienceVolume?: number;
};

/**
 * The BEFORE working set.
 *
 * Held back rather than made ugly: slightly restrained saturation, a touch
 * more grain, a fractionally slower playback rate, and a very slow push in.
 * Nothing here is designed to make the athlete look worse — the contrast comes
 * from what happens on the bar, not from the grade.
 */
export const BeforeScene: React.FC<BeforeSceneProps> = ({
  src,
  shot,
  label,
  rtl = false,
  durationInFrames,
  ambienceVolume = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = shot.scale ?? 1.1;

  return (
    <AbsoluteFill name="BEFORE">
      <SmartVideo
        src={src}
        startAt={shot.start}
        playbackRate={shot.playbackRate ?? 0.95}
        grade="before"
        focalX={shot.focalX}
        focalY={shot.focalY}
        volume={ambienceVolume}
        // Slow push in across the whole scene — pressure building, not a zoom.
        scale={interpolate(frame, [0, durationInFrames], [base, base + 0.09], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(...EASE.out),
        })}
      />

      <FilmTexture grain={0.13} vignette={0.43} />

      {/* Hold the cut from the hook for a few frames. */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.ink,
          opacity: interpolate(frame, [0, 0.3 * fps], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      />

      <BrandLabel text={label} rtl={rtl} align="top" delay={Math.round(0.35 * fps)} />
    </AbsoluteFill>
  );
};
