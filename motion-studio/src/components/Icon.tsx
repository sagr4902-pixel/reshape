import React from "react";
import type { LucideIcon } from "lucide-react";
import { color } from "../brand/tokens";

/**
 * Icon style: Lucide (24-unit grid, round caps and joins) — the same geometry
 * the RESHAPE app draws its inline icons with (viewBox 0 0 24 24,
 * stroke-width 2, round caps). In video, strokes are kept optically constant:
 * a 96px icon gets a 1.75 stroke (≈7px), so icons of every size share one weight.
 */
export const ICON_STROKE_PX = 7;

export const Icon: React.FC<{
  icon: LucideIcon;
  size?: number;
  tone?: string;
  style?: React.CSSProperties;
}> = ({ icon: Glyph, size = 96, tone = color.sand, style }) => {
  const strokeWidth = (ICON_STROKE_PX / size) * 24;
  return (
    <Glyph
      size={size}
      color={tone}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={false}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", ...style }}
    />
  );
};
