import React from "react";
import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE } from "../brand/tokens";
import { FilmTexture } from "./FilmTexture";
import { SmartVideo } from "./SmartVideo";
import type { Framing } from "../config/transformationData";

export type HookFlashProps = {
  readonly src: string;
  /** Seconds into the AFTER clip. Two to four frames work best. */
  readonly flashes: number[];
  readonly framing?: Framing;
  readonly durationInFrames: number;
};

/**
 * The first second: the pay-off, before it has been earned.
 *
 * A handful of frozen frames from the AFTER clip, each held for a few frames,
 * punched in hard and separated by ink. No logo, no words — just enough of the
 * finish to make the scroll stop, then straight into the BEFORE.
 */
export const HookFlash: React.FC<HookFlashProps> = ({
  src,
  flashes,
  framing,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Each flash gets a slot, separated by two frames of ink — enough to read
  // as a hard cut, short enough that the hook never feels like dead air.
  const slot = Math.floor(durationInFrames / Math.max(1, flashes.length));
  const hold = Math.max(4, slot - 2);

  return (
    <AbsoluteFill name="Hook" style={{ backgroundColor: COLORS.ink }}>
      {flashes.map((at, i) => (
        <Sequence key={`${at}-${i}`} from={i * slot} durationInFrames={hold} name={`Flash ${i + 1}`}>
          <SmartVideo
            src={src}
            startAt={at}
            freeze
            grade="after"
            focalX={framing?.focalX ?? 0.5}
            // Ride up the body as the flashes tighten, finishing on the torso.
            focalY={(framing?.focalY ?? 0.42) - i * 0.04}
            // Each flash closes in harder than the last, so cutting to the wide
            // BEFORE lands as a release rather than another cut.
            scale={(framing?.scale ?? 1.15) + 0.2 + i * 0.34}
          />
          <FilmTexture grain={0.1} vignette={0.52} />
        </Sequence>
      ))}

      {/* Single hairline sweep tying the flashes together. */}
      <AbsoluteFill style={{ justifyContent: "center" }}>
        <div
          style={{
            height: 4,
            backgroundColor: COLORS.orange,
            width: `${interpolate(frame, [0.25 * fps, durationInFrames], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EASE.drive),
            })}%`,
            opacity: interpolate(frame, [0.25 * fps, 0.4 * fps, durationInFrames - 3, durationInFrames], [0, 0.9, 0.9, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        />
      </AbsoluteFill>

      {/* Cut to black on the last frames, so the BEFORE lands out of darkness. */}
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.ink,
          opacity: interpolate(frame, [durationInFrames - 5, durationInFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};
