/**
 * RESHAPE_THEME — single source of truth for the motion system.
 * No component may hard-code a colour, radius, duration or spring.
 */
export const RESHAPE_THEME = {
  fps: 30,
  width: 1080,
  height: 1920,

  font: {
    display: '"Tajawal Black", system-ui, sans-serif',
    body: '"Tajawal Bold", system-ui, sans-serif',
  },

  size: {
    caption: 74,
    cardTitle: 44,
    cardTitleLg: 40,
    cardLabel: 19,
    cardBody: 27,
    cardMeta: 22,
    cardNote: 21,
    brandLg: 62,
    brandSm: 26,
  },

  color: {
    accent: '#FFD24A',
    danger: '#FF5A5A',
    ok: '#43E08A',
    panel: 'rgba(13,17,23,0.92)',
    panelSolid: '#0D1117',
    border: '#303A48',
    text: '#FFFFFF',
    sub: '#96A3B2',
    blood: '#D63A3A',
    bloodBright: '#EC4848',
    fibre: 'rgba(120,40,44,0.42)',
  },

  radius: { card: 26, pill: 14, chip: 10 },
  stroke: { hair: 2, vessel: 11, capillary: 6 },
  space: { cardPad: 30, gap: 14 },
  shadow: '0 16px 44px rgba(0,0,0,0.48)',
  textShadow: '0 4px 14px rgba(0,0,0,0.55)',

  /** Restrained, professional springs — no default bounce. */
  spring: {
    /** panels, cards: settles firmly, no overshoot wobble */
    panel: { damping: 26, stiffness: 150, mass: 0.85 },
    /** small UI elements, labels */
    label: { damping: 22, stiffness: 190, mass: 0.7 },
    /** keyword pop: quick, tiny overshoot */
    pop: { damping: 15, stiffness: 240, mass: 0.6 },
  },

  dur: { fadeIn: 6, fadeOut: 8, cardIn: 22, cardOut: 12, keyword: 9 },

  /** Alpha tints of the palette above, so no component re-types a channel. */
  tint: {
    accentFaint: 'rgba(255,210,74,0.10)',
    accentEdge: 'rgba(255,210,74,0.63)',
    accentDot: 'rgba(255,210,74,0.80)',
    dangerFaint: 'rgba(255,90,90,0.12)',
    textSoft: 'rgba(255,255,255,0.94)',
    capStroke: 'rgba(12,16,22,0.82)',
    debug: 'rgba(255,0,80,0.22)',
  },

  /**
   * Instagram Reels chrome. The right-hand action rail only occupies the lower
   * part of the frame, so `rightFrom` is where it starts — a panel in the upper
   * band may sit inside `right` without being covered.
   */
  safe: { top: 140, bottom: 400, left: 48, right: 168, rightFrom: 1050 },

  /** Fixed layout bands: cards live above the face, captions below it. */
  zone: { cardCenterY: 560, captionBottomY: 1420 },
} as const;

export type Theme = typeof RESHAPE_THEME;
