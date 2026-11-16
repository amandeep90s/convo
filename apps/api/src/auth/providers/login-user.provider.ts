import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EUserStatus } from '@repo/db';
import type { LoginDto } from '@repo/shared';

import type { AuthRequestContext } from '@/auth/providers/session.provider';
import { SessionProvider } from '@/auth/providers/session.provider';
import { FindOneUserByIdentifierProvider } from '@/users/providers/find-one-user-by-identifier.provider';

import { HashingProvider } from './hashing.provider';

@Injectable()
export class LoginUserProvider {
  constructor(
    /**
     * Injecting FindOneUserByIdentifierProvider
     */
    private readonly findOneUserByIdentifier: FindOneUserByIdentifierProvider,

    private readonly sessionProvider: SessionProvider,

    /**
     * Injecting HashingProvider to handle password and token hashing
     */
    private readonly hashingProvider: HashingProvider,
  ) {}

  async login(body: LoginDto, context: AuthRequestContext) {
    const user = await this.findOneUserByIdentifier.findByIdentifier(
      body.identifier,
    );

    if (!user?.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      !(await this.hashingProvider.comparePassword(
        body.password,
        user.password_hash,
      ))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.email_verified_at) {
      throw new UnauthorizedException('Email not verified');
    }

    if (user.status !== EUserStatus.active) {
      throw new UnauthorizedException(`Your account is ${user.status}`);
    }

    return this.sessionProvider.create(user, context);
  }
}
