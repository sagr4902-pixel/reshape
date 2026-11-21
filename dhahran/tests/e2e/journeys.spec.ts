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
      // The approved designs have no dedicated kids area: the page links to the general tour, not an invented zone.
      await expect(page.getByTestId('kids-tour')).toHaveAttribute('href', `/${l}/explore`);
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

    test('E — explorer visitor: zone → design images, correct program and a working, persisted CTA', async ({ page }, info) => {
      await page.goto(`/${l}/explore`);
      await page.getByTestId('chip-rig').click();
      await expect(page).toHaveURL(/zone=rig/);
      const panel = page.getByTestId('xp-panel');
      await expect(panel).toContainText(l === 'ar' ? 'العقلات والحلق' : 'Bars & rings');
      await expect(page.getByTestId('xp-photo').locator('img').first()).toHaveAttribute('src', /\/assets\/design\/d25-/);
      await expect(panel.locator(`a[href="/${l}/programs/calisthenics"]`)).toBeVisible();
      await expect(page.getByTestId('xp-cta')).toHaveAttribute('href', `/${l}/register?program=calisthenics&zone=rig&intent=program-inquiry&src=explorer`);
      await page.getByTestId('xp-cta').click();
      await expect(page.getByTestId('register-context')).toContainText(l === 'ar' ? 'الكاليسثنكس' : 'Calisthenics');
      const phone = testPhone(info.workerIndex);
      await fillAndSubmit(page, { name: l === 'ar' ? 'عبدالله المطيري' : 'Test Explorer', phone });
      await expect(page.getByTestId('lead-success')).toBeVisible();
      expect((await leadByPhone(phone))[0]).toMatchObject({ program_id: 'calisthenics', zone_id: 'rig', source: 'explorer' });
    });

    test('F — the homepage is the club facade; its door leads into reception', async ({ page }) => {
      await page.goto(`/${l}`);
      const facade = page.locator('.facade');
      await expect(facade.locator('img').first()).toHaveAttribute('src', /\/assets\/design\/facade-/);
      await expect(facade.locator('img').first()).toHaveAttribute('alt', l === 'ar' ? /واجهة ريشيب الظهران/ : /RESHAPE Dhahran facade/);
      await expect(page.locator('h1')).toHaveText(l === 'ar' ? 'هنا تبدأ قوّتك' : 'Your strength starts here');
      await expect(page.locator('.facade-note')).toContainText(l === 'ar' ? 'تصوّر مبدئي للنادي' : 'Concept visualization');
      const door = page.getByTestId('facade-hot-enter');
      await expect(door).toHaveAttribute('href', `/${l}/explore?zone=reception`);
      await door.click();
      await expect(page).toHaveURL(/explore\?zone=reception/, { timeout: 10_000 });
      await expect(page.getByTestId('xp-panel')).toContainText(l === 'ar' ? 'الاستقبال والمتجر' : 'Reception & store');
      await expect(page.getByTestId('xp-photo')).toBeVisible();
    });
  });
}
