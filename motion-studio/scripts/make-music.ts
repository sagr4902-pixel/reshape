/**
 * Procedural music bed, arranged to the timeline.
 *
 *   npx tsx scripts/make-music.ts <job-id> [--bpm 100]
 *
 * The ElevenLabs connector available here has no music generation, and no
 * licensed track was supplied, so this synthesises an original bed from
 * scratch (sine/saw oscillators, noise, envelopes — no samples). It is owned
 * by construction. To use a licensed track instead, set job.music.src to that
 * file and skip this step.
 *
 * Arrangement follows the scenes: pad + sub under the hook, drums enter with
 * scene 2, drums drop out a beat before the brand reveal so the logo sting
 * lands in space, then the pad resolves.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { jobDir } from "./lib/job";

const SR = 44100;

type Tl = { fps: number; durationInFrames: number; scenes: { id: string; from: number }[] };

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// D minor: i – VI – III – VII  (Dm – Bb – F – C)
const CHORDS = [
  [50, 53, 57], // D3 F3 A3
  [46, 50, 53], // Bb2 D3 F3
  [53, 57, 60], // F3 A3 C4
  [48, 52, 55], // C3 E3 G3
];
const ROOTS = [38, 34, 41, 36]; // D2 Bb1 F2 C2

export const makeMusic = (id: string, bpm = 100) => {
  const tl: Tl = JSON.parse(readFileSync(path.join(jobDir(id), "timeline.json"), "utf8"));
  const seconds = tl.durationInFrames / tl.fps + 0.5;
  const N = Math.ceil(seconds * SR);
  const L = new Float32Array(N);
  const R = new Float32Array(N);

  const beat = 60 / bpm;
  const bar = beat * 4;
  const chordLen = bar * 2;
  const sceneStart = (i: number) => (tl.scenes[i]?.from ?? 0) / tl.fps;
  const drumsIn = sceneStart(1);
  const dropAt = sceneStart(tl.scenes.length - 1) - beat * 0.5; // silence before the logo
  const end = seconds - 0.5;

  // deterministic noise
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  };

  // ── pad: detuned band-limited saws, slow filter LFO ──
  let lp1 = 0;
  let lp2 = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const ci = Math.floor(t / chordLen) % CHORDS.length;
    const local = t % chordLen;
    const xf = Math.min(1, local / 0.35); // chord crossfade
    const prev = CHORDS[(ci + CHORDS.length - 1) % CHORDS.length];
    let s = 0;
    for (const [notes, g] of [[CHORDS[ci], xf], [prev, 1 - xf]] as const) {
      if (g <= 0) continue;
      for (const n of notes) {
        for (const det of [-0.07, 0, 0.07]) {
          const f = midi(n + det);
          const ph = 2 * Math.PI * f * t;
          // 8 harmonics is plenty under a ~1.4 kHz filter
          let saw = 0;
          for (let h = 1; h <= 8; h++) saw += Math.sin(h * ph) / h;
          s += saw * g;
        }
      }
    }
    s /= 9;
    const cutoff = 700 + 500 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.09 * t));
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
    lp1 += a * (s - lp1);
    lp2 += a * (lp1 - lp2);
    const swell = Math.min(1, t / 2.5);
    const fadeOut = t > end - 1.2 ? Math.max(0, (end - t) / 1.2) : 1;
    const v = lp2 * 0.55 * swell * fadeOut;
    L[i] += v * 0.9;
    R[i] += v * 1.0;
  }

  // ── drums + sub, from scene 2 until the drop ──
  const kickEnv = new Float32Array(N);
  const addKick = (t0: number, gain = 1) => {
    const i0 = Math.floor(t0 * SR);
    let ph = 0;
    for (let k = 0; k < SR * 0.45 && i0 + k < N; k++) {
      const t = k / SR;
      const f = 48 + 110 * Math.exp(-t / 0.035);
      ph += (2 * Math.PI * f) / SR;
      const env = Math.exp(-t / 0.16);
      const click = k < 60 ? rnd() * 0.5 * (1 - k / 60) : 0;
      const v = (Math.sin(ph) * env + click) * 0.95 * gain;
      L[i0 + k] += v;
      R[i0 + k] += v;
      kickEnv[i0 + k] = Math.max(kickEnv[i0 + k], env);
    }
  };
  const addHat = (t0: number, gain: number) => {
    const i0 = Math.floor(t0 * SR);
    let prev = 0;
    for (let k = 0; k < SR * 0.06 && i0 + k < N; k++) {
      const n = rnd();
      const hp = n - prev; // crude high-pass
      prev = n;
      const v = hp * Math.exp(-(k / SR) / 0.018) * gain;
      L[i0 + k] += v * 0.8;
      R[i0 + k] += v;
    }
  };

  for (let t = drumsIn; t < dropAt; t += beat) {
    const beatInBar = Math.round(((t - drumsIn) / beat) % 4);
    if (beatInBar === 0 || beatInBar === 2) addKick(t);
    if (beatInBar === 1) addKick(t + beat * 0.5, 0.55);
    addHat(t + beat * 0.5, 0.16);
    addHat(t, 0.06);
  }
  // one resolving kick under the logo sting
  addKick(sceneStart(tl.scenes.length - 1) + 0.37, 0.8);

  // sub bass follows the chord root, pumped by the kick
  let sp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    if (t < 0.6) continue;
    const ci = Math.floor(t / chordLen) % ROOTS.length;
    sp += (2 * Math.PI * midi(ROOTS[ci] + 12)) / SR;
    const active = t >= drumsIn && t < dropAt ? 1 : 0.45;
    const pump = 1 - 0.85 * kickEnv[i];
    const fadeOut = t > end - 1.2 ? Math.max(0, (end - t) / 1.2) : 1;
    const v = Math.tanh(Math.sin(sp) * 1.6) * 0.22 * active * pump * Math.min(1, t / 1.5) * fadeOut;
    L[i] += v;
    R[i] += v;
  }

  // ── master: soft clip, normalise to -3 dBFS peak ──
  let peak = 0;
  for (let i = 0; i < N; i++) {
    L[i] = Math.tanh(L[i] * 1.2);
    R[i] = Math.tanh(R[i] * 1.2);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const norm = 0.708 / (peak || 1);

  const out = Buffer.alloc(44 + N * 4);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + N * 4, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) {
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
  }
  const file = path.join(jobDir(id), "music.wav");
  writeFileSync(file, out);
  return { file, seconds, drumsIn, dropAt };
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/make-music.ts <job-id> [--bpm N]");
  const bpmArg = process.argv.indexOf("--bpm");
  const r = makeMusic(id, bpmArg > 0 ? Number(process.argv[bpmArg + 1]) : 100);
  console.log(`music → ${r.file} (${r.seconds.toFixed(1)}s, drums ${r.drumsIn.toFixed(2)}–${r.dropAt.toFixed(2)}s)`);
}
