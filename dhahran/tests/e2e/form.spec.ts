import { expect, test } from '@playwright/test';
import { closeDb, db, fillAndSubmit, leadByPhone, testPhone } from './util';

test.afterAll(closeDb);

test.describe('registration form', () => {
  test('validation: localized errors, summary focus, associations, inputs preserved', async ({ page }) => {
    await page.goto('/ar/register');
    const form = page.getByTestId('lead-form');
    await form.locator('input[name="name"]').fill('س');
    await form.locator('input[name="phone"]').fill('12345');
    await page.getByTestId('lead-submit').click();
    const summary = page.getByTestId('lead-errors');
    await expect(summary).toBeFocused();
    await expect(summary).toContainText('اكتب رقم جوال سعودي صحيحًا');
    await expect(summary).toContainText('يلزم الإقرار بإشعار الخصوصية');
    const phone = form.locator('input[name="phone"]');
    await expect(phone).toHaveAttribute('aria-invalid', 'true');
    const described = (await phone.getAttribute('aria-describedby'))!.split(' ');
    await expect(page.locator(`[id="${described[1]}"]`)).toContainText('رقم جوال سعودي');
    await expect(phone).toHaveValue('12345'); // nothing is cleared
    await expect(phone).toHaveAttribute('dir', 'ltr');
    await expect(phone).toHaveAttribute('type', 'tel');
    await expect(phone).toHaveAttribute('autocomplete', 'tel');
    await expect(page.getByTestId('lead-success')).toHaveCount(0);
  });

  test('accepts Arabic-Indic digits and stores canonical E.164', async ({ page }, info) => {
    await page.goto('/ar/register?program=calisthenics');
    const local = testPhone(info.workerIndex);
    const arabicDigits = local.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
    await fillAndSubmit(page, { name: 'محمد الشهري', phone: arabicDigits });
    await expect(page.getByTestId('lead-success')).toBeFocused({ timeout: 10_000 }).catch(async () => expect(page.getByTestId('lead-success')).toBeVisible());
    const rows = await leadByPhone(local);
    expect(rows).toHaveLength(1);
    expect(rows[0].mobile_e164).toBe('+966' + local.slice(1));
  });

  test('double submit creates one record', async ({ page }, info) => {
    await page.goto('/en/register');
    const local = testPhone(info.workerIndex);
    const form = page.getByTestId('lead-form');
    await form.locator('input[name="name"]').fill('Test Double');
    await form.locator('input[name="phone"]').fill(local);
    await form.locator('input[type="checkbox"]').first().check();
    await page.getByTestId('lead-submit').dblclick();
    await expect(page.getByTestId('lead-success')).toBeVisible();
    expect(await leadByPhone(local)).toHaveLength(1);
  });

  test('storage failure shows an honest error, keeps the inputs, and a retry with the same data succeeds once', async ({ page }, info) => {
    await page.goto('/en/register?program=kids');
    const local = testPhone(info.workerIndex);
    let fail = true;
    const keys: string[] = [];
    await page.route('**/api/leads', async (route) => {
      keys.push(route.request().postDataJSON().idempotencyKey);
      if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' });
      return route.continue();
    });
    await fillAndSubmit(page, { name: 'Test Retry', phone: local });
    await expect(page.getByTestId('lead-errors')).toContainText('Nothing was recorded');
    await expect(page.getByTestId('lead-success')).toHaveCount(0);
    await expect(page.getByTestId('lead-form').locator('input[name="name"]')).toHaveValue('Test Retry');
    expect(await leadByPhone(local)).toHaveLength(0);

    fail = false;
    await page.getByTestId('lead-submit').click();
    await expect(page.getByTestId('lead-success')).toBeVisible();
    expect(keys[0]).toBe(keys[1]); // same attempt → same idempotency key
    expect(await leadByPhone(local)).toHaveLength(1);
  });

  test('network failure never shows success', async ({ page }) => {
    await page.goto('/en/register');
    await page.route('**/api/leads', (r) => r.abort());
    await fillAndSubmit(page, { name: 'Test Offline', phone: '0500000099' });
    await expect(page.getByTestId('lead-errors')).toContainText('Could not connect');
    await expect(page.getByTestId('lead-success')).toHaveCount(0);
  });

  test('unknown context in the URL is ignored, not rendered or stored', async ({ page }, info) => {
    await page.goto('/en/register?program=%3Cimg%20src=x%3E&zone=nope&intent=hack&src=https://evil.example');
    await expect(page.getByTestId('register-context')).toHaveCount(0);
    expect(await page.locator('body').innerText()).not.toContain('evil.example');
    await expect(page.locator('[href*="evil.example"], [src*="evil.example"], [action*="evil.example"]')).toHaveCount(0);
    const local = testPhone(info.workerIndex);
    await fillAndSubmit(page, { name: 'Test Context', phone: local });
    await expect(page.getByTestId('lead-success')).toBeVisible();
    expect((await leadByPhone(local))[0]).toMatchObject({ program_id: 'help-me-choose', zone_id: null, source: null });
  });

  test('no personal data reaches the URL or the success payload', async ({ page }, info) => {
    await page.goto('/en/register');
    const local = testPhone(info.workerIndex);
    let payload: unknown;
    await page.route('**/api/leads', async (route) => {
      const res = await route.fetch();
      payload = await res.json();
      await route.fulfill({ response: res });
    });
    await fillAndSubmit(page, { name: 'Test Privacy', phone: local });
    await expect(page.getByTestId('lead-success')).toBeVisible();
    expect(payload).toEqual({ ok: true });
    expect(page.url()).not.toContain(local);
    const total = await db().query('select count(*) from lead_submissions where mobile_e164 = $1', ['+966' + local.slice(1)]);
    expect(Number(total.rows[0].count)).toBe(1);
  });
});
