import { Injectable } from '@nestjs/common';
import type { UserModel } from '@repo/db';

import { FindOneUserByEmailProvider } from '@/users/providers/find-one-user-by-email.provider';
import { FindOneUserByUsernameProvider } from '@/users/providers/find-one-user-by-username.provider';

@Injectable()
export class FindOneUserByIdentifierProvider {
  constructor(
    /**
     * Injecting FindOneUserByEmailProvider to handle finding users by email
     */
    private readonly findOneUserByEmail: FindOneUserByEmailProvider,

    /**
     * Injecting FindOneUserByUsernameProvider to handle finding users by username
     */
    private readonly findOneUserByUsername: FindOneUserByUsernameProvider,
  ) {}

  async findByIdentifier(identifier: string): Promise<UserModel | null> {
    let user: UserModel | null;
    if (identifier.includes('@')) {
      user = await this.findOneUserByEmail.findOneByEmail(identifier);
    } else {
      user = await this.findOneUserByUsername.findOneByUsername(identifier);
    }
    return user;
  }
}
