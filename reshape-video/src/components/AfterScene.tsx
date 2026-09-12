import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { EASE } from "../brand/tokens";
import { BrandLabel } from "./BrandLabel";
import { FilmTexture } from "./FilmTexture";
import { SmartVideo } from "./SmartVideo";
import type { Shot } from "../config/transformationData";

export type AfterSceneProps = {
  readonly src: string;
  readonly shot: Shot;
  readonly label: string;
  readonly rtl?: boolean;
  readonly durationInFrames: number;
  readonly ambienceVolume?: number;
  /** The label is suppressed on the closing beat, where it has already landed. */
  readonly showLabel?: boolean;
};

/**
 * The AFTER hero move.
 *
 * Cleaner grade, less grain, a lighter vignette and a push that eases *out*
 * rather than in — the frame opens up as the athlete rises, instead of closing
 * in on him.
 */
export const AfterScene: React.FC<AfterSceneProps> = ({
  src,
  shot,
  label,
  rtl = false,
  durationInFrames,
  ambienceVolume = 0,
  showLabel = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const base = shot.scale ?? 1.1;

  return (
    <AbsoluteFill name="AFTER">
      <SmartVideo
        src={src}
        startAt={shot.start}
        playbackRate={shot.playbackRate ?? 1}
        grade="after"
        focalX={shot.focalX}
        focalY={shot.focalY}
        volume={ambienceVolume}
        scale={interpolate(frame, [0, durationInFrames], [base + 0.07, base], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(...EASE.out),
        })}
      />

      <FilmTexture grain={0.07} vignette={0.34} />

      {showLabel ? (
        <BrandLabel text={label} rtl={rtl} align="top" delay={Math.round(0.1 * fps)} />
      ) : null}
    </AbsoluteFill>
  );
};
