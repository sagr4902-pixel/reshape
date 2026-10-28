import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { color, font } from "../brand/tokens";

/**
 * Giant outlined Latin type drifting in alternating rows — the athletic
 * poster texture. Used by the hook and again by the brand reveal so the ad
 * opens and closes on the same image.
 */
export const Backdrop: React.FC<{ word: string; opacity?: number }> = ({ word, opacity = 0.055 }) => {
  const frame = useCurrentFrame();
  const rows = 6;
  return (
    <AbsoluteFill style={{ opacity }}>
      {Array.from({ length: rows }).map((_, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <div
            key={i}
            dir="ltr"
            style={{
              position: "absolute",
              top: -60 + i * 330,
              left: -400,
              whiteSpace: "nowrap",
              fontFamily: font.data,
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: 360,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `2px ${color.sand}`,
              translate: `${dir * frame * 1.6 - (i % 2) * 300}px 0`,
            }}
          >
            {`${word} ${word} ${word}`}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
