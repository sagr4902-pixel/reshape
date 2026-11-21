import { NextResponse, type NextRequest } from 'next/server';
import { programIds, zoneIds } from '@/content';
import { leadSchema, type LeadFieldError } from '@/features/leads/schema';
import { env } from '@/lib/env';
import { getDb } from '@/lib/server/db';
import { IdempotencyConflictError, hitRateLimit, submitLead } from '@/lib/server/leads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 16 * 1024;
const json = (body: Record<string, unknown>, status: number, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

/** Same-origin policy: the Origin header must match this deployment. No CORS is offered. */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  let o: URL;
  try {
    o = new URL(origin);
  } catch {
    return false;
  }
  const allowed = new Set<string>([new URL(env().siteUrl).host]);
  const host = req.headers.get('host');
  if (host) allowed.add(host);
  return allowed.has(o.host);
}

function clientKey(req: NextRequest): string {
  if (!env().trustProxy) return 'global';
  const first = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return first && first.length <= 64 ? first : 'global';
}

export async function POST(req: NextRequest) {
  const e = env();

  if (!sameOrigin(req)) return json({ error: 'forbidden' }, 403);
  if (!(req.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json'))
    return json({ error: 'unsupported_media_type' }, 415);

  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);
  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid', fields: [] }, 400);
  }

  // Collection gate: never accept data we cannot store or that lacks a published notice.
  const db = e.leadsEnabled ? getDb() : null;
  if (!db) return json({ error: 'unavailable' }, 503);

  const parsed = leadSchema({ programIds, zoneIds }).safeParse(body);
  if (!parsed.success) {
    const known: LeadFieldError[] = ['name', 'phone', 'program', 'intent', 'comment', 'privacy'];
    const fields = [...new Set(parsed.error.issues.map((i) => i.message).filter((m): m is LeadFieldError => (known as string[]).includes(m)))];
    return json({ error: 'invalid', fields }, 400);
  }
  const input = parsed.data;
  if (input.noticeVersion !== e.privacyNoticeVersion) return json({ error: 'invalid', fields: ['privacy'] }, 400);

  // Honeypot: pretend success without storing anything. Autofill never targets this field
  // (off-screen, autocomplete=off, tabindex=-1, aria-hidden).
  if (input.website) return json({ ok: true }, 200);

  try {
    const limit = clientKey(req) === 'global' ? { limit: 120, windowSeconds: 600 } : { limit: 8, windowSeconds: 600 };
    const rl = await hitRateLimit(db, e.leadHashSecret, clientKey(req), limit);
    if (!rl.allowed) return json({ error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds }, 429, { 'Retry-After': String(rl.retryAfterSeconds) });

    await submitLead(db, input, e.leadHashSecret);
    // Success is returned only after the transaction has committed.
    return json({ ok: true }, 200);
  } catch (err) {
    if (err instanceof IdempotencyConflictError) return json({ error: 'conflict' }, 409);
    // No personal data, SQL or stack traces in logs.
    console.error('[leads] persistence failure:', err instanceof Error ? err.name : 'unknown');
    return json({ error: 'unavailable' }, 503);
  }
}
