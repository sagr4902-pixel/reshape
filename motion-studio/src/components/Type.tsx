import React from "react";
import { useCurrentFrame } from "remotion";
import { color, dur, type, TypeRole } from "../brand/tokens";
import { enter, riseStyle } from "../lib/motion";

export const typeStyle = (role: TypeRole, overrides: React.CSSProperties = {}): React.CSSProperties => {
  const t = type[role];
  return {
    fontFamily: t.family,
    fontSize: t.size,
    fontWeight: t.weight,
    lineHeight: t.lineHeight,
    letterSpacing: t.tracking ? `${t.tracking}em` : undefined,
    color: color.bone,
    ...overrides,
  };
};

const MASK_PAD_TOP = 0.35;
const MASK_PAD_BOTTOM = 0.45;

/**
 * One line of Arabic that reveals word by word.
 *
 * Arabic letters join, so motion is applied to whole words only: animating
 * individual letters would break the shaping. Each word rises out of its own
 * mask box, in reading order (right → left), starting at its cue frame.
 */
export const WordLine: React.FC<{
  words: { text: string; at: number; tone?: string }[];
  role?: TypeRole;
  style?: React.CSSProperties;
  align?: "start" | "center" | "end";
  length?: number;
}> = ({ words, role = "h1", style, align = "start", length = dur.reveal }) => {
  const frame = useCurrentFrame();
  return (
    <div
      dir="rtl"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center",
        columnGap: "0.24em",
        ...typeStyle(role),
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = enter(frame, w.at, length);
        return (
          // The mask box is padded well past the line box: Arabic dots and
          // harakat sit above and below it, and a tight mask would clip them
          // (e.g. the dots of ي in خصيصاً). Negative margins keep layout unchanged.
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: `${MASK_PAD_TOP}em 0.06em ${MASK_PAD_BOTTOM}em`, margin: `-${MASK_PAD_TOP}em -0.06em -${MASK_PAD_BOTTOM}em` }}>
            <span style={{ display: "inline-block", color: w.tone, ...riseStyle(p, 1 + MASK_PAD_TOP + MASK_PAD_BOTTOM) }}>{w.text}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Latin eyebrow in Barlow Semi Condensed, tracked out, like the app's section labels. */
export const Eyebrow: React.FC<{ children: React.ReactNode; at?: number; tone?: string; style?: React.CSSProperties }> = ({
  children,
  at = 0,
  tone = color.sand,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, dur.reveal);
  return (
    <div
      dir="ltr"
      style={{
        ...typeStyle("eyebrow"),
        color: tone,
        textTransform: "uppercase",
        opacity: p,
        translate: `${(1 - p) * 24}px 0`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
