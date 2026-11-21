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
  ['explore-zone', '/explore?zone=rig'],
  ['memberships', '/memberships'],
  ['register', '/register?program=calisthenics&zone=rig&src=explorer'],
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
      await p.goto(base + '/' + l + path, { waitUntil: 'load' });
      // Scroll through the page so lazy-loaded images are present in the capture. Jumps must be instant:
      // the site scrolls smoothly, and a capture taken mid-animation draws the sticky header in the wrong place.
      await p.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      await p.waitForFunction(() => window.scrollY === 0 && Array.from(document.images).every((i) => !i.currentSrc || i.complete));
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}/${name}-${l}-${sn}.png`, fullPage: true });
    }
    await ctx.close();
  }
await b.close();
console.log('done');
