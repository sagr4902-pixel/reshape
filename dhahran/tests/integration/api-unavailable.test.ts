import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

/** Persistence unavailable: the API must answer 503 — never a fabricated success. */
process.env.APP_ENV = 'development';
process.env.SITE_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://reshape@127.0.0.1:1/unreachable_test';
process.env.PRIVACY_NOTICE_VERSION = 'test-1';

const req = () =>
  new NextRequest('http://localhost:3000/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', host: 'localhost:3000' },
    body: JSON.stringify({ name: 'Test User', phone: '0500000020', programId: 'kids', intent: 'program-inquiry', locale: 'en', noticeVersion: 'test-1', privacyAcknowledged: true, idempotencyKey: randomUUID() }),
  });

afterAll(() => globalThis.__reshapePool?.end().catch(() => {}));

describe('POST /api/leads when storage is down or not configured', () => {
  it('unreachable database → 503 "unavailable" with no internals leaked', async () => {
    const { POST } = await import('@/app/api/leads/route');
    const res = await POST(req());
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ error: 'unavailable' });
    expect(text).not.toMatch(/ECONNREFUSED|127\.0\.0\.1|postgres/i);
  });
});
