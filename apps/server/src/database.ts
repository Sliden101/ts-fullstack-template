import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { schema } from './db/schema.ts';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 30 is tuned for the current remote testing DB (~70ms RTT) so real user
  // lookups (GET /api/users/:id) sustain >= 100 TPS. Auth traffic is served
  // from the session cookie cache and barely touches the pool. Lower this for
  // a co-located database.
  max: Number(process.env.DATABASE_POOL_MAX ?? 30),
});

export const db = drizzle({ client: pool, schema });
export type AppDatabase = typeof db;

export function createDatabase(): AppDatabase {
  return db;
}
