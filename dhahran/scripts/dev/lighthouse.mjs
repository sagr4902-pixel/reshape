// Runs Lighthouse (mobile preset, simulated throttling) 3× per URL against a running
// production build and writes medians to docs/qa/lighthouse.json.
//   node scripts/dev/lighthouse.mjs http://localhost:3100
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
const base = process.argv[2] ?? 'http://localhost:3100';
const routes = ['/ar', '/en', '/ar/kids', '/ar/programs/calisthenics', '/ar/memberships', '/ar/explore'];
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const out = { base, tool: '', date: new Date().toISOString(), runsPerUrl: 3, preset: 'mobile (default), simulated throttling', results: {} };
mkdirSync('/tmp/lh', { recursive: true });
for (const r of routes) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const file = `/tmp/lh/run.json`;
    execFileSync('npx', ['lighthouse', base + r, '--quiet', '--output=json', `--output-path=${file}`, '--only-categories=performance,accessibility,best-practices,seo', '--chrome-flags=--headless=new --no-sandbox'], {
      stdio: 'ignore',
      env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium' },
    });
    const j = JSON.parse(readFileSync(file, 'utf8'));
    out.tool = `lighthouse ${j.lighthouseVersion}, ${j.environment.hostUserAgent.match(/Chrome\/[\d.]+/)?.[0]}`;
    runs.push({
      performance: Math.round(j.categories.performance.score * 100),
      accessibility: Math.round(j.categories.accessibility.score * 100),
      bestPractices: Math.round(j.categories['best-practices'].score * 100),
      seo: Math.round(j.categories.seo.score * 100),
      lcpMs: Math.round(j.audits['largest-contentful-paint'].numericValue),
      cls: Number(j.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
      tbtMs: Math.round(j.audits['total-blocking-time'].numericValue),
      transferKiB: Math.round(j.audits['total-byte-weight'].numericValue / 1024),
      failedSeo: Object.values(j.categories.seo.auditRefs).filter((a) => j.audits[a.id].score === 0).map((a) => a.id),
      failedA11y: Object.values(j.categories.accessibility.auditRefs).filter((a) => j.audits[a.id].score === 0).map((a) => a.id),
      failedBp: Object.values(j.categories['best-practices'].auditRefs).filter((a) => j.audits[a.id].score === 0).map((a) => a.id),
    });
  }
  const m = {};
  for (const k of ['performance', 'accessibility', 'bestPractices', 'seo', 'lcpMs', 'cls', 'tbtMs', 'transferKiB']) m[k] = median(runs.map((x) => x[k]));
  out.results[r] = { median: m, failedSeo: runs[0].failedSeo, failedA11y: runs[0].failedA11y, failedBp: runs[0].failedBp };
  console.log(r, JSON.stringify(out.results[r]));
}
writeFileSync('docs/qa/lighthouse.json', JSON.stringify(out, null, 2) + '\n');
