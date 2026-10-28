import React from "react";
import { Img, staticFile } from "remotion";

/**
 * Original RESHAPE logo files, extracted byte-for-byte from the live product
 * (reshape/index.html ASSET.*). These components only position, scale, fade
 * and clip them. They never recolour, distort, rotate, outline or re-assemble
 * the logo. See docs/BRAND_SYSTEM.md → "Logo rules".
 *
 * The files are small rasters (largest 420×140). Keep display scale ≤ 1.25×
 * until a vector master is supplied (docs/MISSING_ASSETS.md).
 */
export const LOGO = {
  primary: { src: "brand/logo-primary-red.png", w: 420, h: 140, mark: { x0: 6, x1: 99, y0: 29, y1: 119 } },
  mark: { src: "brand/logo-mark-red.png", w: 180, h: 166 },
  wordmark: { src: "brand/wordmark-sand.png", w: 340, h: 101 },
  badge: { src: "brand/badge-sand.png", w: 240, h: 236 },
} as const;

export const MAX_LOGO_SCALE = 1.25;

type Kind = keyof typeof LOGO;

export const Logo: React.FC<{
  kind: Kind;
  scale?: number;
  style?: React.CSSProperties;
}> = ({ kind, scale = 1, style }) => {
  const a = LOGO[kind];
  const s = Math.min(scale, MAX_LOGO_SCALE);
  return (
    <Img
      src={staticFile(a.src)}
      style={{ width: a.w * s, height: a.h * s, display: "block", ...style }}
    />
  );
};
