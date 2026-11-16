import path from 'node:path';

import { registerAs } from '@nestjs/config';

import { getRootDir } from '@/common/utils/env.util';

const webUrl = process.env.WEB_URL || 'http://localhost:3000';
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  apiVersion: process.env.API_VERSION || 'v1',
  webUrl,
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [webUrl],
  logLevel: process.env.LOG_LEVEL || 'info',
  throttle: {
    limit: Number(process.env.THROTTLE_LIMIT || 100),
    ttl: Number(process.env.THROTTLE_TTL || 60_000),
  },
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  uploadDir: path.resolve(getRootDir(), uploadDir),
}));
