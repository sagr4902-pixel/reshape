// Dev helper: capture the visual-review screenshot set from a running server.
//   node scripts/dev/review.mjs <baseUrl> <outDir>
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
const [, , base = 'http://localhost:3100', out = 'docs/qa/screenshots'] = process.argv;
mkdirSync(out, { recursive: true });
const pages = [
  ['home', ''],
  ['kids', '/kids'],
  ['explore', '/explore'],
  ['explore-zone', '/explore?zone=track-loop'],
  ['memberships', '/memberships'],
  ['register', '/register?program=kids&zone=kids-pavilion&src=explorer'],
  ['calisthenics', '/programs/calisthenics'],
  ['football', '/football-performance'],
  ['contact', '/contact'],
];
const sizes = [
  ['d', 1440, 900],
  ['m', 390, 844],
];
const b = await chromium.launch();
for (const l of ['ar', 'en'])
  for (const [sn, w, h] of sizes) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    for (const [name, path] of pages) {
      await p.goto(base + '/' + l + path, { waitUntil: 'networkidle' });
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${out}/${name}-${l}-${sn}.png`, fullPage: true });
    }
    await ctx.close();
  }
await b.close();
console.log('done');
