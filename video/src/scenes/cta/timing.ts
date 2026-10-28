import { local, TIMELINE, wordAt } from "../../lib/timeline";

// All frames are relative to the start of the CTA scene (26.0 s).
const w = (text: string, occurrence = 0) => local("cta", wordAt(text, occurrence));

export const FPS = 30;
export const BEAT = 15; // 120 BPM

export const DROP = local("cta", TIMELINE.hits.drop); // 0
export const END_CARD = local("cta", TIMELINE.endCardAt); // 105
export const FINAL_HIT = local("cta", TIMELINE.finalHit); // 180

export const T = {
  reshape: w("ريشيب", 1), // 8
  ghayyir: w("غيّر"), // 33
  adaak: w("أداءك"), // 44
  warfa: w("وارفع"), // 65
  mustawak: w("مستواك", 1), // 77
  sajjil: w("سجّل"), // 112
};

/** Montage cuts: one shot per beat, hard cuts on the kick. */
export const CUTS = [0, 15, 30, 45, 60, 75, 90, END_CARD];
