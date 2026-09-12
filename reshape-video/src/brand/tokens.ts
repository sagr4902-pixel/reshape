/**
 * RESHAPE brand system — the single source of truth for the video template.
 *
 * Values are taken from the official RESHAPE brand guidelines and the
 * reshape-online.com stylesheet. Changing a value here changes it everywhere,
 * which is what keeps every transformation reel on-campaign.
 */

export const COLORS = {
  /** Primary surface. */
  charcoal: "#2F3034",
  /** Secondary surface / dividers. */
  darkGray: "#444448",
  /** Deepest ink, used for letterboxing and dips to black. */
  ink: "#17181A",
  /** Body copy on dark. */
  warmBeige: "#D9CCC4",
  /** Headline copy on dark. */
  softBeige: "#E9DDD7",
  /** Controlled accent — never a fill, only an edge, a line or a single word. */
  orange: "#FF5420",
} as const;

export const FONTS = {
  /** Zain — display weight for labels and headlines. */
  display: "Zain",
  /** IBM Plex Sans Arabic — technical/small copy, and all Arabic body text. */
  technical: "IBM Plex Sans Arabic",
} as const;

/** Composition format: 9:16 vertical, social-native. */
export const FORMAT = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Reels / TikTok / Shorts interface overlays. Nothing that must be read is
 * allowed inside these margins.
 *
 * Bottom is the deepest because it carries the caption block and the
 * like/comment/share rail sits in the lower right.
 */
export const SAFE = {
  top: 220,
  bottom: 420,
  left: 90,
  right: 190,
} as const;

/**
 * The RESHAPE motion language: precise, athletic, controlled, fast.
 * Cubic-bezier control points, kept here so every component decelerates
 * the same way.
 */
export const EASE = {
  /** Default: fast out, long settle. Used for nearly every entrance. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Mechanical, for wipes and lines travelling across frame. */
  drive: [0.65, 0, 0.35, 1] as const,
  /** Sharp attack for impacts and punch zooms. */
  impact: [0.2, 0.9, 0.1, 1] as const,
};

/** Bilingual copy. The only on-footage words the template is allowed to show. */
export const COPY = {
  en: {
    before: "BEFORE",
    after: "AFTER",
    brandLine: "RE-SHAPE YOUR BODY",
    subLine: "ONLINE PERSONAL TRAINING",
    cta: "START YOUR JOURNEY",
    site: "reshape-online.com",
    dir: "ltr" as const,
  },
  ar: {
    before: "قبل",
    after: "بعد",
    brandLine: "RE-SHAPE YOUR BODY",
    subLine: "تدريب شخصي عن بُعد",
    cta: "ابدأ رحلتك الآن",
    site: "reshape-online.com",
    dir: "rtl" as const,
  },
} as const;
