import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  apiVersion: process.env.API_VERSION || 'v1',
  throttle: {
    limit: Number(process.env.THROTTLE_LIMIT || 100),
    ttl: Number(process.env.THROTTLE_TTL || 60_000),
  },
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT || 6379),
}));
