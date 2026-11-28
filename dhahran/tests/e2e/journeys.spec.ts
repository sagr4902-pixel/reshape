import { expect, test } from '@playwright/test';
import { LOCALES, closeDb, fillAndSubmit, leadByPhone, testPhone } from './util';

test.afterAll(closeDb);

const SUCCESS = { ar: 'تم استلام اهتمامك بنجاح.', en: 'Your interest has been received.' };

for (const l of LOCALES) {
  test.describe(`customer journeys [${l}]`, () => {
    test('A — adult athlete: home → calisthenics → memberships → a priced Dhahran package on the official store', async ({ page }) => {
      await page.goto(`/${l}`);
      await expect(page.locator('h1')).toBeVisible();
      await page.locator(`a[href="/${l}/programs/calisthenics"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${l}/programs/calisthenics$`));
      await expect(page.getByTestId('membership-gym-3m')).toHaveAttribute('data-action', 'purchase');

      await page.goto(`/${l}/memberships`);
      for (const id of ['gym-3m', 'gym-6m', 'gym-12m', 'kids-1m', 'kids-3m', 'kids-6m', 'kids-12m', 'pause-1w', 'travel-extra', 'pt-test'])
        await expect(page.getByTestId(`membership-${id}`), id).toHaveAttribute('data-action', 'purchase');
      const card = page.getByTestId('membership-gym-6m');
      await expect(card.getByTestId('membership-price')).toContainText('4,960');
      await expect(card.locator('s')).toContainText('5,040');
      const buy = card.getByRole('link');
      await expect(buy).toHaveAttribute('href', 'https://reshape-sa.com/six-months-gym/p1882410865');
      await expect(buy).toHaveAttribute('target', '_blank');
      await expect(buy).toHaveAttribute('rel', /noopener/);
      // the store is never contacted by tests: the link is checked, not followed
    });

    test('B — parent: kids page → guardian inquiry stored with minimal data and separate consent', async ({ page }, info) => {
      await page.goto(`/${l}/kids`);
      await page.getByTestId('kids-cta').click();
      await expect(page).toHaveURL(/\/register\?program=kids&intent=program-inquiry&src=kids/);
      await expect(page.getByTestId('register-context')).toContainText(l === 'ar' ? 'برامج الأطفال' : 'Kids Programs');
      // Guardian wording; no child fields exist at all.
      await expect(page.getByTestId('lead-form').locator('label').first()).toContainText(l === 'ar' ? 'وليّ الأمر' : 'Guardian');
      await expect(page.locator('input[name*="child" i], input[type="date"], input[name*="birth" i], input[type="email"]')).toHaveCount(0);
      await expect(page.getByTestId('lead-form').locator('input[type="checkbox"]').nth(1)).not.toBeChecked(); // marketing is opt-in

      const phone = testPhone(info.workerIndex);
      await fillAndSubmit(page, { name: l === 'ar' ? 'نورة القحطاني' : 'Test Parent', phone });
      await expect(page.getByTestId('lead-success')).toContainText(SUCCESS[l]);
      const rows = await leadByPhone(phone);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ program_id: 'kids', zone_id: null, source: 'kids', intent: 'program-inquiry', marketing: 'declined', processing: 'acknowledged', comment: null });
      expect(Object.keys(rows[0]).join()).not.toMatch(/child|birth|email|ip|agent/);
    });

    test('C — HYROX athlete: program-specific inquiry stored; no affiliation claim', async ({ page }, info) => {
      await page.goto(`/${l}/programs/hybrid-endurance`);
      await expect(page.locator('h1')).toContainText(l === 'ar' ? 'هايروكس' : 'HYROX');
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/hyrox|هايروكس/i);
      // the name is used, but official affiliation is stated as not yet announced — never claimed
      expect(await page.locator('main').textContent()).toContain(l === 'ar' ? 'تفاصيل الاعتماد الرسمي تُعلن قبل الافتتاح' : 'Details of official affiliation will be announced before opening'); // inside a collapsed FAQ answer
      await page.getByTestId('program-cta').click();
      await expect(page).toHaveURL(/program=hybrid-endurance/);
      const phone = testPhone(info.workerIndex);
      await fillAndSubmit(page, { name: l === 'ar' ? 'فهد الدوسري' : 'Test Runner', phone, marketing: true });
      await expect(page.getByTestId('lead-success')).toBeVisible();
      expect((await leadByPhone(phone))[0]).toMatchObject({ program_id: 'hybrid-endurance', source: 'program', marketing: 'granted' });
    });

    test('D — football player: scope and boundaries shown; inquiry stored without medical details', async ({ page }, info) => {
      await page.goto(`/${l}/football-performance`);
      await expect(page.locator('main')).toContainText(l === 'ar' ? 'ليس خدمة طبية' : 'not a medical or physiotherapy service');
      await page.getByTestId('football-cta').click();
      await expect(page).toHaveURL(/program=football-performance&intent=membership-consultation&src=football/);
      const form = page.getByTestId('lead-form');
      await expect(form).toContainText(l === 'ar' ? 'لا تذكر معلومات طبية' : 'do not include medical');
      await expect(form.locator('input[type="file"], [name*="injur" i], [name*="medical" i]')).toHaveCount(0);
      const phone = testPhone(info.workerIndex);
      await fillAndSubmit(page, { name: l === 'ar' ? 'سالم الحربي' : 'Test Player', phone });
      await expect(page.getByTestId('lead-success')).toBeVisible();
      expect((await leadByPhone(phone))[0]).toMatchObject({ program_id: 'football-performance', intent: 'membership-consultation' });
    });

    test('E — the homepage is the official site: facade, the story in order, and the offer last', async ({ page }) => {
      await page.goto(`/${l}`);
      const facade = page.locator('.facade');
      await expect(facade.locator('img').first()).toHaveAttribute('src', /\/assets\/design\/facade-/);
      await expect(page.locator('h1')).toHaveText(l === 'ar' ? 'هنا تبدأ قوّتك' : 'Your strength starts here');
      await expect(page.locator('.facade-note')).toContainText(l === 'ar' ? 'تصوّر مبدئي للنادي' : 'Concept visualization');
      // sections in the order the owner asked for
      const ids = await page.locator('main h2').evaluateAll((hs) => hs.map((h) => h.id));
      expect(ids).toEqual(['about-h', 'identity-h', 'sports-h', 'gallery-h', 'method-h', 'hybrid-h', 'zone-h', 'outcomes-h', 'coaches-h', 'team-h', 'beyond-h', 'juice-h', 'fac-h', 'schedule-h', 'offer-h']);
      // real material (stories, coaches, titles, media, partners, timetable) is not invented: previews mark what is awaited
      expect(await page.getByTestId('awaiting').count()).toBe(3); // titles, partners and timetable still awaited
      await expect(page.getByTestId('coach-nawaf-alsaqr')).toContainText(l === 'ar' ? 'نواف الصقر' : 'Nawaf Al-Saqr');
      await expect(page.locator('#stories .story')).toHaveCount(6);
      // the hero button goes to the offer at the end of the page
      await page.getByTestId('hero-offer').click();
      await expect(page).toHaveURL(/#offer$/);
      await expect(page.locator('#offer')).toBeInViewport();
    });

    test('F — the offer: real name, running countdown, and the subscribe button goes to the official store', async ({ page }) => {
      await page.goto(`/${l}#offer`);
      const offer = page.locator('#offer');
      await expect(offer).toHaveAttribute('data-offer', 'live');
      await expect(offer.locator('h2')).toHaveText(l === 'ar' ? 'عرض شركاء النجاح' : 'The Success Partners offer');
      await expect(page.getByTestId('offer-draft')).toHaveCount(0);
      const timer = page.getByTestId('offer-countdown');
      await expect(timer).toHaveAttribute('data-ready', 'true');
      const first = await timer.innerText();
      await expect.poll(() => timer.innerText()).not.toBe(first);
      // the link lists several packages, so no single (invented) price is shown
      await expect(offer.locator('.offer-price')).toHaveCount(0);
      const cta = page.getByTestId('offer-cta-store');
      await expect(cta).toHaveAttribute('href', /^https:\/\/reshape-sa\.com\/.+\/c571221986$/);
      await expect(cta).toHaveAttribute('target', '_blank');
      await expect(cta).toHaveAttribute('rel', /noopener/);
    });

    test('H — the club clips: easy to find, filter by group, and play full screen with sound', async ({ page }) => {
      await page.goto(`/${l}`);
      await page.getByTestId('hero-watch').click();
      await expect(page).toHaveURL(/#gallery$/);
      const cards = page.getByTestId('reel-card');
      await expect(cards).toHaveCount(20);
      // posters are real images, not empty frames
      await cards.first().scrollIntoViewIfNeeded();
      await expect.poll(() => cards.first().locator('img').evaluate((i) => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await page.getByTestId('reel-tab-kids').click();
      await expect(cards).toHaveCount(4);
      await page.getByTestId('reel-tab-all').click();
      await expect(cards).toHaveCount(20);
      await cards.nth(2).click();
      const player = page.getByTestId('reel-player');
      await expect(player).toBeVisible();
      const video = player.locator('video');
      await expect(video).toHaveAttribute('src', /\/assets\/media\/.+\.mp4$/);
      await expect.poll(() => video.evaluate((v) => (v as HTMLVideoElement).readyState)).toBeGreaterThan(0);
      expect(await video.evaluate((v) => (v as HTMLVideoElement).muted)).toBe(false);
      await expect(page.getByTestId('reel-close')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(player).toHaveCount(0);
      await expect(cards.nth(2)).toBeFocused();
    });

    test('G — the club is not shown from inside: no tour, map or full renders', async ({ page, request }) => {
      const res = await request.get(`/${l}/explore?zone=rig`, { maxRedirects: 0 });
      expect(res.status()).toBe(307);
      expect(res.headers().location).toMatch(new RegExp(`/${l}(\\?|$)`));
      expect((await request.get('/assets/scenes/level-ground-dark.svg')).status()).toBe(404);
      expect((await request.get('/assets/design/d25-1200.avif')).status()).toBe(404);
      for (const route of ['', '/programs', '/programs/calisthenics', '/kids']) {
        await page.goto(`/${l}${route}`);
        expect(await page.locator('a[href*="/explore"]').count(), route).toBe(0);
        const srcs = await page.locator('img').evaluateAll((is) => is.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''));
        for (const src of srcs.filter((x) => x.includes('/assets/design/'))) expect(src, route).toMatch(/\/assets\/design\/(facade|t-[a-z]+)-\d+\./);
      }
    });
  });
}
