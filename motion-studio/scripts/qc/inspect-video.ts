/**
 * QUALITY GATE 2/3 — inspect a rendered MP4.
 *
 *   npx tsx scripts/qc/inspect-video.ts <job-id> <file.mp4> [label]
 *
 * Checks (fails the gate on any ✗):
 *  - container/codec/size/fps/pixel format match the timeline
 *  - duration within one frame of the timeline; audio and video streams aligned
 *  - no unexpected black frames (blackdetect)
 *  - no frozen stretch longer than allowed, except the final logo hold (freezedetect)
 *  - integrated loudness and true peak within delivery targets (ebur128)
 * Writes <label>.json + <label>-frames.png (frames pulled from the *encoded*
 * file at every scene's settled frame and at every transition midpoint).
 */
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sound } from "../../src/brand/tokens";
import { jobDir, outDir } from "../lib/job";

type Check = { name: string; ok: boolean; detail: string };

const ff = (args: string[]) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8" }).stderr;

export const inspectVideo = (id: string, file: string, label = "qc") => {
  const tl = JSON.parse(readFileSync(path.join(jobDir(id), "timeline.json"), "utf8"));
  const dir = outDir(id);
  mkdirSync(dir, { recursive: true });
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });

  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], { encoding: "utf8" }));
  const v = probe.streams.find((s: { codec_type: string }) => s.codec_type === "video");
  const a = probe.streams.find((s: { codec_type: string }) => s.codec_type === "audio");
  const [num, den] = String(v.r_frame_rate).split("/").map(Number);
  const fps = num / den;
  const expectedSec = tl.durationInFrames / tl.fps;
  const scale = v.width / tl.width;

  add("video codec h264", v.codec_name === "h264", v.codec_name);
  add("pixel format yuv420p", v.pix_fmt === "yuv420p", v.pix_fmt);
  add("aspect 9:16 preserved", Math.abs(v.width / v.height - tl.width / tl.height) < 0.002, `${v.width}x${v.height} (scale ${scale})`);
  add("frame rate", Math.abs(fps - tl.fps) < 0.01, `${fps}`);
  add("audio stream present (aac)", !!a && a.codec_name === "aac", a ? `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch` : "none");
  const dur = Number(probe.format.duration);
  add("duration matches timeline", Math.abs(dur - expectedSec) <= 1.5 / tl.fps, `${dur.toFixed(3)}s vs ${expectedSec.toFixed(3)}s`);
  if (a) add("audio/video aligned", Math.abs(Number(a.duration) - Number(v.duration)) < 0.1, `a ${Number(a.duration).toFixed(3)} / v ${Number(v.duration).toFixed(3)}`);

  // black frames
  const black = [...ff(["-i", file, "-vf", "blackdetect=d=0.08:pic_th=0.985:pix_th=0.06", "-an", "-f", "null", "-"]).matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  add("no black frames", black.length === 0, black.length ? JSON.stringify(black) : "none");

  // frozen stretches: allow the final hold (last scene's tail)
  const lastScene = tl.scenes[tl.scenes.length - 1];
  const holdFrom = (lastScene.from + Math.max(...(Object.values(lastScene.cues) as number[]))) / tl.fps;
  const freezeLog = ff(["-i", file, "-vf", "freezedetect=n=0.0008:d=1.2", "-an", "-f", "null", "-"]);
  const starts = [...freezeLog.matchAll(/freeze_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const durs = [...freezeLog.matchAll(/freeze_duration: ([\d.]+)/g)].map((m) => Number(m[1]));
  const freezes = starts.map((s, i) => ({ start: s, duration: durs[i] ?? expectedSec - s }));
  const badFreezes = freezes.filter((f) => f.start < holdFrom - 0.2);
  add("no frozen stretches mid-ad (>1.2s)", badFreezes.length === 0, JSON.stringify(freezes));

  // loudness
  const loud = ff(["-i", file, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const I = Number(/I:\s+(-?[\d.]+) LUFS/.exec(loud.slice(loud.lastIndexOf("Summary")))?.[1]);
  const TP = Number(/Peak:\s+(-?[\d.]+) dBFS/.exec(loud.slice(loud.lastIndexOf("Summary")))?.[1]);
  add("integrated loudness", Math.abs(I - sound.targetLufs) <= 1, `${I} LUFS (target ${sound.targetLufs})`);
  add("true peak", TP <= sound.truePeakDb + 0.3, `${TP} dBFS (max ${sound.truePeakDb})`);

  // sample frames from the encoded file
  const frameDir = path.join(dir, `${label}-frames`);
  mkdirSync(frameDir, { recursive: true });
  const samples: { t: number; label: string }[] = [];
  tl.scenes.forEach((s: { id: string; from: number; durationInFrames: number; cues: Record<string, number> }, i: number) => {
    const last = Math.max(0, ...Object.values(s.cues));
    const settled = Math.min(s.from + s.durationInFrames - 2, s.from + last + 18);
    samples.push({ t: settled / tl.fps, label: `${i + 1} ${s.id} settled` });
    if (i > 0) samples.push({ t: (s.from + tl.transitionFrames / 2) / tl.fps, label: `${i + 1} wipe mid` });
  });
  samples.sort((x, y) => x.t - y.t);
  const files = samples.map((s, i) => {
    const out = path.join(frameDir, `${String(i).padStart(2, "0")}.png`);
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-ss", s.t.toFixed(3), "-i", file, "-frames:v", "1", "-vf", "scale=360:-1", out]);
    return { out, caption: `${s.label} · ${s.t.toFixed(2)}s` };
  });
  const sheet = path.join(dir, `${label}-frames.png`);
  execFileSync("montage", [...files.flatMap((f) => ["-label", f.caption, f.out]), "-tile", `${Math.ceil(files.length / 2)}x2`, "-geometry", "+10+10", "-background", "#0B0B0C", "-fill", "#E8D5C9", "-pointsize", "16", sheet]);

  const passed = checks.every((c) => c.ok);
  const report = { id, file, label, passed, checks, frames: sheet, loudness: { I, TP }, freezes, black };
  writeFileSync(path.join(dir, `${label}.json`), JSON.stringify(report, null, 2));
  return report;
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const [id, file, label] = process.argv.slice(2);
  if (!id || !file) throw new Error("usage: tsx scripts/qc/inspect-video.ts <job-id> <file.mp4> [label]");
  const r = inspectVideo(id, path.resolve(file), label);
  for (const c of r.checks) console.log(`${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`);
  console.log(`${r.passed ? "PASS" : "FAIL"} · frames → ${r.frames}`);
  process.exit(r.passed ? 0 : 1);
}
