/** Apply SQL migrations in db/migrations. Run deliberately (deploy step), never per request. */
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}
const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined });
try {
  await migrate(drizzle(pool), { migrationsFolder: new URL('../db/migrations', import.meta.url).pathname });
  console.log('Migrations applied.');
} finally {
  await pool.end();
}
