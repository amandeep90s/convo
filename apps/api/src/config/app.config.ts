import { registerAs } from '@nestjs/config';

const webUrl = process.env.WEB_URL || 'http://localhost:3000';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
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
}));
