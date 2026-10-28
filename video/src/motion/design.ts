// Design tokens for the motion-graphics version (brief colours: #FF5420 / #17181A / #FFFFFF).
export const MCOLORS = {
  orange: "#FF5420",
  orangeHi: "#FF7A4D",
  orangeDeep: "#C93A12",
  black: "#17181A",
  ink: "#0F1011",
  panel: "#202124",
  line: "rgba(255,255,255,0.08)",
  white: "#FFFFFF",
  mute: "#9A9BA0",
  warm: "#D9CCC4",
  logoRed: "#E71C2B",
} as const;

/** The slant used across the system, borrowed from the RESHAPE mark's diagonal strokes. */
export const SLANT = -14; // degrees (CSS skewX)

export const W = 1080;
export const H = 1920;
/** Key copy stays inside this box (Reels/TikTok UI-safe). */
export const SAFE = { left: 90, right: 940, top: 250, bottom: 1540 };
