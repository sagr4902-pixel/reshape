/**
 * Brand pronunciation check on a BLIND transcript of the narration.
 *
 *   npx tsx scripts/qc/check-pronunciation.ts <job-id>
 *
 * RESHAPE must be said "رِي شَيْب" (ree-shape) — not "ريشيب" or "ريشاب".
 * The script writes the brand as رِي شَيْب; a speech-to-text model that is
 * given only the audio should then hear the English word "Reshape" (or the
 * two-word Arabic spelling). Hearing the wrong vowel or a fused word fails.
 *
 * Important: this is only meaningful if the transcript came from audio alone.
 * A transcript that echoes the TTS prompt (tags such as [pause] survive, or
 * diacritics identical to the script) is alignment, not listening — the check
 * refuses to pass in that case. It is an automated proxy, not a human listen.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { jobDir, norm, outDir, readJob, readWords } from "../lib/job";

const ACCEPT = ["reshape", "ري شيب"];
const REJECT = ["ريشيب", "ريشاب", "ريشب", "reshab", "resheeb"];

export const checkPronunciation = (id: string) => {
  const job = readJob(id);
  const raw = readFileSync(path.join(jobDir(id), job.voice.words), "utf8");
  const words = readWords(job);
  const expected = (job.voice.script.match(/رِي\s*شَيْب|ري\s*شيب|RESHAPE/gi) ?? []).length;

  const echoed = /\[(pause|confident|warmly)[^\]]*\]/.test(raw) || raw.includes("رِي شَيْب");
  const tokens = words.map((w) => norm(w.text));
  const hits: { at: number; heard: string; ok: boolean }[] = [];
  tokens.forEach((t, i) => {
    const pair = `${t} ${tokens[i + 1] ?? ""}`.trim();
    if (ACCEPT.includes(t) || ACCEPT.includes(pair)) hits.push({ at: words[i].start, heard: words[i].text, ok: true });
    else if (REJECT.includes(t)) hits.push({ at: words[i].start, heard: words[i].text, ok: false });
  });

  const passed = !echoed && hits.length === expected && hits.every((h) => h.ok);
  const summary = echoed
    ? "✗ pronunciation: transcript echoes the TTS prompt — not an independent check. Re-transcribe the audio file blind."
    : `${passed ? "✓" : "✗"} pronunciation: expected ${expected} brand mention(s), heard ${hits.map((h) => `"${h.heard}"@${h.at}s${h.ok ? "" : " (WRONG)"}`).join(", ") || "none"}`;
  const report = { id, passed, echoed, expected, hits, method: "blind speech-to-text proxy (not a human listening test)" };
  mkdirSync(outDir(id), { recursive: true });
  writeFileSync(path.join(outDir(id), "pronunciation.json"), JSON.stringify(report, null, 2));
  return { ...report, summary };
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const id = process.argv[2];
  if (!id) throw new Error("usage: tsx scripts/qc/check-pronunciation.ts <job-id>");
  const r = checkPronunciation(id);
  console.log(r.summary);
  process.exit(r.passed ? 0 : 1);
}
