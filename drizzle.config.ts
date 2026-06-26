import type { Config } from 'drizzle-kit';

export default {
  schema: './src/storage/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL + '?pgbouncer=true',
  },
} satisfies Config;
