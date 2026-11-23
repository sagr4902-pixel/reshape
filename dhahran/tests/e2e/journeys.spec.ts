import { expect, test } from '@playwright/test';
import { LOCALES, closeDb, fillAndSubmit, leadByPhone, testPhone } from './util';

test.afterAll(closeDb);

const SUCCESS = { ar: 'تم استلام اهتمامك بنجاح.', en: 'Your interest has been received.' };

for (const l of LOCALES) {
  test.describe(`customer journeys [${l}]`, () => {
    test('A — adult athlete: home → calisthenics → memberships → honest inquiry (no Dhahran product exists)', async ({ page }, info) => {
      await page.goto(`/${l}`);
      await expect(page.locator('h1')).toBeVisible();
      await page.locator(`a[href="/${l}/programs/calisthenics"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`/${l}/programs/calisthenics$`));
      // No purchase CTA and no official-store product link on a Dhahran program page.
      await expect(page.locator('a[href*="reshape-sa.com/"][href*="/p"]')).toHaveCount(0);
      await expect(page.getByTestId('membership-dhahran-adult')).toHaveAttribute('data-action', 'register-interest');

      await page.goto(`/${l}/memberships`);
      const card = page.getByTestId('membership-dhahran-adult');
      await expect(card).toHaveAttribute('data-action', 'register-interest');
      await expect(card).toContainText(l === 'ar' ? 'سيُعلن عن الأسعار لاحقًا' : 'Prices will be announced later');
      await expect(page.locator('main')).not.toContainText(/SAR|ر\.س|﷼|\d{3,}\s*(ريال)/);
      await card.getByRole('link').click();
      await expect(page).toHaveURL(/\/register\?intent=membership-consultation&src=memberships/);

      const phone = testPhone(info.workerIndex);
      await fillAndSubmit(page, { name: l === 'ar' ? 'خالد العتيبي' : 'Test Athlete', phone });
      await expect(page.getByTestId('lead-success')).toContainText(SUCCESS[l]);
      const [row] = await leadByPhone(phone);
      expect(row).toMatchObject({ intent: 'membership-consultation', source: 'memberships', locale: l, status: 'new' });
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

    test('C — hybrid athlete: program-specific inquiry stored; no affiliation claim', async ({ page }, info) => {
      await page.goto(`/${l}/programs/hybrid-endurance`);
      await expect(page.locator('h1')).toContainText(l === 'ar' ? 'القوة والتحمّل' : 'Hybrid Endurance');
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/hyrox|هايروكس|crossfit|كروس ?فت/i);
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
      expect(ids).toEqual(['about-h', 'sports-h', 'program-h', 'hybrid-h', 'zone-h', 'juice-h', 'fac-h', 'offer-h']);
      // the hero button goes to the offer at the end of the page
      await page.getByTestId('hero-offer').click();
      await expect(page).toHaveURL(/#offer$/);
      await expect(page.locator('#offer')).toBeInViewport();
    });

    test('F — the offer: countdown runs; without real terms it is a marked sample that cannot be bought', async ({ page }) => {
      await page.goto(`/${l}#offer`);
      const offer = page.locator('#offer');
      await expect(offer).toHaveAttribute('data-offer', 'sample');
      await expect(page.getByTestId('offer-draft')).toBeVisible();
      const timer = page.getByTestId('offer-countdown');
      await expect(timer).toHaveAttribute('data-ready', 'true');
      const first = await timer.innerText();
      await expect.poll(() => timer.innerText()).not.toBe(first);
      // no payment link exists until the owner supplies one
      await expect(offer.locator('a[href*="reshape-sa.com"]')).toHaveCount(0);
      await expect(page.getByTestId('offer-cta-sample')).toHaveAttribute('aria-disabled', 'true');
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
