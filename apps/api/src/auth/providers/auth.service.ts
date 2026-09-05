import { Injectable } from '@nestjs/common';
import type { RegisterDto } from '@repo/shared';

import { RegisterUserProvider } from '@/auth/providers/register-user.provider';

@Injectable()
export class AuthService {
  constructor(
    /**
     * Injecting RegisterUserProvider
     */
    private readonly registerUserProvider: RegisterUserProvider,
  ) {}

  public async register(body: RegisterDto) {
    return await this.registerUserProvider.register(body);
  }
}
