// Dev helper: rasterise an SVG file for visual review.  node scripts/dev/shot.mjs <svg> <png> [bg] [width]
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
const [, , file, out, bg = '#17181A', w = '1300'] = process.argv;
const html = out + '.html';
writeFileSync(html, `<body style="margin:0;background:${bg}"><img src="file://${file}" style="width:100%;display:block"></body>`);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 800 } });
await p.goto('file://' + html);
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
await b.close();
