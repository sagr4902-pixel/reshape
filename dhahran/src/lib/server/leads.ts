import { createHash, createHmac } from 'node:crypto';
import { and, eq, lt, ne, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@db/schema';
import type { LeadInput } from '@/features/leads/schema';

/**
 * Lead persistence. No `server-only` import here so the integration tests can
 * exercise the exact same code against a real PostgreSQL database.
 */
type Db = NodePgDatabase<typeof schema>;

export class IdempotencyConflictError extends Error {
  constructor() {
    super('idempotency key reused with a different payload');
  }
}

/** Canonical hash of the fields a visitor controls. Same attempt → same hash. */
export function payloadHash(input: LeadInput): string {
  const canonical = JSON.stringify([
    input.name,
    input.phone,
    input.programId,
    input.intent,
    input.comment ?? '',
    input.locale,
    input.zoneId ?? '',
    input.source ?? '',
    input.noticeVersion,
    input.marketingConsent,
  ]);
  return createHash('sha256').update(canonical).digest('hex');
}

export const groupKey = (secret: string, mobile: string, programId: string) =>
  createHmac('sha256', secret).update(`${mobile}|${programId}`).digest('hex').slice(0, 40);

export interface SubmitResult {
  outcome: 'created' | 'replayed';
}

/**
 * Persist an inquiry and its consent evidence atomically.
 * - Same idempotency key + same payload → no new row, reports "replayed".
 * - Same key + different payload → IdempotencyConflictError.
 * - A later inquiry from the same mobile is a NEW row flagged is_repeat for staff
 *   review; it never overwrites earlier consent and is never revealed to the visitor.
 */
export async function submitLead(db: Db, input: LeadInput, secret: string): Promise<SubmitResult> {
  const hash = payloadHash(input);
  const gk = groupKey(secret, input.phone, input.programId);

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.leadSubmissions)
      .values({
        adultName: input.name,
        mobileE164: input.phone,
        programId: input.programId,
        intent: input.intent,
        comment: input.comment ?? null,
        locale: input.locale,
        zoneId: input.zoneId ?? null,
        source: input.source ?? null,
        noticeVersion: input.noticeVersion,
        idempotencyKey: input.idempotencyKey,
        payloadHash: hash,
        groupKey: gk,
        isRepeat: sql`exists (select 1 from ${schema.leadSubmissions} where ${schema.leadSubmissions.groupKey} = ${gk})`,
      })
      .onConflictDoNothing({ target: schema.leadSubmissions.idempotencyKey })
      .returning({ id: schema.leadSubmissions.id });

    if (inserted.length === 0) {
      // Key already used (possibly by a concurrent request that has now committed).
      const [existing] = await tx
        .select({ payloadHash: schema.leadSubmissions.payloadHash })
        .from(schema.leadSubmissions)
        .where(eq(schema.leadSubmissions.idempotencyKey, input.idempotencyKey));
      if (!existing || existing.payloadHash !== hash) throw new IdempotencyConflictError();
      return { outcome: 'replayed' as const };
    }

    const submissionId = inserted[0].id;
    await tx.insert(schema.consentEvents).values([
      { submissionId, purpose: 'inquiry_processing', choice: 'acknowledged', noticeVersion: input.noticeVersion },
      // Marketing is recorded from THIS submission only — never carried over from an earlier one.
      { submissionId, purpose: 'marketing', choice: input.marketingConsent ? 'granted' : 'declined', noticeVersion: input.noticeVersion },
    ]);
    return { outcome: 'created' as const };
  });
}

/**
 * Fixed-window limiter stored in PostgreSQL so it holds across instances.
 * The bucket is a keyed hash of the client key + window index; no IP is stored.
 */
export async function hitRateLimit(
  db: Db,
  secret: string,
  clientKey: string,
  opts: { limit: number; windowSeconds: number; now?: Date },
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = opts.now ?? new Date();
  const windowMs = opts.windowSeconds * 1000;
  const index = Math.floor(now.getTime() / windowMs);
  const expires = new Date((index + 1) * windowMs);
  const bucket = createHmac('sha256', secret).update(`rl|${clientKey}|${index}`).digest('hex').slice(0, 40);

  const [row] = await db
    .insert(schema.rateLimits)
    .values({ bucket, count: 1, expiresAt: expires })
    .onConflictDoUpdate({ target: schema.rateLimits.bucket, set: { count: sql`${schema.rateLimits.count} + 1` } })
    .returning({ count: schema.rateLimits.count });

  // Opportunistic clean-up of expired buckets (they are also purged by the retention script).
  if (Math.random() < 0.05) await db.delete(schema.rateLimits).where(lt(schema.rateLimits.expiresAt, now));

  return { allowed: row.count <= opts.limit, retryAfterSeconds: Math.max(1, Math.ceil((expires.getTime() - now.getTime()) / 1000)) };
}

// ── Staff operations (used by scripts/leads.ts with a privileged role) ──────

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'closed', 'spam'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export async function listLeads(db: Db, opts: { status?: LeadStatus; limit?: number } = {}) {
  const rows = await db.query.leadSubmissions.findMany({
    where: opts.status ? eq(schema.leadSubmissions.status, opts.status) : undefined,
    orderBy: (t, { desc }) => desc(t.createdAt),
    limit: opts.limit ?? 500,
  });
  const consents = await db.select().from(schema.consentEvents);
  const marketing = new Map(consents.filter((c) => c.purpose === 'marketing').map((c) => [c.submissionId, c.choice]));
  return rows.map((r) => ({ ...r, marketing: marketing.get(r.id) ?? 'declined' }));
}

export async function setLeadStatus(db: Db, id: string, status: LeadStatus) {
  const res = await db
    .update(schema.leadSubmissions)
    .set({ status, statusUpdatedAt: new Date() })
    .where(eq(schema.leadSubmissions.id, id))
    .returning({ id: schema.leadSubmissions.id });
  return res.length;
}

/** Erasure request: remove every submission for a mobile (consent rows cascade). */
export async function deleteLeadsByMobile(db: Db, mobileE164: string, execute: boolean) {
  const where = eq(schema.leadSubmissions.mobileE164, mobileE164);
  if (!execute) {
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leadSubmissions).where(where);
    return n;
  }
  const res = await db.delete(schema.leadSubmissions).where(where).returning({ id: schema.leadSubmissions.id });
  return res.length;
}

/** Withdraw marketing permission for a mobile without deleting the inquiries. */
export async function withdrawMarketing(db: Db, mobileE164: string) {
  const ids = db.select({ id: schema.leadSubmissions.id }).from(schema.leadSubmissions).where(eq(schema.leadSubmissions.mobileE164, mobileE164));
  const res = await db
    .update(schema.consentEvents)
    .set({ choice: 'declined', collectedAt: new Date(), method: 'staff_withdrawal' })
    .where(and(eq(schema.consentEvents.purpose, 'marketing'), ne(schema.consentEvents.choice, 'declined'), sql`${schema.consentEvents.submissionId} in ${ids}`))
    .returning({ id: schema.consentEvents.id });
  return res.length;
}

/** Retention: leads older than `days` (by creation). Dry run unless execute = true. */
export async function applyRetention(db: Db, days: number, execute: boolean, now = new Date()) {
  const cutoff = new Date(now.getTime() - days * 86_400_000);
  const where = lt(schema.leadSubmissions.createdAt, cutoff);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.leadSubmissions).where(where);
  let deleted = 0;
  if (execute) {
    deleted = (await db.delete(schema.leadSubmissions).where(where).returning({ id: schema.leadSubmissions.id })).length;
    await db.delete(schema.rateLimits).where(lt(schema.rateLimits.expiresAt, now));
  }
  return { cutoff, matching: n, deleted };
}

/** CSV cell that cannot be interpreted as a spreadsheet formula. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function leadsToCsv(rows: Awaited<ReturnType<typeof listLeads>>): string {
  const head = ['id', 'created_at_utc', 'name', 'mobile', 'program', 'intent', 'comment', 'locale', 'zone', 'source', 'status', 'repeat', 'marketing', 'notice_version'];
  const lines = rows.map((r) =>
    [r.id, r.createdAt.toISOString(), r.adultName, r.mobileE164, r.programId, r.intent, r.comment, r.locale, r.zoneId, r.source, r.status, r.isRepeat, r.marketing, r.noticeVersion]
      .map(csvCell)
      .join(','),
  );
  return '﻿' + [head.map(csvCell).join(','), ...lines].join('\r\n') + '\r\n';
}
