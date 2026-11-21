import 'server-only';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@db/schema';
import { env } from '@/lib/env';

export type Db = NodePgDatabase<typeof schema>;

declare global {
  var __reshapePool: Pool | undefined;
}

/** Shared pool (survives dev hot reloads). Returns null when no database is configured. */
export function getDb(): Db | null {
  const e = env();
  if (!e.databaseUrl) return null;
  const pool = (globalThis.__reshapePool ??= new Pool({
    connectionString: e.databaseUrl,
    ssl: e.databaseSsl ? { rejectUnauthorized: true } : undefined,
    max: 5,
    connectionTimeoutMillis: 4000,
    idleTimeoutMillis: 30_000,
  }));
  return drizzle(pool, { schema });
}
