import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Pool } from 'pg';
import { NextRequest } from 'next/server';
import { TEST_DB_URL, openDb, truncate } from './helpers';

/** Exercises the real route handler against the real database. */
process.env.APP_ENV = 'development';
process.env.SITE_URL = 'http://localhost:3000';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.LEAD_HASH_SECRET = 'api-test-secret-000000000000000000000000';
process.env.PRIVACY_NOTICE_VERSION = 'test-1';
process.env.TRUST_PROXY = 'true';

let pool: Pool;
let POST: (req: NextRequest) => Promise<Response>;
const count = async () => Number((await pool.query('select count(*) from lead_submissions')).rows[0].count);

const body = (over: Record<string, unknown> = {}) => ({
  name: 'Test Parent',
  phone: '0500000010',
  programId: 'kids',
  intent: 'program-inquiry',
  locale: 'en',
  zoneId: 'rig',
  source: 'explorer',
  noticeVersion: 'test-1',
  privacyAcknowledged: true,
  marketingConsent: false,
  idempotencyKey: randomUUID(),
  ...over,
});
const post = (payload: unknown, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', host: 'localhost:3000', 'x-forwarded-for': '203.0.113.7', ...headers },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    }),
  );

beforeAll(async () => {
  ({ pool } = await openDb());
  ({ POST } = await import('@/app/api/leads/route'));
});
beforeEach(() => truncate(pool));
afterAll(async () => {
  await pool.end();
  await globalThis.__reshapePool?.end();
});

describe('POST /api/leads', () => {
  it('returns success only after the record is committed; response carries no personal data or ids', async () => {
    const res = await post(body());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get('cache-control')).toBe('no-store');
    const { rows } = await pool.query('select adult_name, mobile_e164, zone_id, source from lead_submissions');
    expect(rows).toEqual([{ adult_name: 'Test Parent', mobile_e164: '+966500000010', zone_id: 'rig', source: 'explorer' }]);
  });

  it('retry with the same key is a success replay; changed data with the same key is 409', async () => {
    const b = body();
    expect((await post(b)).status).toBe(200);
    expect((await post(b)).status).toBe(200);
    expect(await count()).toBe(1);
    const conflict = await post({ ...b, name: 'Someone Else' });
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toEqual({ error: 'conflict' });
    expect(await count()).toBe(1);
  });

  it('a repeat inquiry from a known number looks identical to a first one (no enumeration)', async () => {
    const first = await post(body());
    const second = await post(body());
    expect([second.status, await second.json()]).toEqual([first.status, await first.json()]);
    expect(await count()).toBe(2);
  });

  it('rejects invalid input with field codes and stores nothing', async () => {
    const res = await post(body({ phone: '123', name: 'A', programId: 'unknown', privacyAcknowledged: false }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('invalid');
    expect(json.fields.sort()).toEqual(['name', 'phone', 'privacy', 'program']);
    expect(JSON.stringify(json)).not.toMatch(/sql|stack|drizzle|pg_/i);
    expect(await count()).toBe(0);
  });

  it('rejects unexpected fields, stale notice versions and malformed JSON', async () => {
    expect((await post(body({ childName: 'x' }))).status).toBe(400);
    expect((await post(body({ noticeVersion: 'old' }))).status).toBe(400);
    expect((await post('{not json')).status).toBe(400);
    expect(await count()).toBe(0);
  });

  it('enforces same-origin, JSON content type and the 16 KiB body limit', async () => {
    expect((await post(body(), { origin: 'https://evil.example' })).status).toBe(403);
    expect((await post(body(), { origin: '' })).status).toBe(403);
    expect((await post(body(), { 'content-type': 'text/plain' })).status).toBe(415);
    expect((await post(body({ comment: 'x'.repeat(20_000) }))).status).toBe(413);
    expect(await count()).toBe(0);
  });

  it('honeypot submissions get a neutral response and are not stored', async () => {
    const res = await post(body({ website: 'http://spam.example' }));
    expect(res.status).toBe(200);
    expect(await count()).toBe(0);
  });

  it('throttles a single client with 429 + Retry-After and a usable message code', async () => {
    const statuses = [];
    for (let i = 0; i < 10; i++) statuses.push((await post(body({ phone: `05000001${String(i).padStart(2, '0')}` }))).status);
    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(200));
    expect(statuses.slice(8)).toEqual([429, 429]);
    const res = await post(body());
    expect(res.headers.get('retry-after')).toMatch(/^\d+$/);
    expect((await post(body(), { 'x-forwarded-for': '203.0.113.99' })).status).toBe(200); // other clients unaffected
  });
});
