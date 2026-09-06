import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

import { getRootEnvPath } from './src/env.util.js';

config({ path: getRootEnvPath() });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
