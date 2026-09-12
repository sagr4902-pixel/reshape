import React from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, EASE, FONTS } from "../brand/tokens";
import type { Language } from "../config/transformationData";
import { COPY } from "../brand/tokens";

export type EndCardProps = {
  readonly language: Language;
};

/**
 * The closing card. Identical in every RESHAPE transformation reel — this is
 * the frame people learn to recognise, so it never adapts to the footage.
 *
 * The official primary logo is placed as supplied: same artwork, same colour,
 * same proportions, scaled uniformly and never recoloured or stretched.
 */
export const EndCard: React.FC<EndCardProps> = ({ language }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const copy = COPY[language];
  const rtl = copy.dir === "rtl";

  return (
    <AbsoluteFill
      name="End card"
      style={{
        backgroundColor: COLORS.charcoal,
        direction: copy.dir,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 110,
      }}
    >
      {/* A single soft ember behind the logo, nothing more. */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 44%, rgba(255,84,32,0.16), rgba(47,48,52,0) 58%)",
          opacity: interpolate(frame, [0, 1.2 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      />

      <CanvasImage
        name="RESHAPE logo"
        src={staticFile("brand/reshape-primary.png")}
        style={{
          width: 560,
          height: 187,
          objectFit: "contain",
          opacity: interpolate(frame, [0, 0.75 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
          scale: interpolate(frame, [0, 1.5 * fps], [0.94, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
            output: "perceptual-scale",
          }),
        }}
      />

      {/* Hairline reveal under the logo. */}
      <div
        style={{
          marginTop: 54,
          height: 3,
          backgroundColor: COLORS.orange,
          width: interpolate(frame, [0.5 * fps, 1.35 * fps], [0, 360], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.drive),
          }),
        }}
      />

      <Interactive.Div
        name="Brand line"
        style={{
          marginTop: 54,
          fontFamily: FONTS.display,
          fontWeight: 900,
          fontSize: 68,
          letterSpacing: 3,
          textAlign: "center",
          color: COLORS.softBeige,
          opacity: interpolate(frame, [0.85 * fps, 1.6 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
          translate: interpolate(frame, [0.85 * fps, 1.8 * fps], ["0px 18px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      >
        RE-SHAPE YOUR BODY
      </Interactive.Div>

      <div
        style={{
          marginTop: 26,
          fontFamily: FONTS.technical,
          fontWeight: 400,
          fontSize: rtl ? 46 : 38,
          letterSpacing: rtl ? 0 : 7,
          textAlign: "center",
          color: COLORS.warmBeige,
          opacity: interpolate(frame, [1.1 * fps, 1.85 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      >
        {copy.subLine}
      </div>

      <div
        style={{
          marginTop: 78,
          fontFamily: FONTS.technical,
          fontWeight: 600,
          fontSize: rtl ? 44 : 36,
          letterSpacing: rtl ? 0 : 5,
          textAlign: "center",
          color: COLORS.orange,
          opacity: interpolate(frame, [1.45 * fps, 2.15 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      >
        {copy.cta}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 250,
          fontFamily: FONTS.technical,
          fontWeight: 400,
          fontSize: 34,
          letterSpacing: 4,
          direction: "ltr",
          color: COLORS.warmBeige,
          opacity: interpolate(frame, [1.7 * fps, 2.4 * fps], [0, 0.86], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      >
        {copy.site}
      </div>
    </AbsoluteFill>
  );
};
