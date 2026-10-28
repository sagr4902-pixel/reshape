/**
 * QUALITY GATE 1 — static contact sheet, before anything is animated or mixed.
 *
 *   npx tsx scripts/qc/contact-sheet.ts <job-id>
 *
 * Renders every scene at its "fully built" frame (the last cue + a settle
 * margin), plus one mid-build frame, and tiles them into one sheet with labels.
 * Review it for brand consistency, typography, alignment, hierarchy, icon
 * consistency and originality. If scenes look generic, redesign first.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { jobDir, outDir } from "../lib/job";
import { stills } from "../lib/render";

const SETTLE = 18;

export const contactSheet = async (id: string, label = "contact-sheet") => {
  const timeline = JSON.parse(readFileSync(path.join(jobDir(id), "timeline.json"), "utf8"));
  const dir = path.join(outDir(id), label);
  mkdirSync(dir, { recursive: true });

  const frames: { frame: number; output: string; caption: string }[] = [];
  timeline.scenes.forEach((s: { id: string; template: string; from: number; durationInFrames: number; cues: Record<string, number> }, i: number) => {
    const lastCue = Math.max(0, ...Object.values(s.cues));
    const built = Math.min(s.from + s.durationInFrames - 1, s.from + lastCue + SETTLE);
    const mid = s.from + Math.round(lastCue * 0.5) + 4;
    const n = String(i + 1).padStart(2, "0");
    frames.push({ frame: mid, output: path.join(dir, `${n}a-${s.id}.png`), caption: `${n} ${s.template} · build f${mid}` });
    frames.push({ frame: built, output: path.join(dir, `${n}b-${s.id}.png`), caption: `${n} ${s.template} · final f${built}` });
  });

  await stills({ compositionId: "Ad", inputProps: { timeline, muted: true }, frames, scale: 0.5 });

  const sheet = path.join(outDir(id), `${label}.png`);
  const args = [
    ...frames.flatMap((f) => ["-label", f.caption, f.output]),
    "-tile", "6x2",
    "-geometry", "+16+16",
    "-background", "#0B0B0C",
    "-fill", "#E8D5C9",
    "-font", "DejaVu-Sans",
    "-pointsize", "22",
    sheet,
  ];
  // order columns as scenes: row 1 = final frames, row 2 = build frames
  const finals = frames.filter((_, i) => i % 2 === 1);
  const builds = frames.filter((_, i) => i % 2 === 0);
  const ordered = [...finals, ...builds];
  args.splice(0, frames.length * 3, ...ordered.flatMap((f) => ["-label", f.caption, f.output]));
  execFileSync("montage", args);
  return sheet;
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/qc/contact-sheet.ts <job-id> [label]");
  contactSheet(id, process.argv[3]).then((p) => {
    console.log(`contact sheet → ${p}`);
    process.exit(0);
  });
}
