import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load the repository-root .env. In containers the variables are provided by
// the environment, so a missing file is fine.
config({ path: new URL('../../.env', import.meta.url) });

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
