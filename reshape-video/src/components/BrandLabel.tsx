import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, FONTS, SAFE } from "../brand/tokens";

export type BrandLabelProps = {
  readonly text: string;
  readonly rtl?: boolean;
  /** Vertical placement inside the safe area. */
  readonly align?: "top" | "bottom";
  /** Frame the label starts drawing on, relative to its sequence. */
  readonly delay?: number;
};

/**
 * The BEFORE / AFTER marker.
 *
 * Built from the technical "/ LABEL" idiom in the RESHAPE guidelines: an
 * orange slash, letterspaced display type, and a hairline rule that drives out
 * underneath it. It is deliberately small — the athlete is the hero, the label
 * is just a caption on the frame.
 *
 * This component is the main thing holding the campaign together, so it should
 * be the last thing anyone changes.
 */
export const BrandLabel: React.FC<BrandLabelProps> = ({
  text,
  rtl = false,
  align = "top",
  delay = 0,
}) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      name="Brand label"
      style={{
        direction: rtl ? "rtl" : "ltr",
        display: "flex",
        flexDirection: "column",
        justifyContent: align === "top" ? "flex-start" : "flex-end",
        alignItems: "flex-start",
        paddingTop: SAFE.top,
        paddingBottom: SAFE.bottom,
        paddingLeft: SAFE.left,
        paddingRight: SAFE.right,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 22,
          // Wipe the whole lockup on from the leading edge.
          clipPath: `inset(0 ${interpolate(frame, [0, 0.5 * fps], [100, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.drive),
          })}% 0 0)`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: 58,
            lineHeight: 1,
            color: COLORS.orange,
          }}
        >
          /
        </span>
        <span
          style={{
            fontFamily: rtl ? FONTS.technical : FONTS.display,
            fontWeight: rtl ? 600 : 900,
            fontSize: rtl ? 62 : 72,
            lineHeight: 1,
            letterSpacing: rtl ? 0 : 14,
            color: COLORS.softBeige,
          }}
        >
          {text}
        </span>
      </div>
      <div
        style={{
          marginTop: 20,
          height: 3,
          backgroundColor: COLORS.orange,
          width: interpolate(frame, [0.22 * fps, 0.85 * fps], [0, 190], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(...EASE.out),
          }),
        }}
      />
    </AbsoluteFill>
  );
};
