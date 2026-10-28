/**
 * Verify the production toolchain before a job.
 *
 *   npx tsx scripts/verify-tools.ts
 *
 * Never prints secret values — only whether they are present.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC, ROOT } from "./lib/job";
import { browserExecutable } from "./lib/render";

type Row = { tool: string; ok: boolean; detail: string; required: boolean };
const rows: Row[] = [];
const check = (tool: string, required: boolean, fn: () => string) => {
  try {
    rows.push({ tool, ok: true, detail: fn(), required });
  } catch (e) {
    rows.push({ tool, ok: false, detail: String((e as Error).message).split("\n")[0], required });
  }
};
const sh = (cmd: string, args: string[]) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const pkg = (name: string) => JSON.parse(readFileSync(path.join(ROOT, "node_modules", name, "package.json"), "utf8")).version as string;

check("node", true, () => process.version);
check("remotion", true, () => `remotion ${pkg("remotion")}, @remotion/renderer ${pkg("@remotion/renderer")}`);
check("remotion agent skills", true, () => {
  const dir = path.join(ROOT, "..", ".agents", "skills");
  const skills = readdirSync(dir).filter((d) => d.startsWith("remotion"));
  if (skills.length < 10) throw new Error(`only ${skills.length} remotion skills in ${dir}`);
  return `${skills.length} skills (${dir})`;
});
check("render browser", true, () => browserExecutable ?? "Remotion-managed Chrome (downloads on first render)");
check("ffmpeg", true, () => sh("ffmpeg", ["-version"]).split("\n")[0]);
check("ffprobe", true, () => sh("ffprobe", ["-version"]).split("\n")[0]);
check("ffmpeg filters", true, () => {
  const f = sh("ffmpeg", ["-hide_banner", "-filters"]);
  const need = ["loudnorm", "ebur128", "sidechaincompress", "blackdetect", "freezedetect", "silencedetect", "amix"];
  const missing = need.filter((n) => !f.includes(` ${n} `));
  if (missing.length) throw new Error(`missing: ${missing.join(", ")}`);
  return need.join(", ");
});
check("imagemagick (contact sheets)", true, () => sh("montage", ["-version"]).split("\n")[0]);
check("lucide icons", true, () => `lucide-react ${pkg("lucide-react")}`);
check("elevenlabs sdk", true, () => `@elevenlabs/elevenlabs-js ${pkg("@elevenlabs/elevenlabs-js")}`);
check("ELEVENLABS_API_KEY", false, () => {
  const env = path.join(ROOT, ".env");
  const inEnv = existsSync(env) && /^ELEVENLABS_API_KEY=.+/m.test(readFileSync(env, "utf8"));
  if (!process.env.ELEVENLABS_API_KEY && !inEnv) throw new Error("not set — SDK commands unavailable; use the ElevenLabs connector instead");
  return "present (value not shown)";
});
check("brand fonts", true, () => {
  const n = readdirSync(path.join(ROOT, "src", "brand", "fonts")).filter((f) => f.endsWith(".woff2")).length;
  if (n < 20) throw new Error(`only ${n} font files`);
  return `${n} woff2 files (Zain, IBM Plex Sans Arabic, Barlow Semi Condensed)`;
});
check("brand logos", true, () => {
  const need = ["logo-primary-red.png", "logo-mark-red.png", "wordmark-sand.png", "badge-sand.png"];
  const missing = need.filter((f) => !existsSync(path.join(PUBLIC, "brand", f)));
  if (missing.length) throw new Error(`missing ${missing.join(", ")}`);
  return need.join(", ");
});
check("brand sfx", false, () => {
  const need = ["whoosh.mp3", "hit.mp3", "tick.mp3", "logo-sting.mp3"];
  const missing = need.filter((f) => !existsSync(path.join(PUBLIC, "sfx", f)));
  if (missing.length) throw new Error(`missing ${missing.join(", ")}`);
  return need.join(", ");
});

for (const r of rows) console.log(`${r.ok ? "✓" : r.required ? "✗" : "•"} ${r.tool.padEnd(30)} ${r.detail}`);
const failed = rows.filter((r) => !r.ok && r.required);
console.log(failed.length ? `\n${failed.length} required tool(s) missing.` : "\nToolchain ready.");
process.exit(failed.length ? 1 : 0);
