/**
 * RESHAPE brand tokens — sourced from the production site (index.html :root).
 * Do not invent colours here; extend only from the authoritative token set.
 */
export const BRAND = {
  ink: '#17181A',
  deep: '#111113',
  charcoal: '#2F3034',
  surf: '#202124',
  surf2: '#1A1B1E',
  line: '#3A3B40',
  gray: '#444448',
  muted: '#8A8B90',
  warm: '#D9CCC4',
  soft: '#E9DDD7',
  strong: '#FFFFFF',
  orange: '#FF5420',
  orangeDim: 'rgba(255,84,32,.14)',
  glow: 'rgba(255,84,32,.10)',
  ok: '#4FB183',
  warn: '#E8B04B',
  bad: '#E4573C',
  blue: '#3FA0C4',
} as const;

export const FONT = {
  ar: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, sans-serif",
  disp: "'Zain', 'IBM Plex Sans Arabic', sans-serif",
  data: "'Barlow Semi Condensed', 'IBM Plex Sans Arabic', sans-serif",
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  spring: [0.34, 1.56, 0.64, 1] as const,
};

export const W = 1080;
export const H = 1920;
export const FPS = 30;
