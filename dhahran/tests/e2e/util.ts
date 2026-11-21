import { expect, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { E2E_DB_URL } from '../../playwright.config';

export const LOCALES = ['ar', 'en'] as const;
export type L = (typeof LOCALES)[number];

export const ROUTES = [
  '',
  '/explore',
  '/programs',
  '/programs/calisthenics',
  '/programs/hybrid-endurance',
  '/programs/functional-training',
  '/programs/kids-martial-arts',
  '/kids',
  '/football-performance',
  '/memberships',
  '/register',
  '/contact',
  '/privacy',
];

let pool: Pool | undefined;
export const db = () => (pool ??= new Pool({ connectionString: E2E_DB_URL, max: 2 }));
export const closeDb = async () => {
  await pool?.end();
  pool = undefined;
};

/** Unique synthetic mobile in the 0500xxxxxx test range (valid shape, never a real customer). */
let seq = 0;
export const testPhone = (workerIndex: number) =>
  '0500' + String((workerIndex % 10) * 100000 + ((Date.now() % 10000) * 10 + (seq++ % 10))).padStart(6, '0').slice(-6);

export async function leadByPhone(local: string) {
  const e164 = '+966' + local.slice(1);
  const { rows } = await db().query(
    `select l.*, (select choice from consent_events c where c.submission_id = l.id and c.purpose = 'marketing') as marketing,
            (select choice from consent_events c where c.submission_id = l.id and c.purpose = 'inquiry_processing') as processing
       from lead_submissions l where mobile_e164 = $1 order by created_at`,
    [e164],
  );
  return rows;
}

export async function fillAndSubmit(page: Page, opts: { name: string; phone: string; marketing?: boolean }) {
  const form = page.getByTestId('lead-form');
  await expect(form).toBeVisible();
  await form.locator('input[name="name"]').fill(opts.name);
  await form.locator('input[name="phone"]').fill(opts.phone);
  const boxes = form.locator('input[type="checkbox"]');
  await boxes.nth(0).check();
  if (opts.marketing) await boxes.nth(1).check();
  await page.getByTestId('lead-submit').click();
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, 'page-level horizontal overflow').toBeLessThanOrEqual(1);
}
