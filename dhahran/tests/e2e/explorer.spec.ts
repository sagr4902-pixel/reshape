import { expect, test, type Page } from '@playwright/test';
import { LOCALES } from './util';

const zoneOf = (page: Page) => page.locator('.xp-root').getAttribute('data-zone');

/** Hotspot centre must coincide with its anchor point inside the level drawing. */
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
      // the numbered dot sits exactly on the anchor; its label hangs beside it
      return { dx: Math.abs(dot.left + dot.width / 2 - ex), dy: Math.abs(dot.top + dot.height / 2 - ey), dotW: dot.width };
    }, id);
    expect(delta.dx, `${id} x`).toBeLessThan(2.5);
    expect(delta.dy, `${id} y`).toBeLessThan(2.5);
    expect(delta.dotW, `${id} keeps its size under zoom`).toBeGreaterThan(34);
    expect(delta.dotW).toBeLessThan(38);
  }
}
const ALL = ['calisthenics-hall', 'kids-pavilion', 'entrance', 'track-loop', 'performance-deck', 'changing'];
const settle = (page: Page) => expect(page.locator('.xp-root')).not.toHaveAttribute('data-phase', 'transitioning');

test.describe('explorer', () => {
  test('first load shows the scene and controls immediately; invalid deep link opens the overview', async ({ page }) => {
    await page.goto('/ar/explore?zone=%3Cscript%3E');
    expect(await zoneOf(page)).toBe('');
    await expect(page.getByTestId('xp-viewport').locator('img')).toHaveCount(2);
    await expect(page.getByTestId('xp-back')).toHaveCount(0);
    await page.goto('/ar/explore?zone=../../etc/passwd');
    expect(await zoneOf(page)).toBe('');
    expect(await page.content()).not.toContain('etc/passwd"');
  });

  for (const l of LOCALES) {
    test(`hotspots stay registered to the drawing across zoom, resize and direction [${l}]`, async ({ page }) => {
      await page.goto(`/${l}/explore`);
      await expectHotspotsAligned(page, ALL);
      await page.getByTestId('chip-performance-deck').click();
      await settle(page);
      await expectHotspotsAligned(page, ['performance-deck']);
      const vp = page.viewportSize()!;
      await page.setViewportSize({ width: vp.width > 800 ? 1024 : 360, height: 700 });
      await expectHotspotsAligned(page, ['performance-deck']);
      await page.getByTestId('xp-back').click();
      await settle(page);
      await expectHotspotsAligned(page, ALL);
    });
  }

  test('geometry is identical in Arabic and English (architecture is never mirrored)', async ({ page }) => {
    const box = async (l: string) => {
      await page.goto(`/${l}/explore`);
      const v = (await page.getByTestId('xp-viewport').boundingBox())!;
      const h = (await page.getByTestId('hot-track-loop').locator('.xp-hot-dot').boundingBox())!;
      return [Math.round(h.x - v.x), Math.round(h.y - v.y)];
    };
    expect(await box('ar')).toEqual(await box('en'));
  });

  test('deep link renders the focused zone on the server; back/forward restore state', async ({ page, request }) => {
    const html = await (await request.get('/en/explore?zone=kids-pavilion')).text();
    expect(html).toContain('data-zone="kids-pavilion"');
    expect(html).toMatch(/Register interest in Kids/);

    await page.goto('/en/explore');
    await page.getByTestId('chip-calisthenics-hall').click();
    await page.getByTestId('chip-track-loop').click();
    expect(await zoneOf(page)).toBe('track-loop');
    await page.goBack();
    await expect(page.locator('.xp-root')).toHaveAttribute('data-zone', 'calisthenics-hall');
    await page.goBack();
    await expect(page.locator('.xp-root')).toHaveAttribute('data-zone', '');
    await page.goForward();
    await expect(page.locator('.xp-root')).toHaveAttribute('data-zone', 'calisthenics-hall');
    await expect(page.getByTestId('xp-panel')).toContainText('Calisthenics hall');
  });

  test('rapid zone changes finish at the latest selection', async ({ page }) => {
    await page.goto('/en/explore');
    for (const id of ['calisthenics-hall', 'kids-pavilion', 'track-loop', 'changing', 'performance-deck']) await page.getByTestId(`chip-${id}`).click({ delay: 0 });
    await settle(page);
    expect(await zoneOf(page)).toBe('performance-deck');
    await expect(page.getByTestId('xp-panel')).toContainText('Performance deck');
    await expect(page.getByTestId('chip-performance-deck')).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('.xp-root')).toHaveAttribute('data-phase', 'focused');
    await expect(page.getByTestId('xp-announce')).toHaveText('Selected zone: Performance deck');
  });

  test('keyboard: chips are reachable, Enter selects, focus stays on a visible control', async ({ page }, info) => {
    test.skip(info.project.name === 'mobile', 'hardware-keyboard flow checked on desktop');
    await page.goto('/en/explore');
    await page.getByTestId('chip-kids-pavilion').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.xp-root')).toHaveAttribute('data-zone', 'kids-pavilion');
    await expect(page.getByTestId('chip-kids-pavilion')).toBeFocused();
    // hidden hotspots are not focusable while focused on a zone
    await expect(page.getByTestId('hot-track-loop')).toBeHidden();
    await page.getByTestId('xp-back').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.xp-root')).toHaveAttribute('data-zone', '');
  });

  test('reduced motion removes the camera sweep but keeps content and actions', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3100/en/explore');
    const dur = await page.getByTestId('xp-stage').evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration));
    expect(dur).toBeLessThan(0.01);
    await page.getByTestId('chip-kids-pavilion').click();
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /program=kids/);
    await ctx.close();
  });

  test('Simple view stops camera movement, keeps every action, and is remembered', async ({ page }) => {
    await page.goto('/en/explore');
    await page.getByTestId('xp-simple').click();
    await page.getByTestId('chip-track-loop').click();
    expect(await page.getByTestId('xp-stage').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /program=hybrid-endurance/);
    await page.reload();
    await expect(page.locator('.xp-root')).toHaveAttribute('data-simple', 'true');
  });

  test('asset failure falls back to a usable alternative, not an endless loader', async ({ page }) => {
    await page.route('**/assets/scenes/level-*.svg', (r) => r.abort());
    await page.goto('/en/explore');
    await expect(page.getByText('The interactive drawing could not be loaded')).toBeVisible();
    await expect(page.locator('#zone-kids-pavilion a[href*="/register?program=kids"]')).toBeVisible();
    await page.getByTestId('chip-kids-pavilion').click();
    await expect(page.getByTestId('xp-cta')).toBeVisible();
  });

  test('vertical page scrolling stays native over the scene', async ({ page }) => {
    await page.goto('/en/explore');
    const box = (await page.getByTestId('xp-viewport').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    expect(await page.getByTestId('xp-viewport').evaluate((el) => getComputedStyle(el).touchAction)).toBe('auto');
  });

  test('without JavaScript: zone list, program links and server-rendered zone focus all work', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3100/ar/explore');
    await expect(page.locator('#zone-calisthenics-hall')).toContainText('صالة الكاليسثنكس');
    await expect(page.locator('ol li[id^="zone-"]')).toHaveCount(6);
    await page.getByTestId('chip-kids-pavilion').click(); // a plain link
    await expect(page).toHaveURL(/zone=kids-pavilion/);
    await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', /program=kids&zone=kids-pavilion/);
    await page.goto('http://localhost:3100/ar');
    await expect(page.locator('h1')).toHaveText('هنا تبدأ قوّتك');
    await expect(page.locator('a[href="/ar/programs/calisthenics"]').first()).toBeVisible();
    await ctx.close();
  });
});
