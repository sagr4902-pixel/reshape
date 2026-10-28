/**
 * ElevenLabs integration (official SDK: @elevenlabs/elevenlabs-js).
 *
 *   npx tsx scripts/elevenlabs.ts check
 *   npx tsx scripts/elevenlabs.ts voices [search]
 *   npx tsx scripts/elevenlabs.ts tts   <job-id> [--yes]   # narration from job.voice.script → vo.mp3
 *   npx tsx scripts/elevenlabs.ts stt   <job-id> [--yes]   # blind transcription → vo-words.json
 *   npx tsx scripts/elevenlabs.ts sfx   <name> "<prompt>" [seconds] [--yes]  → public/sfx/<name>.mp3
 *   npx tsx scripts/elevenlabs.ts music <job-id> "<prompt>" [--yes]         → music.wav (plan permitting)
 *
 * Credentials: ELEVENLABS_API_KEY from the environment or a local .env file
 * (git-ignored). The key is never printed, logged or written anywhere.
 *
 * Credits: every command that spends credits prints what it would send and
 * stops unless --yes is passed.
 *
 * In Claude cloud sessions the API host may be blocked by network policy; the
 * same steps then run through the ElevenLabs connector (see docs/PIPELINE.md).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { jobDir, PUBLIC, readJob, ROOT } from "./lib/job";
import { checkPronunciation } from "./qc/check-pronunciation";

const envFile = path.join(ROOT, ".env");
if (!process.env.ELEVENLABS_API_KEY && existsSync(envFile)) process.loadEnvFile(envFile);

const client = () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY is not set. Put it in motion-studio/.env (see .env.example) or export it.");
    process.exit(2);
  }
  return new ElevenLabsClient({ apiKey });
};

const args = process.argv.slice(2);
const yes = args.includes("--yes");
const pos = args.filter((a) => !a.startsWith("--"));

const toBuffer = async (stream: ReadableStream<Uint8Array>) => Buffer.from(await new Response(stream).arrayBuffer());

const guard = (what: string) => {
  if (!yes) {
    console.log(`DRY RUN — would ${what}. Re-run with --yes to spend credits.`);
    process.exit(0);
  }
};

const main = async () => {
  const [cmd] = pos;
  if (cmd === "check") {
    const c = client();
    const user = await c.user.get();
    console.log(`✓ ElevenLabs reachable. Subscription tier: ${user.subscription?.tier ?? "unknown"}; characters used ${user.subscription?.characterCount ?? "?"}/${user.subscription?.characterLimit ?? "?"}`);
    return;
  }
  if (cmd === "voices") {
    const res = await client().voices.search({ search: pos[1] ?? "Saudi", pageSize: 30 });
    for (const v of res.voices) console.log(`${v.voiceId}  ${v.name}  ${JSON.stringify(v.labels ?? {})}`);
    return;
  }
  if (cmd === "tts") {
    const job = readJob(pos[1]);
    guard(`synthesise ${job.voice.script.length} characters with voice ${job.voice.voiceId} (${job.voice.model})`);
    const audio = await client().textToSpeech.convert(job.voice.voiceId, {
      text: job.voice.script,
      modelId: job.voice.model,
      languageCode: "ar",
      outputFormat: "mp3_44100_192",
    });
    const out = path.join(jobDir(job.id), job.voice.audio);
    writeFileSync(out, await toBuffer(audio));
    console.log(`✓ narration → ${out}`);
    console.log("Next: stt (blind transcription for timings + pronunciation), then build-timeline.");
    return;
  }
  if (cmd === "stt") {
    const job = readJob(pos[1]);
    const file = path.join(jobDir(job.id), job.voice.audio);
    guard(`transcribe ${file} with scribe_v1 (blind: audio only, no script)`);
    const res = await client().speechToText.convert({
      file: new Blob([readFileSync(file)], { type: "audio/mpeg" }),
      modelId: "scribe_v1",
      languageCode: "ar",
      timestampsGranularity: "word",
      tagAudioEvents: false,
    });
    const words = "words" in res ? res.words : [];
    const out = path.join(jobDir(job.id), job.voice.words);
    writeFileSync(out, JSON.stringify({ words, text: "text" in res ? res.text : "", method: "blind scribe_v1 via SDK" }, null, 2));
    console.log(`✓ ${words.length} words → ${out}`);
    const p = checkPronunciation(job.id);
    console.log(p.summary);
    return;
  }
  if (cmd === "sfx") {
    const [, name, prompt, secs] = pos;
    if (!name || !prompt) throw new Error('usage: sfx <name> "<prompt>" [seconds] --yes');
    guard(`generate sound effect "${name}" (${secs ?? "auto"}s): ${prompt}`);
    const audio = await client().textToSoundEffects.convert({ text: prompt, durationSeconds: secs ? Number(secs) : undefined, promptInfluence: 0.5 });
    const out = path.join(PUBLIC, "sfx", `${name}.mp3`);
    writeFileSync(out, await toBuffer(audio));
    console.log(`✓ sfx → ${out}`);
    return;
  }
  if (cmd === "music") {
    const job = readJob(pos[1]);
    const prompt = pos[2];
    if (!prompt) throw new Error('usage: music <job-id> "<prompt>" --yes');
    const tl = JSON.parse(readFileSync(path.join(jobDir(job.id), "timeline.json"), "utf8"));
    const ms = Math.round((tl.durationInFrames / tl.fps) * 1000);
    guard(`compose ${ms} ms of instrumental music: ${prompt} (check your plan's music licence terms first)`);
    const audio = await client().music.compose({ prompt, musicLengthMs: ms, forceInstrumental: true });
    const mp3 = path.join(jobDir(job.id), "music-elevenlabs.mp3");
    writeFileSync(mp3, await toBuffer(audio));
    execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", mp3, "-ar", "44100", "-ac", "2", path.join(jobDir(job.id), "music.wav")]);
    console.log(`✓ music → ${mp3} (converted to music.wav)`);
    return;
  }
  console.log(readFileSync(import.meta.filename, "utf8").split("*/")[0]);
};

main().catch((e) => {
  // never echo request headers / key
  console.error(`ElevenLabs error: ${e?.statusCode ?? ""} ${e?.message ?? e}`);
  process.exit(1);
});

