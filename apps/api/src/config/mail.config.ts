import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.MAIL_FROM || 'Convo <no-reply@example.com>',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  verificationTokenTtl:
    process.env.EMAIL_VERIFICATION_TOKEN_TTL || '15 minutes',
}));
