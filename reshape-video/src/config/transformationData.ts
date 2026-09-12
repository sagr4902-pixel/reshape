/**
 * ============================================================================
 *  THE ONLY FILE YOU NEED TO TOUCH
 * ============================================================================
 *
 *  Drop a new pair of clips into public/ and point `transformation` at them.
 *  Nothing else is required — no name, no duration, no weight, no statistics.
 */

export type Language = "en" | "ar";

export type Transformation = {
  beforeVideo: string;
  afterVideo: string;
  language: Language;
};

export const transformation: Transformation = {
  beforeVideo: "before.mp4",
  afterVideo: "after.mp4",
  language: "en",
};

/* ==========================================================================
 *  OPTIONAL — shot list
 *
 *  Every field below is optional. Delete `shotList` entirely (set it to null)
 *  and the reel still builds: timings fall back to proportions of each clip's
 *  real duration, measured at render time.
 *
 *  Set it when you have watched the footage and know where the good frames
 *  are. All times are SECONDS INTO THE SOURCE CLIP.
 * ========================================================================== */

export type Framing = {
  /** Horizontal point of interest, 0 = left edge, 1 = right edge. */
  focalX?: number;
  /** Vertical point of interest, 0 = top, 1 = bottom. */
  focalY?: number;
  /** 1 = fill the frame. Above 1 punches in. */
  scale?: number;
};

export type Shot = Framing & {
  /** Seconds into the source clip. */
  start: number;
  /** Below 1 is slow motion. */
  playbackRate?: number;
};

export type ShotList = {
  /** 2–4 rapid flashes of the pay-off, in seconds into the AFTER clip. */
  hookFlashes: number[];
  /** The BEFORE working set. */
  before: Shot;
  /** Frame held at the end of BEFORE — pick the top of a rep. */
  matchFreeze: number;
  /** The AFTER hero move. Its first frame should echo `matchFreeze`. */
  after: Shot;
  /** The single strongest frame of the AFTER move — the impact lands here. */
  peak: number;
  /** Optional closing beat, e.g. walking away from the bar. */
  coda?: Shot;
  /** Stills used in the side-by-side. */
  comparison: { before: number; after: number };
};

/**
 * Shot list for the supplied pair.
 *
 * Read off the footage: the BEFORE clip is a set of grinding pull-ups where the
 * chin stalls at the bar; the AFTER clip contains a clean muscle-up from a dead
 * hang to a locked-out support above the bar (10.05s–12.75s). Both clips share
 * the same rig, the same camera position and the same framing, so the top of a
 * BEFORE rep cuts directly onto the same position in the AFTER rep — and then
 * one of them keeps rising. That is the whole story, told without a word.
 */
export const shotList: ShotList | null = {
  // Locked-out support, mid-transition, and support again — three hard flashes.
  hookFlashes: [12.45, 8.05, 11.25],

  // Continuous hang-and-pull work, same bar and framing as the AFTER hero.
  before: { start: 0.7, focalX: 0.5, focalY: 0.46, scale: 1.14, playbackRate: 0.95 },

  // Chin at the bar, arms bent, height stalled. The match-cut frame.
  matchFreeze: 4.6,

  // Dead hang -> explosive pull -> transition -> lockout above the bar.
  after: { start: 10.05, focalX: 0.5, focalY: 0.44, scale: 1.14 },

  // Arms locked out, hips above the bar.
  peak: 12.45,

  // Walks out of the rig toward camera.
  coda: { start: 16.6, focalX: 0.5, focalY: 0.42, scale: 1.05 },

  comparison: { before: 4.2, after: 12.45 },
};

/* ==========================================================================
 *  OPTIONAL — sound
 *
 *  The bundled SFX are synthesised from scratch, so they carry no licensing.
 *  `music` is intentionally empty: drop a licensed track into public/music and
 *  name it here. Source-clip audio sits underneath at `ambienceVolume`.
 * ========================================================================== */

export const audio = {
  music: null as string | null,
  musicVolume: 0.55,
  ambienceVolume: 0.28,
  sfxVolume: 0.85,
};
