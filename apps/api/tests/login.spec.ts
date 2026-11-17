import { createHmac, randomUUID } from 'node:crypto';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { expect, test as base } from '@playwright/test';
import { hash } from 'argon2';

import { PrismaService } from '../src/prisma.service';

const password = 'Test-only-password-42!';
const code = '482691';
const test = base.extend<{
  account: { id: string; email: string; codeHash: string; db: PrismaService };
}>({
  account: async ({}, use) => {
    const config = new ConfigService(process.env);
    const db = new PrismaService(config);
    const suffix = randomUUID();
    const user = await db.user.create({
      data: {
        email: `${suffix}@example.test`,
        username: suffix,
        name: 'OTP test',
        email_verified_at: new Date(),
        password_hash: await hash(password),
      },
    });
    const codeHash = createHmac(
      'sha256',
      config.getOrThrow<string>('JWT_SECRET'),
    )
      .update(`${user.id}:${code}`)
      .digest('hex');
    try {
      // Reusing a just-issued code exercises the normal credential flow without sending test email.
      await db.loginOtp.create({
        data: {
          user_id: user.id,
          code_hash: codeHash,
          expires_at: new Date(Date.now() + 600_000),
        },
      });
      await use({ id: user.id, email: user.email, codeHash, db });
    } finally {
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    }
  },
});

test('credentials are required before OTP and only a valid challenge/code creates a session', async ({
  request,
  account,
}) => {
  const legacy = await request.post('/api/v1/auth/login/otp/request', {
    data: { email: account.email },
  });
  expect(legacy.status()).toBe(400);
  const rejected = await request.post('/api/v1/auth/login', {
    data: { identifier: account.email, password: 'wrong-password' },
  });
  expect(rejected.status()).toBe(401);
  expect(
    (
      await account.db.loginOtp.findUniqueOrThrow({
        where: { user_id: account.id },
      })
    ).code_hash,
  ).toBe(account.codeHash);
  const started = await request.post('/api/v1/auth/login', {
    data: { identifier: account.email, password },
  });
  expect(started.ok()).toBeTruthy();
  const challenge = (await started.json()).data;
  expect(challenge).toEqual({
    email: account.email,
    challengeToken: expect.any(String),
  });
  expect(
    await account.db.userSession.count({ where: { user_id: account.id } }),
  ).toBe(0);
  expect(
    (
      await request.get('/api/v1/users/me', {
        headers: { authorization: `Bearer ${challenge.challengeToken}` },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post('/api/v1/auth/login/otp/verify', {
        data: { email: account.email, code },
      })
    ).status(),
  ).toBe(400);
  const wrong = await request.post('/api/v1/auth/login/otp/verify', {
    data: { challengeToken: challenge.challengeToken, code: '000000' },
  });
  expect(wrong.status()).toBe(401);
  expect(
    await account.db.userSession.count({ where: { user_id: account.id } }),
  ).toBe(0);
  const verified = await request.post('/api/v1/auth/login/otp/verify', {
    data: { challengeToken: challenge.challengeToken, code },
  });
  expect(verified.ok()).toBeTruthy();
  const session = (await verified.json()).data;
  const jwt = new JwtService({ secret: process.env.JWT_SECRET });
  const claims = await jwt.verifyAsync<{
    type: string;
    exp: number;
    iat: number;
  }>(session.accessToken);
  expect(claims.type).toBe('access');
  expect(
    claims.exp - claims.iat,
    'Run with JWT_ACCESS_TOKEN_TTL=1h as in .env.example',
  ).toBe(3600);
  expect(
    await account.db.userSession.count({ where: { user_id: account.id } }),
  ).toBe(1);
  expect(
    (
      await request.post('/api/v1/auth/login/otp/verify', {
        data: { challengeToken: challenge.challengeToken, code },
      })
    ).status(),
  ).toBe(401);
});

test('expired codes and challenges bound to replaced codes cannot establish a session', async ({
  request,
  account,
}) => {
  const started = await request.post('/api/v1/auth/login', {
    data: { identifier: account.email, password },
  });
  expect(started.ok()).toBeTruthy();
  const { challengeToken } = (await started.json()).data;
  await account.db.loginOtp.update({
    where: { user_id: account.id },
    data: { expires_at: new Date(Date.now() - 1000) },
  });
  expect(
    (
      await request.post('/api/v1/auth/login/otp/verify', {
        data: { challengeToken, code },
      })
    ).status(),
  ).toBe(401);
  await account.db.loginOtp.update({
    where: { user_id: account.id },
    data: {
      code_hash: 'replaced-code-hash',
      expires_at: new Date(Date.now() + 600_000),
    },
  });
  expect(
    (
      await request.post('/api/v1/auth/login/otp/verify', {
        data: { challengeToken, code },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await account.db.loginOtp.findUniqueOrThrow({
        where: { user_id: account.id },
      })
    ).attempts,
  ).toBe(0);
  expect(
    await account.db.userSession.count({ where: { user_id: account.id } }),
  ).toBe(0);
});
