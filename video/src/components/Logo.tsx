import React, { useId } from "react";
import { COLORS } from "../lib/brand";
import { LOGO_BOX, MARK_BOX, MARK_PATH, WORD_PATH } from "./logoPaths";

// Authentic RESHAPE logo, traced from the production-site asset (scripts/vectorize_logo.py).
// Geometry is the brand's own; only the source pixels were cleaned into vector paths.

export const LogoMark: React.FC<{ height: number; color?: string; style?: React.CSSProperties }> = ({
  height,
  color = COLORS.logoRed,
  style,
}) => (
  <svg
    viewBox={`${MARK_BOX.x} ${MARK_BOX.y} ${MARK_BOX.w} ${MARK_BOX.h}`}
    style={{ height, width: (height * MARK_BOX.w) / MARK_BOX.h, display: "block", overflow: "visible", ...style }}
  >
    <path d={MARK_PATH} fill={color} />
  </svg>
);

/**
 * Full lockup (mark + "reshape™" wordmark). `wordReveal` 0→1 wipes the wordmark in from
 * behind the mark, so the reveal can be animated without altering the logo itself.
 */
export const LogoLockup: React.FC<{
  width: number;
  color?: string;
  wordColor?: string;
  wordReveal?: number;
  style?: React.CSSProperties;
}> = ({ width, color = COLORS.logoRed, wordColor, wordReveal = 1, style }) => {
  const clipId = `reshape-word-clip-${useId().replace(/:/g, "")}`;
  const height = (width * LOGO_BOX.h) / LOGO_BOX.w;
  const splitX = MARK_BOX.x + MARK_BOX.w;
  const clipW = (LOGO_BOX.x + LOGO_BOX.w - splitX) * wordReveal;
  return (
    <svg
      viewBox={`${LOGO_BOX.x} ${LOGO_BOX.y} ${LOGO_BOX.w} ${LOGO_BOX.h}`}
      style={{ width, height, display: "block", overflow: "visible", ...style }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={splitX} y={LOGO_BOX.y - 5} width={Math.max(0, clipW)} height={LOGO_BOX.h + 10} />
        </clipPath>
      </defs>
      <path d={MARK_PATH} fill={color} />
      <g clipPath={`url(#${clipId})`}>
        <path
          d={WORD_PATH}
          fill={wordColor ?? color}
          transform={`translate(${(1 - wordReveal) * -40} 0)`}
        />
      </g>
    </svg>
  );
};
