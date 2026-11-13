// Bundle once, render many stills: node scripts/stills.mjs <compositionId> <outDir> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [, , id, outDir, ...frames] = process.argv;
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const f of frames) {
  const out = path.join(outDir, `${id}_${String(f).padStart(4, '0')}.jpg`);
  const t0 = Date.now();
  await renderStill({serveUrl, composition, frame: Number(f), output: out, imageFormat: 'jpeg', jpegQuality: 90, browserExecutable, overwrite: true});
  console.log(out, `${Date.now() - t0}ms`);
}
