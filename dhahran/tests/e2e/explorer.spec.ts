import { expect, test, type Page } from '@playwright/test';
import { LOCALES } from './util';

const root = (page: Page) => page.locator('.xp-root');
const settle = (page: Page) => expect(root(page)).not.toHaveAttribute('data-phase', 'transitioning');
const GROUND = ['entrance', 'reception', 'juice-bar', 'rig', 'turf-cardio', 'strength'];
const UPPER = ['lockers', 'overlook'];

/** Each numbered dot must sit exactly on its anchor point inside the level drawing. */
async function expectHotspotsAligned(page: Page, ids: string[]) {
  for (const id of ids) {
    const delta = await page.evaluate(async (zone) => {
      const hot = document.querySelector(`[data-testid="hot-${zone}"]`) as HTMLElement;
      const img = hot.parentElement!.querySelector('img') as HTMLImageElement;
      const svg = new DOMParser().parseFromString(await (await fetch(img.src)).text(), 'image/svg+xml');
      const [vx, vy, vw, vh] = svg.documentElement.getAttribute('viewBox')!.split(' ').map(Number);
      const a = svg.querySelector(`[data-anchor="${zone}"]`)!;
      const ir = img.getBoundingClientRect();
      const ex = ir.left + ((Number(a.getAttribute('cx')) - vx) / vw) * ir.width;
      const ey = ir.top + ((Number(a.getAttribute('cy')) - vy) / vh) * ir.height;
      const dot = hot.querySelector('.xp-hot-dot')!.getBoundingClientRect();
      return { dx: Math.abs(dot.left + dot.width / 2 - ex), dy: Math.abs(dot.top + dot.height / 2 - ey), dotW: dot.width };
    }, id);
    expect(delta.dx, `${id} x`).toBeLessThan(2.5);
    expect(delta.dy, `${id} y`).toBeLessThan(2.5);
    expect(delta.dotW, `${id} keeps its size under zoom`).toBeGreaterThan(34);
    expect(delta.dotW).toBeLessThan(38);
  }
}

test.describe('explorer', () => {
  test('first load shows the map and controls immediately; invalid deep links open the overview', async ({ page }) => {
    await page.goto('/ar/explore?zone=%3Cscript%3E');
    await expect(root(page)).toHaveAttribute('data-zone', '');
    await expect(page.getByTestId('xp-viewport').locator('img')).toHaveCount(2);
    await expect(page.getByTestId('xp-map')).toBeVisible();
    await expect(page.getByTestId('xp-photo')).toHaveCount(0);
    await page.goto('/ar/explore?zone=../../etc/passwd');
    await expect(root(page)).toHaveAttribute('data-zone', '');
    await expect(page.locator('[href*="etc/passwd"]')).toHaveCount(0);
  });

  for (const l of LOCALES) {
    test(`map hotspots stay registered across levels, zoom, resize and direction [${l}]`, async ({ page }) => {
      await page.goto(`/${l}/explore`);
      await expectHotspotsAligned(page, GROUND);
      // upper level is a switchable overlay registered above the ground drawing
      await page.getByTestId('xp-level-upper').click();
      await expect(page.getByTestId('hot-lockers')).toBeVisible();
      await expect(page.getByTestId('hot-rig')).toBeHidden();
      await expectHotspotsAligned(page, UPPER);
      await page.getByTestId('xp-level-ground').click();
      // select from the map: camera sweeps to the zone, then the design images take over
      await page.getByTestId('hot-strength').click();
      await expect(page.getByTestId('xp-photo')).toBeVisible();
      await page.getByTestId('xp-view-map').click();
      await settle(page);
      await expectHotspotsAligned(page, ['strength']);
      const vp = page.viewportSize()!;
      await page.setViewportSize({ width: vp.width > 800 ? 1024 : 360, height: 700 });
      await expectHotspotsAligned(page, ['strength']);
      await page.getByTestId('xp-back').click();
      await settle(page);
      await expectHotspotsAligned(page, GROUND);
    });
  }

  test('geometry is identical in Arabic and English (architecture is never mirrored)', async ({ page }) => {
    const box = async (l: string) => {
      await page.goto(`/${l}/explore`);
      const v = (await page.getByTestId('xp-viewport').boundingBox())!;
      const h = (await page.getByTestId('hot-turf-cardio').locator('.xp-hot-dot').boundingBox())!;
      return [Math.round(h.x - v.x), Math.round(h.y - v.y)];
    };
    expect(await box('ar')).toEqual(await box('en'));
  });

  test('deep link renders the zone, its first design image and CTA on the server; back/forward restore state', async ({ page, request }) => {
    const html = await (await request.get('/en/explore?zone=juice-bar')).text();
    expect(html).toContain('data-zone="juice-bar"');
    expect(html).toContain('/assets/design/d10-');
    expect(html).toMatch(/Register interest/);

    await page.goto('/en/explore');
    await page.getByTestId('chip-rig').click();
    await page.getByTestId('chip-overlook').click();
    await expect(root(page)).toHaveAttribute('data-zone', 'overlook');
    await page.goBack();
    await expect(root(page)).toHaveAttribute('data-zone', 'rig');
    await page.goBack();
    await expect(root(page)).toHaveAttribute('data-zone', '');
    await expect(page.getByTestId('xp-map')).toBeVisible();
    await page.goForward();
    await expect(root(page)).toHaveAttribute('data-zone', 'rig');
    await expect(page.getByTestId('xp-panel')).toContainText('Bars & rings');
  });

  test('rapid zone changes finish at the latest selection', async ({ page }) => {
    await page.goto('/en/explore');
    for (const id of ['rig', 'juice-bar', 'lockers', 'reception', 'strength']) await page.getByTestId(`chip-${id}`).click({ delay: 0 });
    await settle(page);
    await expect(root(page)).toHaveAttribute('data-zone', 'strength');
    await expect(page.getByTestId('xp-panel')).toContainText('Re.Build strength area');
    await expect(page.getByTestId('chip-strength')).toHaveAttribute('aria-current', 'true');
    await expect(root(page)).toHaveAttribute('data-phase', 'focused');
    await expect(root(page)).toHaveAttribute('data-view', 'design');
    await expect(page.getByTestId('xp-photo').locator('img').first()).toHaveAttribute('src', /d38-/);
    await expect(page.getByTestId('xp-announce')).toHaveText('Selected zone: Re.Build strength area');
  });

  test('design viewer: next, previous and thumbnails change the image, caption and counter', async ({ page }) => {
    await page.goto('/en/explore?zone=overlook');
    const img = page.getByTestId('xp-photo').locator('.xp-photo-img');
    await expect(img).toHaveAttribute('src', /d48-/);
    // the server-rendered render paints at once (it is the largest element on screen); only swapped renders fade in
    await expect(img).not.toHaveClass(/xp-photo-in/);
    expect(await img.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await expect(page.getByTestId('xp-img-count')).toHaveText('1 / 4');
    await expect(page.getByTestId('xp-photo')).toContainText('Concept visualization');
    await page.getByTestId('xp-img-next').click();
    await expect(img).toHaveAttribute('src', /d62-/);
    await expect(img).toHaveClass(/xp-photo-in/);
    await expect(page.getByTestId('xp-img-count')).toHaveText('2 / 4');
    await page.getByTestId('xp-img-prev').click();
    await page.getByTestId('xp-img-prev').click(); // wraps to the last image
    await expect(img).toHaveAttribute('src', /d50-/);
    await expect(page.getByTestId('xp-caption')).toHaveText('The office on the mezzanine');
    await page.getByTestId('xp-thumb-2').click();
    await expect(img).toHaveAttribute('src', /d49-/);
    await expect(page.getByTestId('xp-thumb-2')).toHaveAttribute('aria-current', 'true');
    await expect(img).toHaveAttribute('alt', /RESHAPE mark on glass/);
    // the mini-map locates the zone and opens the map on its level
    await page.getByTestId('xp-mini').click();
    await expect(page.getByTestId('xp-map')).toBeVisible();
    await expect(page.getByTestId('xp-stage')).toHaveAttribute('data-level', 'upper');
    await page.getByTestId('xp-view-design').click();
    await expect(page.getByTestId('xp-photo')).toBeVisible();
  });

  test('every zone gallery loads each render and each thumbnail (no missing files)', async ({ page }) => {
    test.setTimeout(120_000);
    const missing: string[] = [];
    page.on('response', (r) => {
      if (r.status() >= 400) missing.push(`${r.status()} ${new URL(r.url()).pathname}`);
    });
    const loaded = (el: HTMLImageElement) => el.complete && el.naturalWidth > 0;
    for (const zone of [...GROUND, ...UPPER]) {
      await page.goto(`/ar/explore?zone=${zone}`);
      const photo = page.getByTestId('xp-photo');
      await expect(photo).toBeVisible();
      const thumbs = photo.locator('.xp-thumb');
      const count = await thumbs.count();
      expect(count, `${zone}: gallery size`).toBeGreaterThan(1);
      for (let i = 0; i < count; i++) {
        await thumbs.nth(i).scrollIntoViewIfNeeded();
        await expect.poll(() => thumbs.nth(i).locator('img').evaluate(loaded), { message: `${zone}: thumbnail ${i + 1}`, timeout: 15_000 }).toBe(true);
        await thumbs.nth(i).click();
        await expect(thumbs.nth(i)).toHaveAttribute('aria-current', 'true');
        await expect.poll(() => photo.locator('.xp-photo-img').evaluate(loaded), { message: `${zone}: render ${i + 1}`, timeout: 15_000 }).toBe(true);
      }
    }
    expect(missing, 'requests answered with an error status').toEqual([]);
  });

  test('keyboard: chips are reachable, Enter selects, focus stays on a visible control', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'hardware-keyboard flow checked on desktop');
    await page.goto('/en/explore');
    await page.getByTestId('chip-juice-bar').focus();
    await page.keyboard.press('Enter');
    await expect(root(page)).toHaveAttribute('data-zone', 'juice-bar');
    await expect(page.getByTestId('chip-juice-bar')).toBeFocused();
    await expect(page.getByTestId('xp-photo')).toBeVisible();
    // the hidden map's hotspots are not reachable while the design view is shown
    await expect(page.getByTestId('hot-rig')).toBeHidden();
    await page.getByTestId('xp-img-next').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('xp-img-count')).toHaveText('2 / 4');
    await page.getByTestId('xp-photo-back').focus();
    await page.keyboard.press('Enter');
    await expect(root(page)).toHaveAttribute('data-zone', '');
  });

  test('reduced motion: no camera sweep or zoom — the design view appears at once with every action', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3100/en/explore');
    const dur = await page.getByTestId('xp-stage').evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    expect(dur).toBeLessThan(0.01);
    await page.getByTestId('hot-rig').click();
    await expect(root(page)).toHaveAttribute('data-phase', 'focused');
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /program=calisthenics/);
    // the facade "enter" link navigates straight away
    await page.goto('http://localhost:3100/en');
    await page.getByTestId('hero-explore').click();
    await expect(page).toHaveURL(/\/en\/explore$/);
    await expect(page.locator('.facade.is-entering')).toHaveCount(0);
    await ctx.close();
  });

  test('Simple view stops camera movement, keeps every action, and is remembered', async ({ page }) => {
    await page.goto('/en/explore');
    await page.getByTestId('xp-simple').click();
    await page.getByTestId('hot-turf-cardio').click();
    await expect(root(page)).toHaveAttribute('data-phase', 'focused');
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /program=hybrid-endurance/);
    await page.getByTestId('xp-view-map').click();
    expect(await page.getByTestId('xp-stage').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await page.reload();
    await expect(root(page)).toHaveAttribute('data-simple', 'true');
  });

  test('map failure falls back to a usable alternative, not an endless loader', async ({ page }) => {
    await page.route('**/assets/scenes/level-*.svg', (r) => r.abort());
    await page.goto('/en/explore');
    await expect(page.getByText('The interactive map could not be loaded')).toBeVisible();
    await expect(page.locator('#zone-rig a[href*="/register?program=calisthenics"]')).toBeVisible();
    await page.getByTestId('chip-rig').click();
    await expect(page.getByTestId('xp-photo')).toBeVisible();
    await expect(page.getByTestId('xp-cta')).toBeVisible();
    await expect(page.getByTestId('xp-view-map')).toHaveCount(0);
  });

  test('vertical page scrolling stays native over the map', async ({ page }) => {
    await page.goto('/en/explore');
    const box = (await page.getByTestId('xp-viewport').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    expect(await page.getByTestId('xp-viewport').evaluate((el) => getComputedStyle(el).touchAction)).toBe('auto');
  });

  test('without JavaScript: facade, zone list, program links and server-rendered zone view all work', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3100/ar/explore');
    await expect(page.locator('#zone-rig')).toContainText('العقلات والحلق');
    await expect(page.locator('ol li[id^="zone-"]')).toHaveCount(8);
    await page.getByTestId('chip-juice-bar').click(); // a plain link
    await expect(page).toHaveURL(/zone=juice-bar/);
    await expect(page.getByTestId('xp-photo').locator('img').first()).toBeVisible();
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /zone=juice-bar/);
    await page.goto('http://localhost:3100/ar');
    await expect(page.locator('h1')).toHaveText('هنا تبدأ قوّتك');
    await expect(page.locator('.facade img').first()).toBeVisible();
    await page.getByTestId('facade-hot-enter').click();
    await expect(page).toHaveURL(/explore\?zone=reception/);
    await ctx.close();
  });
});
