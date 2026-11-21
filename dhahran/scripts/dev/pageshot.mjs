// Dev helper: screenshot a running page.  node scripts/dev/pageshot.mjs <url> <png> [width] [height] [full]
import { chromium } from '@playwright/test';
const [, , url, out, w = '1440', h = '900', full = 'full'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
p.on('pageerror', (e) => errs.push(String(e)));
await p.goto(url, { waitUntil: 'networkidle' });
await p.screenshot({ path: out, fullPage: full === 'full' });
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(JSON.stringify({ url, overflow, errs }));
await b.close();
