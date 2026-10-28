// Central brand tokens for the RESHAPE commercial.
// Colours come from the brief (#FF5420 / #17181A / #FFFFFF) and the production
// site (warm off-white #D9CCC4 / #F7F0E9, logo red #E71C2B traced from the site asset).

export const COLORS = {
  orange: "#FF5420",
  orangeDeep: "#E8401D",
  black: "#17181A",
  ink: "#0C0D0E",
  white: "#FFFFFF",
  warm: "#D9CCC4",
  offWhite: "#F7F0E9",
  logoRed: "#E71C2B",
} as const;

export const FONTS = {
  display: "Zain, 'IBM Plex Sans Arabic', sans-serif",
  body: "'IBM Plex Sans Arabic', Zain, sans-serif",
  latin: "'Barlow Semi Condensed', 'IBM Plex Sans Arabic', sans-serif",
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

// Mobile safe area for Reels / TikTok / Stories: keep key copy clear of the
// top status/profile row and the bottom caption + CTA bar.
export const SAFE = {
  top: 250,
  bottom: 380,
  side: 90,
} as const;

export const REGISTRATION_URL = "https://reshape-sa.com/الحصص-الجماعية-بالنادي/c571221986";
export const DISPLAY_URL = "reshape-sa.com";
export const INSTAGRAM = "@reshape.sa";
