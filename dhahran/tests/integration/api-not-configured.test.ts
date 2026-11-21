import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

/** No DATABASE_URL at all: no mock backend is activated silently. */
delete process.env.DATABASE_URL;
process.env.APP_ENV = 'development';
process.env.SITE_URL = 'http://localhost:3000';

describe('POST /api/leads without credentials', () => {
  it('answers 503 and never success', async () => {
    const { POST } = await import('@/app/api/leads/route');
    const res = await POST(
      new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000', host: 'localhost:3000' },
        body: JSON.stringify({ name: 'Test User', phone: '0500000021', programId: 'kids', intent: 'program-inquiry', locale: 'en', noticeVersion: 'draft', privacyAcknowledged: true, idempotencyKey: randomUUID() }),
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'unavailable' });
  });
});
