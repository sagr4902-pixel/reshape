/**
 * Render a job.
 *
 *   npx tsx scripts/render.ts <job-id> preview   # 540×960, fast, for review
 *   npx tsx scripts/render.ts <job-id> final     # 1080×1920 master
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { jobDir, outDir } from "./lib/job";
import { video } from "./lib/render";

export const renderJob = async (id: string, mode: "preview" | "final") => {
  const timeline = JSON.parse(readFileSync(path.join(jobDir(id), "timeline.json"), "utf8"));
  mkdirSync(outDir(id), { recursive: true });
  const output = path.join(outDir(id), mode === "preview" ? `${id}-preview-540x960.mp4` : `${id}-1080x1920.mp4`);
  let last = -1;
  await video({
    compositionId: "Ad",
    inputProps: { timeline, muted: false },
    output,
    scale: mode === "preview" ? 0.5 : 1,
    crf: mode === "preview" ? 24 : 16,
    onProgress: (p) => {
      const pct = Math.floor(p * 10) * 10;
      if (pct !== last) {
        last = pct;
        process.stdout.write(`  ${mode} ${pct}%\n`);
      }
    },
  });
  return output;
};

if (process.argv[1] && import.meta.filename === path.resolve(process.argv[1])) {
  const [id, mode] = process.argv.slice(2) as [string, "preview" | "final"];
  if (!id || !["preview", "final"].includes(mode)) throw new Error("usage: tsx scripts/render.ts <job-id> preview|final");
  renderJob(id, mode).then((o) => {
    console.log(`rendered → ${o}`);
    process.exit(0);
  });
}
