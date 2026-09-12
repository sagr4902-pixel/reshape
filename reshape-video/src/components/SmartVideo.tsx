import { Video } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Freeze, staticFile, useVideoConfig } from "remotion";

export type Grade = "before" | "after" | "neutral";

/**
 * Colour grades. Both stay inside what a colourist would do to the same
 * footage on the same day — BEFORE is held back, AFTER is cleaned up. Neither
 * one alters the athlete, and BEFORE is never made to look bad.
 */
const GRADES: Record<Grade, string> = {
  before: "saturate(0.90) contrast(0.96) brightness(1.03)",
  after: "saturate(1.08) contrast(1.08) brightness(1.0)",
  neutral: "none",
};

export type SmartVideoProps = {
  readonly src: string;
  /** Seconds into the source clip. */
  readonly startAt: number;
  readonly playbackRate?: number;
  /** Hold a single frame instead of playing. */
  readonly freeze?: boolean;
  /** Point of interest, 0–1. Defaults to centre, slightly above middle. */
  readonly focalX?: number;
  readonly focalY?: number;
  /** 1 fills the frame; above 1 punches in. */
  readonly scale?: number;
  readonly grade?: Grade;
  readonly volume?: number;
  readonly style?: React.CSSProperties;
};

/**
 * Fits any source clip to the composition without ever letterboxing it.
 *
 * The crop is driven by `object-fit: cover` plus a focal point, so a 16:9
 * landscape clip and a 9:16 phone clip both end up filling a vertical frame
 * with the athlete kept in shot. `scale` punches in further when the athlete
 * sits small in the original.
 */
export const SmartVideo: React.FC<SmartVideoProps> = ({
  src,
  startAt,
  playbackRate = 1,
  freeze = false,
  focalX = 0.5,
  focalY = 0.45,
  scale = 1,
  grade = "neutral",
  volume = 0,
  style,
}) => {
  const { fps } = useVideoConfig();
  const trimBefore = Math.max(0, Math.round(startAt * fps));

  const video = (
    <Video
      name="Footage"
      src={staticFile(src)}
      trimBefore={trimBefore}
      playbackRate={freeze ? 1 : playbackRate}
      volume={() => (freeze ? 0 : volume)}
      objectFit="cover"
      style={{
        width: "100%",
        height: "100%",
        objectPosition: `${focalX * 100}% ${focalY * 100}%`,
        scale: String(scale),
      }}
    />
  );

  return (
    <AbsoluteFill
      name="Smart crop"
      style={{
        overflow: "hidden",
        backgroundColor: "#17181A",
        filter: GRADES[grade],
        ...style,
      }}
    >
      {freeze ? <Freeze frame={0}>{video}</Freeze> : video}
    </AbsoluteFill>
  );
};
