/**
 * Staff lead tooling (privileged; run from a trusted machine with a staff DATABASE_URL).
 *
 *   npm run leads -- list [--status new] [--limit 50]
 *   npm run leads:export -- --out exports/leads.csv [--status new]
 *   npm run leads -- status <id> <new|contacted|qualified|closed|spam>
 *   npm run leads -- delete --phone 05XXXXXXXX            (dry run)
 *   npm run leads -- delete --phone 05XXXXXXXX --execute --confirm-delete
 *   npm run leads -- withdraw-marketing --phone 05XXXXXXXX
 *   npm run privacy:retention:dry-run -- [--days 90]
 *   npm run privacy:retention:execute -- [--days 90]
 *
 * Output masks mobile numbers unless --full is passed. Never paste output into tickets or chat.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import { LEAD_STATUSES, applyRetention, deleteLeadsByMobile, leadsToCsv, listLeads, setLeadStatus, withdrawMarketing, type LeadStatus } from '../src/lib/server/leads';
import { normalizeSaudiMobile } from '../src/lib/phone-strict';

const [cmd, ...rest] = process.argv.slice(2);
const flag = (name: string) => rest.includes(`--${name}`);
const opt = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const positional = rest.filter((a, i) => !a.startsWith('--') && !(rest[i - 1]?.startsWith('--') && !['execute', 'confirm-delete', 'full'].includes(rest[i - 1].slice(2))));
const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

const url = process.env.DATABASE_URL ?? fail('DATABASE_URL is required.');
const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined });
const db = drizzle(pool, { schema });
const mask = (m: string) => (flag('full') ? m : `${m.slice(0, 6)}••••${m.slice(-2)}`);
const status = opt('status') as LeadStatus | undefined;
if (status && !LEAD_STATUSES.includes(status)) fail(`Unknown status. Use one of: ${LEAD_STATUSES.join(', ')}`);
const phone = () => normalizeSaudiMobile(opt('phone') ?? '') ?? fail('A valid Saudi mobile is required: --phone 05XXXXXXXX');

try {
  switch (cmd) {
    case 'list': {
      const rows = await listLeads(db, { status, limit: Number(opt('limit') ?? 50) });
      console.table(
        rows.map((r) => ({
          id: r.id,
          created: r.createdAt.toISOString().slice(0, 16),
          name: flag('full') ? r.adultName : r.adultName.slice(0, 1) + '…',
          mobile: mask(r.mobileE164),
          program: r.programId,
          intent: r.intent,
          status: r.status,
          repeat: r.isRepeat,
          marketing: r.marketing,
        })),
      );
      console.log(`${rows.length} lead(s).`);
      break;
    }
    case 'export': {
      const out = opt('out') ?? fail('Specify a destination: --out exports/leads.csv');
      const rows = await listLeads(db, { status, limit: 100_000 });
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, leadsToCsv(rows), { mode: 0o600 });
      console.log(`Exported ${rows.length} lead(s) to ${out}. This file contains personal data: store it securely and delete it after use.`);
      break;
    }
    case 'status': {
      const [id, next] = positional;
      if (!id || !LEAD_STATUSES.includes(next as LeadStatus)) fail(`Usage: status <id> <${LEAD_STATUSES.join('|')}>`);
      const n = await setLeadStatus(db, id, next as LeadStatus);
      console.log(n ? `Updated ${id} → ${next}.` : 'No lead with that id.');
      break;
    }
    case 'delete': {
      const execute = flag('execute') && flag('confirm-delete');
      if (flag('execute') && !flag('confirm-delete')) fail('Refusing to delete without --confirm-delete.');
      const n = await deleteLeadsByMobile(db, phone(), execute);
      console.log(execute ? `Deleted ${n} submission(s) and their consent records.` : `[dry run] ${n} submission(s) would be deleted. Add --execute --confirm-delete to proceed.`);
      break;
    }
    case 'withdraw-marketing': {
      const n = await withdrawMarketing(db, phone());
      console.log(`Marketing permission withdrawn on ${n} record(s).`);
      break;
    }
    case 'retention': {
      const days = Number(opt('days') ?? 90);
      if (!Number.isInteger(days) || days < 1) fail('--days must be a positive integer.');
      const execute = flag('execute') && flag('confirm-delete');
      if (flag('execute') && !flag('confirm-delete')) fail('Refusing to delete without --confirm-delete.');
      const r = await applyRetention(db, days, execute);
      console.log(
        execute
          ? `Deleted ${r.deleted} lead(s) created before ${r.cutoff.toISOString()} (retention ${days} days).`
          : `[dry run] ${r.matching} lead(s) created before ${r.cutoff.toISOString()} would be deleted (retention ${days} days).`,
      );
      break;
    }
    default:
      fail('Commands: list | export | status | delete | withdraw-marketing | retention');
  }
} finally {
  await pool.end();
}
