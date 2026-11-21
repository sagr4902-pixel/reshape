// Generates public/assets/brand/og.png (1200×630) from the club illustration and logo.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const b64 = (p, mime) => `data:${mime};base64,${readFileSync(p).toString('base64')}`;
const html = `<body style="margin:0;width:1200px;height:630px;background:#17181A;color:#F7F0E9;font-family:sans-serif;position:relative;overflow:hidden">
<img src="${b64('public/assets/scenes/club-landscape-dark.svg', 'image/svg+xml')}" style="position:absolute;right:-60px;top:60px;width:820px">
<div style="position:absolute;left:64px;top:64px"><img src="${b64('public/assets/brand/reshape-logo.png', 'image/png')}" style="height:64px"></div>
<div style="position:absolute;left:64px;bottom:150px;font:600 84px/0.95 'Arial Narrow',Arial,sans-serif;letter-spacing:.01em">DHAHRAN</div>
<div style="position:absolute;left:64px;bottom:118px;width:360px;height:6px;background:#FF5420;border-radius:3px"></div>
<div style="position:absolute;left:64px;bottom:64px;font:400 26px Arial,sans-serif;color:#B4ADA6">Calisthenics club · Concept visualization</div>
</body>`;
writeFileSync('/tmp/og.html', html);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.goto('file:///tmp/og.html');
await p.waitForTimeout(300);
await p.screenshot({ path: 'public/assets/brand/og.png' });
await b.close();
