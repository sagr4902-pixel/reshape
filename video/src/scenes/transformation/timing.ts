import { local, wordAt } from "../../lib/timeline";

// All frames are relative to the start of the "transformation" scene (20.0 s).
const L = (s: number) => local("transformation", s);

/** Warm bell melody of the breakdown: three notes per bar, every 2 s. */
export const BELLS = [20.0, 20.75, 21.0, 22.0, 22.75, 23.0, 24.0, 24.75, 25.0].map(L);

/** One staircase step lights up on each of the first six bell notes. */
export const STEP_NOTES = BELLS.slice(0, 6);

/** Cut to the slow-motion final rep on the 7th bell (24.0 s, start of the snare roll / riser). */
export const CUT_REP = L(24.0);
/** Remaining bell accents inside the rep shot (scene-relative). */
export const REP_NOTES = BELLS.slice(6);
/** Near-silence before the big drop: hard cut to black. */
export const BLACK_FROM = 175;
export const SCENE_LEN = 180;

export const VO = {
  mahma: L(wordAt("مهما")),
  kan: L(wordAt("كان")),
  mustawak: L(wordAt("مستواك")),
  huna: L(wordAt("هنا")),
  tabda: L(wordAt("تبدا")),
  khutwatak: L(wordAt("خطوتك")),
  afdal: L(wordAt("للأفضل")),
};
