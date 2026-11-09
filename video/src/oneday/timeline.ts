// RESHAPE "One Day" (v2): one actor, one continuous day, one camera.
// 30 fps composition frames. Clips are Kling 3.0 renders (24 fps) chained start->end so the
// dawn sequence (c02..c06) reads as a single take; phone screens are composited in
// scripts/phone_comp.py. Audio cue frames are mirrored in scripts/build_oneday_audio.py.

export const OD_FPS = 30;
export const OD_DURATION = 1723;

export type Edge = "cut" | "bloom" | "whip" | "black" | "dissolve";

export type ClipShot = {
  id: string; // public/ad/v2/{h|v}/<id>.mp4
  from: number;
  dur: number;
  src: number; // seconds into the clip
  rate: number; // playback rate (the dawn take is tightened, never slowed)
  in?: Edge;
  out?: Edge;
};

export const CLIPS: ClipShot[] = [
  { id: "c01", from: 0, dur: 165, src: 0, rate: 1, out: "bloom" }, // bedroom: notification -> Account page
  { id: "c02", from: 165, dur: 131, src: 0, rate: 1.15, in: "bloom" }, // rooftop door -> phone: today's workout
  { id: "c03", from: 296, dur: 131, src: 0, rate: 1.15 }, // session video -> phone down -> chalk -> grip
  { id: "c04", from: 427, dur: 97, src: 0, rate: 1.25 }, // crane back to the hang
  { id: "c05", from: 524, dur: 137, src: 0, rate: 1.1 }, // pull-up, push into the shirt
  { id: "c06", from: 661, dur: 121, src: 0, rate: 1, out: "whip" }, // out of the shirt: the desert
  { id: "c07", from: 782, dur: 52, src: 1.0, rate: 1, in: "whip", out: "whip" }, // hotel
  { id: "c08", from: 834, dur: 54, src: 0.5, rate: 1, in: "whip", out: "whip" }, // corniche
  { id: "c09", from: 888, dur: 129, src: 0, rate: 1, in: "whip", out: "black" }, // kitchen: nutrition
  { id: "c10", from: 1044, dur: 159, src: 0, rate: 1, in: "black" }, // weeks later: progress + medal
  { id: "c11", from: 1203, dur: 129, src: 0.3, rate: 1, out: "dissolve" }, // sunset pull-up (matches c04/c05)
  { id: "c12", from: 1317, dur: 181, src: 0, rate: 1, in: "dissolve" }, // dusk: types reshape-online.com
];

export const EDGE_LEN: Record<Edge, number> = { cut: 0, bloom: 10, whip: 6, black: 10, dissolve: 15 };

/** "weeks later" title card on black */
export const CARD = { from: 1017, dur: 27, text: "بعد 8 أسابيع", latin: "8 WEEKS LATER" };

/** the website, full screen, continuing the dusk phone's screen track */
export const WEB = { from: 1498, dur: 105, trackStart: 181, dir: "ad/v2/web", n: 330 };

/** kinetic URL typed in sync with the phone (dusk shot); web track frames 12..48 = typing */
export const URL_TYPE = { from: 1329, typeFrames: 36, hold: 120, text: "reshape-online.com" };

export const END = { from: 1603, dur: 120 };

// On-screen supers for sound-off viewing. Placed where the frame has room and no phone.
export const SUPERS = [
  { text: "بدون نادي.", from: 560, dur: 90 },
  { text: "وين ما كنت.", from: 700, dur: 180 },
  { text: "خطوة بخطوة.", from: 1232, dur: 84 },
];
