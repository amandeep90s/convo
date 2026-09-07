import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { getRootEnvPath } from './env.util.js';
import { PrismaClient } from './generated/prisma/client.js';

config({ path: getRootEnvPath() });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env['DATABASE_URL'];

if (!connectionString) {
  throw new Error('DATABASE_URL is required to initialize the database client');
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = db;
}

export { PrismaPg } from '@prisma/adapter-pg';
export { PrismaClient } from './generated/prisma/client.js';
export * from './generated/prisma/enums.js';
export * from './generated/prisma/models.js';

