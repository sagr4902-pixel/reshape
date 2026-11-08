// RESHAPE cinematic commercial — 45 s @ 30 fps, one edit for 16:9 and 9:16.
// Frames are composition frames (30 fps). Voice-over cue frames are mirrored in
// scripts/build_cine_audio.py, which pre-mixes the dry VO + SFX (no music).

export const FPS = 30;
export const CINE_DURATION = 1350;

export type ClipShot = { kind: "clip"; from: number; dur: number; clip: string; start?: number; zoom?: [number, number] };
export type PhoneSeg = { seq: keyof typeof SEQS; at: number; hold?: boolean };
export type PhoneShot = {
  kind: "phone";
  from: number;
  dur: number;
  bg: string;
  accent: string;
  segs: PhoneSeg[];
  /** play a footage clip inside the session's video cover */
  cover?: { clip: string; start: number; at: number };
};
export type EndShot = { kind: "end"; from: number; dur: number };
export type Shot = ClipShot | PhoneShot | EndShot;

export const SEQS = {
  home: { dir: "ad/app/seq_home", n: 108 },
  session: { dir: "ad/app/seq_session", n: 75 },
  food: { dir: "ad/app/seq_food", n: 120 },
  progress: { dir: "ad/app/seq_progress", n: 120 },
  medal: { dir: "ad/app/seq_medal", n: 54 },
} as const;

// The session capture's video cover, in CSS px of the 390 x 844 viewport (scroll 0).
export const COVER_RECT = { x: 31, y: 325.8, w: 328, h: 184.5 };

export const SHOTS: Shot[] = [
  { kind: "clip", from: 0, dur: 96, clip: "01", start: 0.25, zoom: [1.0, 1.05] },
  { kind: "clip", from: 96, dur: 72, clip: "02", start: 0.4, zoom: [1.04, 1.1] },
  { kind: "clip", from: 168, dur: 60, clip: "03", start: 0.5, zoom: [1.05, 1.1] },
  { kind: "clip", from: 228, dur: 72, clip: "04", start: 0.6, zoom: [1.04, 1.09] },
  // the sand close-up is cut before the body enters the frame
  { kind: "clip", from: 300, dur: 48, clip: "05", start: 0.0, zoom: [1.06, 1.1] },
  { kind: "phone", from: 348, dur: 120, bg: "ad/bg/train.webp", accent: "#FF5A1F", segs: [{ seq: "home", at: 10 }] },
  {
    kind: "phone",
    from: 468,
    dur: 90,
    bg: "ad/bg/train.webp",
    accent: "#FF5A1F",
    segs: [{ seq: "session", at: 0, hold: true }],
    cover: { clip: "01", start: 1.2, at: 18 },
  },
  { kind: "clip", from: 558, dur: 60, clip: "08", start: 0.3, zoom: [1.04, 1.09] },
  { kind: "clip", from: 618, dur: 60, clip: "06", start: 0.6, zoom: [1.05, 1.1] },
  { kind: "clip", from: 678, dur: 60, clip: "10", start: 0.8, zoom: [1.04, 1.09] },
  { kind: "phone", from: 738, dur: 132, bg: "ad/bg/food.webp", accent: "#2FD47F", segs: [{ seq: "food", at: 8 }] },
  {
    kind: "phone",
    from: 870,
    dur: 174,
    bg: "ad/bg/progress.webp",
    accent: "#A57BFF",
    segs: [
      { seq: "progress", at: 0 },
      { seq: "medal", at: 120, hold: true },
    ],
  },
  { kind: "clip", from: 1044, dur: 126, clip: "11", start: 0.2, zoom: [1.03, 1.1] },
  { kind: "clip", from: 1170, dur: 90, clip: "12", start: 0.6, zoom: [1.08, 1.0] },
  { kind: "end", from: 1260, dur: 90 },
];

// On-screen supers (for sound-off viewing): approved copy from the writer pass.
export const SUPERS = [
  { text: "بدون نادي.", from: 44, dur: 52, place: "footage" as const },
  { text: "برنامجك… كل يوم.", from: 372, dur: 92, place: "phone" as const },
  { text: "في أي مكان.", from: 600, dur: 138, place: "footage" as const },
  { text: "أسبوع بعد أسبوع.", from: 884, dur: 116, place: "phone" as const },
];
