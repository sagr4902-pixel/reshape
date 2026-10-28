/**
 * Final audio mix with FFmpeg.
 *
 *   npx tsx scripts/mix-audio.ts <job-id>
 *
 *  voice  → high-pass 80 Hz, gentle compression, centred
 *  music  → ducked under the voice with a sidechain compressor
 *  sfx    → placed at the frames in timeline.sfx, per-kind gain
 *  master → two-pass EBU R128 loudnorm to -14 LUFS / -1 dBTP, 48 kHz stereo
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { sound } from "../src/brand/tokens";
import { jobDir, PUBLIC, readJob } from "./lib/job";

export const mixAudio = (id: string) => {
  const job = readJob(id);
  const dir = jobDir(id);
  const tl = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8"));
  const voice = path.join(dir, job.voice.audio);
  const music = path.join(dir, "music.wav");
  const out = path.join(dir, "mix.wav");
  const seconds = tl.durationInFrames / tl.fps;

  const inputs: string[] = ["-i", voice];
  const hasMusic = existsSync(music);
  if (hasMusic) inputs.push("-i", music);
  const sfx: { src: string; frame: number; gainDb: number }[] = tl.sfx;
  for (const e of sfx) inputs.push("-i", path.join(PUBLIC, e.src));

  const f: string[] = [];
  f.push(`[0:a]aresample=48000,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,pan=stereo|c0=c0|c1=c0,asplit=2[vo][vokey]`);
  let n = 1;
  const mixIns = ["[vo]"];
  if (hasMusic) {
    f.push(`[1:a]aresample=48000,volume=${sound.musicBedDb}dB[mus]`);
    f.push(`[mus][vokey]sidechaincompress=threshold=0.02:ratio=8:attack=30:release=450:makeup=1[duck]`);
    mixIns.push("[duck]");
    n = 2;
  } else {
    f.push(`[vokey]anullsink`);
  }
  sfx.forEach((e, i) => {
    const ms = Math.round((e.frame / tl.fps) * 1000);
    f.push(`[${n + i}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,volume=${sound.sfxDb + e.gainDb}dB,adelay=${ms}|${ms}[s${i}]`);
    mixIns.push(`[s${i}]`);
  });
  f.push(`${mixIns.join("")}amix=inputs=${mixIns.length}:normalize=0:dropout_transition=0,atrim=0:${seconds.toFixed(3)},apad=whole_dur=${seconds.toFixed(3)}[pre]`);

  const graph = (tail: string) => [...f, tail].join(";");

  // pass 1: measure (loudnorm prints its JSON report on stderr)
  const probe = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", ...inputs, "-filter_complex", graph(`[pre]loudnorm=I=${sound.targetLufs}:TP=${sound.truePeakDb}:LRA=11:print_format=json[o]`), "-map", "[o]", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  if (probe.status !== 0) throw new Error(probe.stderr);
  const log = probe.stderr;
  const m = JSON.parse(log.slice(log.lastIndexOf("{"), log.lastIndexOf("}") + 1));

  // pass 2: apply with measured values (linear normalisation where possible)
  const ln = `loudnorm=I=${sound.targetLufs}:TP=${sound.truePeakDb}:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...inputs, "-filter_complex", graph(`[pre]${ln},aresample=48000[o]`), "-map", "[o]", "-c:a", "pcm_s16le", out]);
  return { out, measured: m };
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/mix-audio.ts <job-id>");
  const r = mixAudio(id);
  console.log(`mix → ${r.out}  (pre-norm ${r.measured.input_i} LUFS, ${r.measured.input_tp} dBTP)`);
}
