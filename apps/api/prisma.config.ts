import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const fromApiCwd = resolve(process.cwd(), '../../.env');
const fromRootCwd = resolve(process.cwd(), '.env');
config({ path: existsSync(fromApiCwd) ? fromApiCwd : fromRootCwd });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
