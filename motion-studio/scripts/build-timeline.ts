/**
 * job.json + real narration word timings  →  timeline.json
 *
 *   npx tsx scripts/build-timeline.ts <job-id>
 *
 * Each scene starts just before its anchor word is spoken and ends where the
 * next scene starts. Every named cue resolves to the frame its word begins.
 * Nothing is timed by hand: change the narration and re-run this.
 */
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { jobDir, norm, publicRel, readJob, readWords, SttWord } from "./lib/job";

const SFX: Record<string, { src: string; gainDb: number; leadFrames: number }> = {
  whoosh: { src: "sfx/whoosh.mp3", gainDb: -10, leadFrames: 2 },
  hit: { src: "sfx/hit.mp3", gainDb: -4, leadFrames: 0 },
  tick: { src: "sfx/tick.mp3", gainDb: 4, leadFrames: 0 },
  logo: { src: "sfx/logo-sting.mp3", gainDb: -5, leadFrames: 2 },
};

export const buildTimeline = (id: string) => {
  const job = readJob(id);
  const words = readWords(job);
  const { fps, width, height, tailSeconds, leadInSeconds, transitionFrames } = job.format;
  const toFrame = (s: number) => Math.round(s * fps);

  const find = (token: string, from: number, to = words.length): number => {
    const t = norm(token);
    for (let i = from; i < to; i++) {
      const w = norm(words[i].text);
      if (w === t || w.startsWith(t)) return i;
    }
    return -1;
  };

  // 1. anchor every scene, in order
  const anchors: number[] = [];
  let cursor = 0;
  for (const s of job.scenes) {
    const i = find(s.anchor, cursor);
    if (i < 0) throw new Error(`Scene "${s.id}": anchor "${s.anchor}" not found in narration after word ${cursor}`);
    anchors.push(i);
    cursor = i + 1;
  }

  const audioEnd = words[words.length - 1].end;
  const total = toFrame(audioEnd + tailSeconds);
  const starts = anchors.map((a, i) => (i === 0 ? 0 : toFrame(words[a].start - leadInSeconds)));

  const sfx: { kind: string; src: string; frame: number; gainDb: number }[] = [];

  const scenes = job.scenes.map((s, i) => {
    const from = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : total;
    const wordEnd = i + 1 < anchors.length ? anchors[i + 1] : words.length;
    const sceneWords: SttWord[] = words.slice(anchors[i], wordEnd);

    const cues: Record<string, number> = {};
    for (const [name, token] of Object.entries(s.cues)) {
      // "@N": an unspoken visual beat, N frames after the scene starts (labels, titles)
      if (token.startsWith("@")) {
        cues[name] = Number(token.slice(1));
        continue;
      }
      const wi = find(token, anchors[i], wordEnd);
      if (wi < 0) throw new Error(`Scene "${s.id}": cue "${name}" → "${token}" not spoken inside this scene`);
      cues[name] = toFrame(words[wi].start) - from;
    }

    for (const e of s.sfx ?? []) {
      const def = SFX[e.kind];
      if (!def) throw new Error(`Unknown sfx kind ${e.kind}`);
      if (cues[e.cue] === undefined) throw new Error(`Scene "${s.id}": sfx cue "${e.cue}" undefined`);
      sfx.push({ kind: e.kind, src: def.src, gainDb: def.gainDb, frame: Math.max(0, from + cues[e.cue] - def.leadFrames + (e.offsetFrames ?? 0)) });
    }
    if (i > 0) sfx.push({ kind: "whoosh", src: SFX.whoosh.src, gainDb: SFX.whoosh.gainDb, frame: Math.max(0, from - SFX.whoosh.leadFrames) });

    return {
      id: s.id,
      template: s.template,
      from,
      durationInFrames: end - from,
      cues,
      words: sceneWords.map((w) => ({ text: w.text, from: toFrame(w.start) - from, to: toFrame(w.end) - from })),
      props: s.props,
    };
  });

  for (const sc of scenes) {
    if (sc.durationInFrames < 45) console.warn(`⚠ scene ${sc.id} is only ${sc.durationInFrames} frames`);
  }

  const mixFile = path.join(jobDir(id), "mix.wav");
  const timeline = {
    id,
    fps,
    width,
    height,
    durationInFrames: total,
    transitionFrames,
    audio: { mix: existsSync(mixFile) ? publicRel(id, "mix.wav") : null, voice: publicRel(id, job.voice.audio) },
    scenes,
    sfx: sfx.sort((a, b) => a.frame - b.frame),
  };
  writeFileSync(path.join(jobDir(id), "timeline.json"), JSON.stringify(timeline, null, 2));
  return timeline;
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/build-timeline.ts <job-id>");
  const t = buildTimeline(id);
  console.log(`timeline ${t.id}: ${t.durationInFrames} frames (${(t.durationInFrames / t.fps).toFixed(2)}s), ${t.scenes.length} scenes, ${t.sfx.length} sfx`);
  for (const s of t.scenes) console.log(`  ${s.id.padEnd(8)} ${s.template.padEnd(17)} from ${String(s.from).padStart(4)}  len ${String(s.durationInFrames).padStart(4)}  cues ${JSON.stringify(s.cues)}`);
}
