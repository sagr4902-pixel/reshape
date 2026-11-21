import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@db/schema';
import { IdempotencyConflictError, applyRetention, deleteLeadsByMobile, hitRateLimit, leadsToCsv, listLeads, setLeadStatus, submitLead, withdrawMarketing } from '@/lib/server/leads';
import { SECRET, TEST_DB_URL, lead, openDb, truncate } from './helpers';

let pool: Pool;
let db: Awaited<ReturnType<typeof openDb>>['db'];
const count = async (table: string) => Number((await pool.query(`select count(*) from ${table}`)).rows[0].count);

beforeAll(async () => {
  ({ pool, db } = await openDb());
});
beforeEach(() => truncate(pool));
afterAll(() => pool.end());

describe('lead persistence (real PostgreSQL)', () => {
  it('stores the inquiry and both consent records atomically', async () => {
    const input = lead({ marketingConsent: true, zoneId: 'rig', source: 'explorer', comment: 'سؤال عن المواعيد' });
    expect(await submitLead(db, input, SECRET)).toEqual({ outcome: 'created' });

    const { rows } = await pool.query('select * from lead_submissions');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ adult_name: 'مستخدم تجريبي', mobile_e164: '+966500000001', program_id: 'kids', intent: 'program-inquiry', zone_id: 'rig', source: 'explorer', status: 'new', is_repeat: false, locale: 'ar', notice_version: 'test-1' });
    expect(rows[0].created_at).toBeInstanceOf(Date); // server-generated timestamp
    const consents = (await pool.query('select purpose, choice, notice_version from consent_events order by purpose')).rows;
    expect(consents).toEqual([
      { purpose: 'inquiry_processing', choice: 'acknowledged', notice_version: 'test-1' },
      { purpose: 'marketing', choice: 'granted', notice_version: 'test-1' },
    ]);
  });

  it('survives a new connection (committed, not held in memory)', async () => {
    await submitLead(db, lead(), SECRET);
    const other = new Pool({ connectionString: TEST_DB_URL });
    try {
      expect(Number((await other.query('select count(*) from lead_submissions')).rows[0].count)).toBe(1);
    } finally {
      await other.end();
    }
  });

  it('replaying the same idempotency key and payload stores one row', async () => {
    const input = lead();
    expect((await submitLead(db, input, SECRET)).outcome).toBe('created');
    expect((await submitLead(db, input, SECRET)).outcome).toBe('replayed');
    expect(await count('lead_submissions')).toBe(1);
    expect(await count('consent_events')).toBe(2);
  });

  it('ten concurrent identical requests produce exactly one submission', async () => {
    const input = lead();
    const results = await Promise.all(Array.from({ length: 10 }, () => submitLead(db, input, SECRET)));
    expect(results.filter((r) => r.outcome === 'created')).toHaveLength(1);
    expect(results.filter((r) => r.outcome === 'replayed')).toHaveLength(9);
    expect(await count('lead_submissions')).toBe(1);
    expect(await count('consent_events')).toBe(2);
  });

  it('reusing a key with different data is a controlled conflict and changes nothing', async () => {
    const key = randomUUID();
    await submitLead(db, lead({ idempotencyKey: key }), SECRET);
    await expect(submitLead(db, lead({ idempotencyKey: key, marketingConsent: true }), SECRET)).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(await count('lead_submissions')).toBe(1);
    expect((await pool.query("select choice from consent_events where purpose='marketing'")).rows[0].choice).toBe('declined');
  });

  it('a later legitimate inquiry is a new row flagged for staff; earlier marketing consent is not carried forward', async () => {
    await submitLead(db, lead({ marketingConsent: true }), SECRET);
    await submitLead(db, lead({ marketingConsent: false }), SECRET); // new key, same mobile + program
    const rows = (await pool.query('select is_repeat from lead_submissions order by created_at, is_repeat')).rows;
    expect(rows.map((r) => r.is_repeat)).toEqual([false, true]);
    const marketing = (await pool.query("select choice from consent_events where purpose='marketing' order by collected_at, choice desc")).rows.map((r) => r.choice);
    expect(marketing.sort()).toEqual(['declined', 'granted']);
    // a different program from the same mobile is not a repeat
    await submitLead(db, lead({ programId: 'calisthenics' }), SECRET);
    expect((await pool.query("select is_repeat from lead_submissions where program_id='calisthenics'")).rows[0].is_repeat).toBe(false);
  });

  it('database constraints reject malformed rows even if application validation were bypassed', async () => {
    const bad = { ...lead(), phone: '12345' };
    await expect(submitLead(db, bad, SECRET)).rejects.toThrow();
    await expect(submitLead(db, { ...lead(), intent: 'buy' as never }, SECRET)).rejects.toThrow();
    expect(await count('lead_submissions')).toBe(0);
    expect(await count('consent_events')).toBe(0); // transaction rolled back as a whole
  });

  it('a failing database never reports success', async () => {
    const dead = new Pool({ connectionString: 'postgresql://reshape@127.0.0.1:1/none', connectionTimeoutMillis: 500 });
    await expect(submitLead(drizzle(dead, { schema }), lead(), SECRET)).rejects.toThrow();
    await dead.end();
  });
});

describe('shared rate limiting', () => {
  it('counts across calls in a window, then blocks; separate clients and windows are independent', async () => {
    const now = new Date('2026-11-21T10:00:30Z');
    const opts = { limit: 3, windowSeconds: 600, now };
    const hits = [];
    for (let i = 0; i < 5; i++) hits.push((await hitRateLimit(db, SECRET, 'client-a', opts)).allowed);
    expect(hits).toEqual([true, true, true, false, false]);
    expect((await hitRateLimit(db, SECRET, 'client-b', opts)).allowed).toBe(true);
    expect((await hitRateLimit(db, SECRET, 'client-a', { ...opts, now: new Date('2026-11-21T10:10:30Z') })).allowed).toBe(true);
    const buckets = (await pool.query('select bucket from rate_limits')).rows.map((r) => r.bucket).join();
    expect(buckets).not.toContain('client-a'); // only keyed hashes are stored
  });
  it('is safe under concurrency (atomic increments)', async () => {
    const opts = { limit: 5, windowSeconds: 600, now: new Date('2026-11-21T11:00:00Z') };
    const res = await Promise.all(Array.from({ length: 12 }, () => hitRateLimit(db, SECRET, 'burst', opts)));
    expect(res.filter((r) => r.allowed)).toHaveLength(5);
  });
});

describe('staff operations', () => {
  it('lists, updates status and exports CSV with formulas neutralised', async () => {
    await submitLead(db, lead({ name: 'Test User', comment: '=HYPERLINK("http://evil.example","x")' }), SECRET);
    const [row] = await listLeads(db);
    expect(row.marketing).toBe('declined');
    expect(await setLeadStatus(db, row.id, 'contacted')).toBe(1);
    expect((await listLeads(db, { status: 'contacted' }))).toHaveLength(1);
    const csv = leadsToCsv(await listLeads(db));
    expect(csv).toContain(`"'=HYPERLINK`);
    expect(csv).toContain('"+966500000001"'.replace('"+', `"'+`)); // leading + is neutralised too
  });

  it('erasure by mobile: dry run reports, execute deletes submission and consent rows', async () => {
    await submitLead(db, lead(), SECRET);
    await submitLead(db, lead({ phone: '0500000002' }), SECRET);
    expect(await deleteLeadsByMobile(db, '+966500000001', false)).toBe(1);
    expect(await count('lead_submissions')).toBe(2);
    expect(await deleteLeadsByMobile(db, '+966500000001', true)).toBe(1);
    expect(await count('lead_submissions')).toBe(1);
    expect(await count('consent_events')).toBe(2);
  });

  it('marketing withdrawal flips consent without deleting the inquiry', async () => {
    await submitLead(db, lead({ marketingConsent: true }), SECRET);
    expect(await withdrawMarketing(db, '+966500000001')).toBe(1);
    expect((await pool.query("select choice, method from consent_events where purpose='marketing'")).rows[0]).toEqual({ choice: 'declined', method: 'staff_withdrawal' });
    expect(await count('lead_submissions')).toBe(1);
  });

  it('retention: dry run deletes nothing; execute removes only leads past the window', async () => {
    await submitLead(db, lead(), SECRET);
    await submitLead(db, lead({ phone: '0500000003' }), SECRET);
    await pool.query("update lead_submissions set created_at = now() - interval '120 days' where mobile_e164 = '+966500000003'");
    const dry = await applyRetention(db, 90, false);
    expect(dry).toMatchObject({ matching: 1, deleted: 0 });
    expect(await count('lead_submissions')).toBe(2);
    expect((await applyRetention(db, 90, true)).deleted).toBe(1);
    expect((await pool.query('select mobile_e164 from lead_submissions')).rows).toEqual([{ mobile_e164: '+966500000001' }]);
  });
});

describe('least-privilege web role (db/roles.sql)', () => {
  it('can submit leads but cannot read personal columns, update or delete', async () => {
    await pool.query(readFileSync('db/roles.sql', 'utf8'));
    await pool.query("alter role reshape_web password 'integration_test_only'"); // servers with password auth (CI)
    const u = new URL(TEST_DB_URL);
    u.username = 'reshape_web';
    u.password = 'integration_test_only';
    const web = new Pool({ connectionString: u.toString() });
    try {
      const wdb = drizzle(web, { schema });
      const input = lead();
      expect((await submitLead(wdb, input, SECRET)).outcome).toBe('created');
      expect((await submitLead(wdb, input, SECRET)).outcome).toBe('replayed');
      expect((await hitRateLimit(wdb, SECRET, 'x', { limit: 2, windowSeconds: 60 })).allowed).toBe(true);
      await expect(web.query('select adult_name, mobile_e164 from lead_submissions')).rejects.toThrow(/permission denied/);
      await expect(web.query('select * from lead_submissions')).rejects.toThrow(/permission denied/);
      await expect(web.query('select * from consent_events')).rejects.toThrow(/permission denied/);
      await expect(web.query("update lead_submissions set status='spam'")).rejects.toThrow(/permission denied/);
      await expect(web.query('delete from lead_submissions')).rejects.toThrow(/permission denied/);
    } finally {
      await web.end();
    }
    expect(await count('lead_submissions')).toBe(1);
  });
});
