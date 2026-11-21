// Dev helper: evaluate an expression in a page.  node scripts/dev/eval.mjs <url> '<js expr>' [width]
import { chromium } from '@playwright/test';
const [, , url, expr, w = '1440'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' });
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
await b.close();
