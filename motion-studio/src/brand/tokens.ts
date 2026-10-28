/**
 * RESHAPE brand tokens for motion.
 *
 * Every value here is sourced from the live RESHAPE product (reshape/index.html)
 * or sampled from the original logo files in public/brand/. Nothing is invented:
 * where the motion system needs a value the brand never defined (for example
 * frame-based durations), it is derived from an existing brand value and the
 * derivation is noted next to it. See docs/BRAND_SYSTEM.md.
 */

// ── Colour ────────────────────────────────────────────────────────────────────
export const color = {
  // Sampled from logo-mark-red.png / logo-primary-red.png (dominant opaque pixel).
  signalRed: "#E71C2B",
  // Sampled from wordmark-sand.png / badge-sand.png.
  sand: "#E8D5C9",
  sandShade: "#E1CDC2",

  // Dark theme of the app (:root in index.html) — the brand's default stage.
  ink: "#17181A", // --ink (light) / theme-color / manifest background
  deep: "#111113", // --deep (dark)
  field: "#141416", // --field (dark)
  panel: "#1D1E21", // --panel (dark)
  surface: "#202124", // --surf (dark)
  line: "#3A3B40", // --line (dark)
  track: "#2A2B2F", // --track (dark)
  muted: "#8A8B90", // --muted (dark)
  bone: "#EFE7DF", // --ink (dark): the app's primary text colour on dark
  white: "#FFFFFF",

  // Accent used by the app UI for progress, highlights and the referral code.
  ember: "#FF5420", // --orange (dark)
  emberDeep: "#E8401D", // --orange (light)

  // Functional colours (dark theme). Use only for data that means ok / warn.
  ok: "#4FB183",
  warn: "#E8B04B",
} as const;

export type BrandColor = keyof typeof color;

export const gradient = {
  // App: --glass-bg-hot (dark), the warm card glow.
  hotGlow: "radial-gradient(60% 50% at 50% 40%, rgba(255,110,60,.16), rgba(255,255,255,0) 70%)",
  // App progress bar fill (referral meter).
  emberBar: `linear-gradient(90deg, ${"#FF7A46"}, ${"#FF5420"})`,
} as const;

// ── Typography ────────────────────────────────────────────────────────────────
// Same three families the website loads from Google Fonts.
export const font = {
  /** Arabic display — headlines, hooks, CTA. (--disp) */
  display: "'Zain', 'IBM Plex Sans Arabic', sans-serif",
  /** Arabic + Latin body text, labels. (--ar) */
  text: "'IBM Plex Sans Arabic', sans-serif",
  /** Numbers, Latin caps, data, eyebrows. (--data) */
  data: "'Barlow Semi Condensed', 'IBM Plex Sans Arabic', sans-serif",
} as const;

/**
 * Type scale for a 1080-wide canvas (9:16 master). Sizes follow a 1.25 ratio
 * from the 44px supporting-text floor up to the 300px hero numerals.
 * lineHeight is tight for Zain (it has tall ascenders), looser for Plex body.
 */
export const type = {
  hero: { family: font.display, size: 196, weight: 900, lineHeight: 1.0, tracking: 0 },
  h1: { family: font.display, size: 140, weight: 900, lineHeight: 1.04, tracking: 0 },
  h2: { family: font.display, size: 92, weight: 800, lineHeight: 1.08, tracking: 0 },
  h3: { family: font.display, size: 76, weight: 800, lineHeight: 1.12, tracking: 0 },
  body: { family: font.text, size: 46, weight: 500, lineHeight: 1.45, tracking: 0 },
  label: { family: font.text, size: 36, weight: 600, lineHeight: 1.3, tracking: 0 },
  numeral: { family: font.data, size: 300, weight: 800, lineHeight: 0.9, tracking: -0.01 },
  eyebrow: { family: font.data, size: 34, weight: 700, lineHeight: 1, tracking: 0.24 },
} as const;

export type TypeRole = keyof typeof type;

// ── Grid & spacing ────────────────────────────────────────────────────────────
/** App spacing scale is 4px based (--sp-1 … --sp-9). Motion uses the same base ×2
 *  because a 1080px frame is ~2.7× a 390px phone viewport. */
export const space = {
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
  7: 64,
  8: 80,
  9: 96,
  10: 128,
} as const;

export const grid = {
  /** 9:16 master canvas */
  width: 1080,
  height: 1920,
  /** Safe area: 96px sides, 160px top, 220px bottom (clears platform UI on Reels/TikTok). */
  safe: { top: 160, right: 96, bottom: 220, left: 96 },
  /** 6-column grid inside the safe area, 24px gutters. */
  columns: 6,
  gutter: 24,
  /** Baseline unit for vertical rhythm. */
  baseline: 8,
} as const;

export const radius = {
  card: 36, // app --radius 14px × ~2.6
  pill: 999,
} as const;

// ── Motion ────────────────────────────────────────────────────────────────────
/** Cubic-bezier control points copied from the app (--ease-out, --ease-in-out, --ease-spring). */
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  /** Overshoot. Use for at most one element per scene (the "hit"), never for text blocks. */
  spring: [0.34, 1.56, 0.64, 1] as const,
  /** Exit curve: mirror of `out`. */
  in: [0.7, 0, 0.84, 0] as const,
} as const;

export const FPS = 30;

/** App durations (--dur-micro 140ms, --dur-ui 220ms, --dur-reveal 380ms, --dur-cheer 650ms)
 *  converted to 30fps frames and rounded. */
export const dur = {
  micro: 4,
  ui: 7,
  reveal: 12,
  cheer: 20,
  /** Word-to-word stagger for kinetic Arabic lines. */
  stagger: 3,
  /** Hold a finished frame at least this long before it starts exiting. */
  minHold: 18,
  /** Scene hand-off overlap. */
  sceneHandoff: 10,
} as const;

// ── Sound identity ────────────────────────────────────────────────────────────
export const sound = {
  /** Integrated loudness target for social delivery (EBU R128 / platform norm). */
  targetLufs: -14,
  truePeakDb: -1.0,
  /** Ducking: music sits this far under narration while VO is active. */
  musicUnderVoiceDb: -20,
  musicBedDb: -12,
  sfxDb: -9,
  /** Brand palette of sounds. Prompts used for ElevenLabs SFX generation. */
  sfxPrompts: {
    whoosh: "short clean air whoosh, modern, no reverb tail, 0.6 seconds",
    hit: "deep punchy sub impact with a tight metallic click, gym plate dropping on rubber floor, short",
    tick: "crisp digital UI tick, very short, high and dry",
    riser: "short tension riser, filtered noise sweeping up, 1.5 seconds, modern sports promo",
    logo: "single powerful low boom with a bright shimmer, sports brand logo sting, 2 seconds",
  },
} as const;
