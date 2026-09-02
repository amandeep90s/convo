import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { PrismaClient } from './generated/prisma/client.js';

config({ path: path.resolve(__dirname, '../../.env') });

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

export { PrismaClient } from './generated/prisma/client.js';
export * from './generated/prisma/models.js';
