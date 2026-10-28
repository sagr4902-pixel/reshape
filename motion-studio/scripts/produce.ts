/**
 * End-to-end production for a job whose narration already exists.
 *
 *   npx tsx scripts/produce.ts <job-id> [--stop-after=sheet|preview] [--skip-final]
 *
 *   1. pronunciation check on the blind transcript (fails → stop)
 *   2. timeline from real audio timings
 *   3. QUALITY GATE 1: static contact sheet → out/<id>/contact-sheet.png
 *   4. music bed (unless job.music is null or a licensed music.wav is supplied)
 *   5. FFmpeg mix → mix.wav (-14 LUFS, -1 dBTP)
 *   6. QUALITY GATE 2: 540×960 preview + automated video QC
 *   7. final 1080×1920 master + QUALITY GATE 3 video QC
 *
 * The narration step (and its blind transcription) comes first and is done
 * either with `scripts/elevenlabs.ts tts|stt` or the ElevenLabs connector.
 * Gate 1 and the preview frames are also reviewed visually by Claude before
 * the final render; this script produces the evidence and blocks on the
 * automated checks.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildTimeline } from "./build-timeline";
import { jobDir, outDir, readJob } from "./lib/job";
import { makeMusic } from "./make-music";
import { mixAudio } from "./mix-audio";
import { checkPronunciation } from "./qc/check-pronunciation";
import { contactSheet } from "./qc/contact-sheet";
import { inspectVideo } from "./qc/inspect-video";
import { renderJob } from "./render";

const step = (n: number, s: string) => console.log(`\n[${n}] ${s}`);

const main = async () => {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/produce.ts <job-id> [--stop-after=sheet|preview] [--skip-final]");
  const stopAfter = process.argv.find((a) => a.startsWith("--stop-after="))?.split("=")[1];
  const job = readJob(id);
  const log: Record<string, unknown> = { id, startedAt: new Date().toISOString() };

  step(1, "pronunciation (blind transcript)");
  const p = checkPronunciation(id);
  console.log(p.summary);
  log.pronunciation = p;
  if (!p.passed) throw new Error("Pronunciation gate failed — regenerate narration (adjust spelling/IPA) before producing.");

  step(2, "timeline");
  let tl = buildTimeline(id);
  console.log(`${tl.scenes.length} scenes, ${(tl.durationInFrames / tl.fps).toFixed(2)}s`);

  step(3, "QUALITY GATE 1 — contact sheet");
  log.contactSheet = await contactSheet(id);
  console.log(log.contactSheet);
  if (stopAfter === "sheet") return finish(id, log);

  step(4, "music");
  const musicFile = path.join(jobDir(id), "music.wav");
  if (job.music === null) console.log("job has no music");
  else if (existsSync(musicFile) && !(job.music as { generator?: string } | undefined)?.generator) console.log("using supplied music.wav");
  else console.log(makeMusic(id).file);

  step(5, "mix");
  const m = mixAudio(id);
  console.log(`${m.out} (pre-norm ${m.measured.input_i} LUFS)`);
  tl = buildTimeline(id); // picks up mix.wav

  step(6, "QUALITY GATE 2 — preview render + QC");
  const preview = await renderJob(id, "preview");
  const q2 = inspectVideo(id, preview, "qc-preview");
  for (const c of q2.checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`);
  log.preview = { file: preview, passed: q2.passed, frames: q2.frames };
  if (!q2.passed) throw new Error("Preview QC failed — fix and re-run.");
  if (stopAfter === "preview" || process.argv.includes("--skip-final")) return finish(id, log);

  step(7, "final render + QUALITY GATE 3");
  const final = await renderJob(id, "final");
  const q3 = inspectVideo(id, final, "qc-final");
  for (const c of q3.checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`);
  log.final = { file: final, passed: q3.passed, frames: q3.frames };
  if (!q3.passed) throw new Error("Final QC failed.");
  return finish(id, log);
};

const finish = (id: string, log: Record<string, unknown>) => {
  log.finishedAt = new Date().toISOString();
  writeFileSync(path.join(outDir(id), "production-log.json"), JSON.stringify(log, null, 2));
  console.log(`\nlog → ${path.join(outDir(id), "production-log.json")}`);
  process.exit(0);
};

main().catch((e) => {
  console.error(`\n✗ ${e.message}`);
  process.exit(1);
});

