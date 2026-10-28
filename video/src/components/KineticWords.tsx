import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../lib/brand";

export type KWord = {
  text: string;
  /** frame (relative to the parent Sequence) at which the word lands */
  at: number;
  color?: string;
};

type Props = {
  words: KWord[];
  fontSize: number;
  weight?: number;
  font?: string;
  /** frame at which the whole line exits; omit to stay */
  out?: number;
  style?: "rise" | "slam" | "blur";
  align?: "center" | "flex-start" | "flex-end";
  gap?: number;
  lineHeight?: number;
  color?: string;
  letterSpacing?: number;
  shadow?: boolean;
};

/**
 * Word-by-word Arabic kinetic type. Animation is per WORD, never per letter, so Arabic
 * letter joining (shaping) is never broken. Words flow right-to-left.
 */
export const KineticWords: React.FC<Props> = ({
  words,
  fontSize,
  weight = 900,
  font = FONTS.display,
  out,
  style = "rise",
  align = "center",
  gap = 0.28,
  lineHeight = 1.25,
  color = COLORS.white,
  letterSpacing = 0,
  shadow = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exit =
    out === undefined
      ? 0
      : interpolate(frame, [out, out + 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        });

  return (
    <div
      style={{
        direction: "rtl",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align,
        alignItems: "baseline",
        columnGap: fontSize * gap,
        fontFamily: font,
        fontWeight: weight,
        fontSize,
        lineHeight,
        letterSpacing,
        color,
        opacity: 1 - exit,
        transform: `translateY(${-exit * fontSize * 0.25}px)`,
        filter: exit > 0 ? `blur(${exit * 10}px)` : undefined,
      }}
    >
      {words.map((w, i) => {
        const p = spring({
          frame: frame - w.at,
          fps,
          config: style === "slam" ? { damping: 14, stiffness: 220, mass: 0.6 } : { damping: 200, stiffness: 160 },
          durationInFrames: style === "slam" ? 14 : 16,
        });
        const visible = frame >= w.at;
        const blur = interpolate(p, [0, 1], [style === "blur" ? 18 : 8, 0]);
        const y = style === "rise" ? interpolate(p, [0, 1], [0.62, 0]) : 0;
        const scale = style === "slam" ? interpolate(p, [0, 1], [1.55, 1]) : style === "blur" ? interpolate(p, [0, 1], [1.08, 1]) : 1;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              // a little room above/below so Arabic marks and descenders are never clipped
              // horizontal room (cancelled by the negative margin) so the shadow is not cut at the sides
              padding: `${fontSize * 0.12}px 0.3em`,
              margin: "0 -0.26em",
              overflow: style === "rise" ? "hidden" : "visible",
            }}
          >
            <span
              style={{
                display: "inline-block",
                color: w.color ?? color,
                opacity: visible ? Math.min(1, p * 1.6) : 0,
                transform: `translateY(${y * 100}%) scale(${scale})`,
                filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
                // the shadow fades in as the word settles, so the rise mask never shows a hard shadow edge
                textShadow: shadow
                  ? `0 6px 40px rgba(0,0,0,${(0.55 * Math.min(1, Math.max(0, (p - 0.6) / 0.4))).toFixed(3)})`
                  : undefined,
              }}
            >
              {w.text}
            </span>
          </span>
        );
      })}
    </div>
  );
};
