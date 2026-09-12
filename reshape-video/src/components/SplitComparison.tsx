import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EASE, FONTS, SAFE } from "../brand/tokens";
import { SmartVideo } from "./SmartVideo";
import type { Framing } from "../config/transformationData";

export type SplitComparisonProps = {
  readonly beforeSrc: string;
  readonly afterSrc: string;
  readonly beforeAt: number;
  readonly afterAt: number;
  readonly beforeFraming?: Framing;
  readonly afterFraming?: Framing;
  readonly beforeLabel: string;
  readonly afterLabel: string;
  readonly rtl?: boolean;
};

/**
 * The one moment both frames share the screen.
 *
 * Two frozen stills, split by a single #FF5420 hairline that drives down the
 * middle. In Arabic the panels swap sides so BEFORE still reads first.
 *
 * A half-width panel is already a centre crop of the frame, so each side is
 * pulled back rather than punched in — enough of the rig stays in shot for the
 * difference to read instantly. No text beyond the two labels.
 */
export const SplitComparison: React.FC<SplitComparisonProps> = ({
  beforeSrc,
  afterSrc,
  beforeAt,
  afterAt,
  beforeFraming,
  afterFraming,
  beforeLabel,
  afterLabel,
  rtl = false,
}) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const panels = [
    {
      key: "before",
      src: beforeSrc,
      at: beforeAt,
      framing: beforeFraming,
      grade: "before" as const,
      label: beforeLabel,
    },
    {
      key: "after",
      src: afterSrc,
      at: afterAt,
      framing: afterFraming,
      grade: "after" as const,
      label: afterLabel,
    },
  ];

  // Arabic reads right to left, so BEFORE takes the right-hand panel.
  const ordered = rtl ? [...panels].reverse() : panels;

  // The divider drives down, then the panels settle apart from the centre.
  const split = interpolate(frame, [0, 0.55 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(...EASE.out),
  });

  return (
    <AbsoluteFill name="Split comparison" style={{ backgroundColor: COLORS.ink }}>
      <AbsoluteFill style={{ flexDirection: "row" }}>
        {ordered.map((panel, i) => (
          <div
            key={panel.key}
            style={{
              position: "relative",
              width: width / 2,
              height: "100%",
              overflow: "hidden",
              translate: `${(i === 0 ? -1 : 1) * (1 - split) * 70}px 0px`,
            }}
          >
            <SmartVideo
              src={panel.src}
              startAt={panel.at}
              freeze
              grade={panel.grade}
              focalX={panel.framing?.focalX ?? 0.5}
              focalY={panel.framing?.focalY ?? 0.45}
              scale={panel.framing?.scale ?? 1.06}
            />
            <AbsoluteFill
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(23,24,26,0.92) 0%, rgba(23,24,26,0) 34%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: SAFE.bottom,
                width: "100%",
                textAlign: "center",
                fontFamily: rtl ? FONTS.technical : FONTS.display,
                fontWeight: rtl ? 600 : 900,
                fontSize: rtl ? 50 : 58,
                letterSpacing: rtl ? 0 : 10,
                color: panel.key === "after" ? COLORS.orange : COLORS.warmBeige,
                opacity: interpolate(frame, [0.35 * fps, 0.8 * fps], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.bezier(...EASE.out),
                }),
              }}
            >
              {panel.label}
            </div>
          </div>
        ))}
      </AbsoluteFill>

      {/* The divider. */}
      <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <div
          style={{
            width: 4,
            backgroundColor: COLORS.orange,
            boxShadow: "0 0 44px 4px rgba(255,84,32,0.5)",
            height: `${interpolate(frame, [0, 0.5 * fps], [0, 100], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(...EASE.drive),
            })}%`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
