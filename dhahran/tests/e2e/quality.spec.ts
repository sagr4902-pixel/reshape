import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { LOCALES, ROUTES, noHorizontalOverflow } from './util';

test.describe('site quality', () => {
  test('"/" redirects to Arabic; /en is explicit; unknown paths get a localized 404', async ({ page, request }) => {
    const res = await request.get('/', { maxRedirects: 0 });
    expect(res.status()).toBe(307);
    expect(res.headers().location).toMatch(/\/ar$/);
    await page.goto('/en/does-not-exist');
    await expect(page.locator('h1')).toHaveText(/Page not found/i);
    expect((await request.get('/ar/nope')).status()).toBe(404);
    await page.goto('/ar/nope');
    await expect(page.locator('h1')).toHaveText('الصفحة غير موجودة');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  for (const l of LOCALES) {
    test(`every route renders cleanly [${l}]`, async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(String(e)));
      for (const route of ROUTES) {
        const res = await page.goto(`/${l}${route}`, { waitUntil: 'load' });
        expect(res?.status(), route).toBe(200);
        await expect(page.locator('html')).toHaveAttribute('lang', l);
        await expect(page.locator('html')).toHaveAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
        await expect(page.locator('h1')).toHaveCount(1);
        await noHorizontalOverflow(page);
        const text = await page.locator('body').innerText();
        // no raw translation keys or unresolved placeholders
        expect(text, route).not.toMatch(/\b(home|common|nav|explore|programs|kids|football|memberships|register|contact|privacy|footer|errors)\.[a-zA-Z]+\.[a-zA-Z]+/);
        expect(text, route).not.toMatch(/\{[a-z]+\}/);
        // no dead buttons / placeholder links
        expect(await page.locator('a[href="#"], a[href=""], a:not([href])').count(), `${route} dead links`).toBe(0);
        // all images loaded
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForLoadState('networkidle');
        const broken = await page.evaluate(() => Array.from(document.images).filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
        expect(broken, route).toEqual([]);
        // SEO: canonical + reciprocal hreflang; previews are noindex
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`/${l}${route}$`));
        await expect(page.locator('link[rel="alternate"][hreflang="ar"]')).toHaveCount(1);
        await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      }
      expect(errors).toEqual([]);
    });

    test(`usable at 320 px with no page-level horizontal scroll [${l}]`, async ({ browser }) => {
      test.setTimeout(120_000);
      const ctx = await browser.newContext({ viewport: { width: 320, height: 740 } });
      const page = await ctx.newPage();
      for (const route of ROUTES) {
        await page.goto(`http://localhost:3100/${l}${route}`);
        await noHorizontalOverflow(page);
      }
      await ctx.close();
    });

    test(`no serious or critical axe violations on key pages [${l}]`, async ({ page }) => {
      test.setTimeout(120_000);
      // Measure settled colours, not mid-fade frames.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const route of ['', '/programs', '/programs/calisthenics', '/kids', '/football-performance', '/memberships', '/register', '/contact', '/privacy']) {
        await page.goto(`/${l}${route}`);
        const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
        expect(bad, `${l}${route}`).toEqual([]);
      }
    });
  }

  test('renders are drawn from a file dense enough for their size (no upscaled, blurry pictures)', async ({ page }) => {
    test.setTimeout(120_000);
    for (const route of ['', '/programs', '/programs/calisthenics', '/kids', '/football-performance']) {
      await page.goto(`/ar${route}`, { waitUntil: 'load' });
      // bring lazy pictures in, slowly enough for the browser to start them
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo({ top: y, behavior: 'instant' });
          await new Promise((r) => setTimeout(r, 120));
        }
      });
      await expect
        .poll(() => page.evaluate(() => Array.from(document.querySelectorAll<HTMLImageElement>('picture img')).filter((i) => i.currentSrc && !i.complete).length), { timeout: 15_000 })
        .toBe(0);
      const soft = await page.evaluate(() => {
        const dpr = window.devicePixelRatio;
        const floor = Math.min(dpr, 1.5) * 0.9; // 1.5 file pixels per CSS pixel is treated as sharp on high-density screens
        const out: string[] = [];
        let checked = 0;
        for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('picture img'))) {
          const box = img.getBoundingClientRect();
          const file = Number(/-(\d+)\.(?:avif|webp)$/.exec(img.currentSrc)?.[1]);
          if (!file || !img.complete || !box.width || !box.height) continue;
          checked++;
          const widths = Array.from((img.parentElement!.querySelector('source')?.srcset ?? '').matchAll(/ (\d+)w/g), (m) => Number(m[1]));
          // object-fit: cover — a box taller than 16:9 draws the picture wider than the box
          const drawn = getComputedStyle(img).objectFit === 'cover' ? Math.max(box.width, (box.height * img.naturalWidth) / img.naturalHeight) : box.width;
          if (file / drawn < floor && file < Math.max(...widths)) out.push(`${img.currentSrc.split('/').pop()} is drawn ${Math.round(drawn)} CSS px wide at ${dpr}x`);
        }
        return { out, checked };
      });
      expect(soft.checked, `${route}: pictures checked`).toBeGreaterThan(0);
      expect(soft.out, route || '/').toEqual([]);
    }
  });

  test('language switch keeps the equivalent route and drops personal parameters', async ({ page }) => {
    await page.goto('/ar/programs/calisthenics');
    await page.getByRole('link', { name: 'Switch to English' }).click();
    await expect(page).toHaveURL(/\/en\/programs\/calisthenics$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.goto('/en/programs/calisthenics?name=Sara&phone=0500000000');
    await page.getByRole('link', { name: 'التحويل إلى العربية' }).click();
    await expect(page).toHaveURL(/\/ar\/programs\/calisthenics$/); // unknown / personal params are dropped
  });

  test('aliases redirect to primary routes', async ({ request }) => {
    for (const [from, to] of [
      ['/ar/programs/kids', '/ar/kids'],
      ['/en/programs/football-performance', '/en/football-performance'],
      ['/en/programs/crossfit', '/en/programs/functional-training'],
      ['/ar/programs/hyrox', '/ar/programs/hybrid-endurance'],
    ]) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect([307, 308]).toContain(res.status());
      expect(res.headers().location).toBe(to);
    }
  });

  test('footer carries the HIJA credit in both languages; security headers are set', async ({ page, request }) => {
    await page.goto('/ar');
    await expect(page.locator('footer a[href="https://hija-tech-sa.com/"]')).toHaveText('تطوير وتنفيذ مركز حِجَا');
    await page.goto('/en');
    await expect(page.locator('footer a[href="https://hija-tech-sa.com/"]')).toHaveText('Designed & Developed by HIJA');
    const h = (await request.get('/ar')).headers();
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-powered-by']).toBeUndefined();
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toMatch(/Disallow: \//); // preview build is closed to crawlers
  });

  test('the lead API is not readable and offers no CORS', async ({ request }) => {
    const get = await request.get('/api/leads');
    expect(get.status()).toBe(405);
    const cross = await request.post('/api/leads', { headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, data: {} });
    expect(cross.status()).toBe(403);
    expect(cross.headers()['access-control-allow-origin']).toBeUndefined();
  });

  test('client bundles contain no draft prices, evidence notes or internal tags', async ({ page, request }) => {
    const urls = new Set<string>();
    page.on('response', (r) => r.url().includes('/_next/static/') && r.url().endsWith('.js') && urls.add(r.url()));
    for (const r of ['/ar', '/ar/memberships', '/ar/programs', '/ar/register', '/ar/programs/hybrid-endurance']) await page.goto(r, { waitUntil: 'networkidle' });
    expect(urls.size).toBeGreaterThan(3);
    for (const u of urls) {
      const js = await (await request.get(u)).text();
      expect(js, u).not.toMatch(/amountMinor|publishApproved|branchEvidence|internalTags|Dammam|three-months-gym|Product page states/i);
    }
  });
});
