import { z } from "zod";

/**
 * A timeline is produced by scripts/build-timeline.ts from a job.json plus the
 * word timings of the real narration audio. Every frame number here is derived
 * from the audio — the visuals follow the voice, never the reverse.
 */

export const wordSchema = z.object({
  text: z.string(),
  /** frames, relative to the scene start */
  from: z.number(),
  to: z.number(),
});

export const sceneSchema = z.object({
  id: z.string(),
  template: z.string(),
  /** absolute frame where the scene starts */
  from: z.number(),
  durationInFrames: z.number(),
  /** named beats, in frames relative to the scene start */
  cues: z.record(z.string(), z.number()),
  words: z.array(wordSchema),
  props: z.record(z.string(), z.unknown()),
});

export const sfxEventSchema = z.object({
  kind: z.string(),
  src: z.string(),
  frame: z.number(),
  gainDb: z.number(),
});

export const timelineSchema = z.object({
  id: z.string(),
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  durationInFrames: z.number(),
  /** frames of overlap used by the slant transition between scenes */
  transitionFrames: z.number(),
  audio: z.object({
    /** final mixed stereo track, relative to public/ */
    mix: z.string().nullable(),
    voice: z.string(),
  }),
  scenes: z.array(sceneSchema),
  sfx: z.array(sfxEventSchema),
});

export type Word = z.infer<typeof wordSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Timeline = z.infer<typeof timelineSchema>;

/** Props every template receives. `cues` holds beat frames relative to the scene. */
export type TemplateProps<P> = {
  cues: Record<string, number>;
  words: Word[];
  durationInFrames: number;
} & P;

export const cue = (cues: Record<string, number>, name: string, fallback = 0) =>
  cues[name] ?? fallback;
