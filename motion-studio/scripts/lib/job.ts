import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const PUBLIC = path.join(ROOT, "public");

export const jobDir = (id: string) => path.join(PUBLIC, "jobs", id);
export const outDir = (id: string) => path.join(ROOT, "out", id);
/** Path relative to public/, as staticFile() expects. */
export const publicRel = (id: string, file: string) => `jobs/${id}/${file}`;

export type JobScene = {
  id: string;
  template: string;
  anchor: string;
  cues: Record<string, string>;
  sfx?: { kind: string; cue: string; offsetFrames?: number }[];
  props: Record<string, unknown>;
};

export type Job = {
  id: string;
  title: string;
  claims: { text: string; source: string }[];
  voice: { voiceId: string; model: string; script: string; audio: string; words: string };
  music?: { src: string } | null;
  format: { width: number; height: number; fps: number; tailSeconds: number; leadInSeconds: number; transitionFrames: number };
  scenes: JobScene[];
};

export type SttWord = { text: string; type?: string; start: number; end: number };

export const readJob = (id: string): Job => {
  const p = path.join(jobDir(id), "job.json");
  if (!existsSync(p)) throw new Error(`No job at ${p}`);
  return JSON.parse(readFileSync(p, "utf8"));
};

export const readWords = (job: Job): SttWord[] => {
  const raw = JSON.parse(readFileSync(path.join(jobDir(job.id), job.voice.words), "utf8"));
  const words: SttWord[] = Array.isArray(raw) ? raw : raw.words;
  return words.filter((w) => (w.type ?? "word") === "word");
};

/** Normalise Arabic/Latin tokens for matching script cues against transcript words. */
export const norm = (s: string) =>
  s
    .normalize("NFC")
    .replace(/[ً-ٰٟـ]/g, "") // harakat, dagger alef, tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/[،؛؟.,:;!?…"'«»()\[\]\-–—]/g, "")
    .toLowerCase()
    .trim();
