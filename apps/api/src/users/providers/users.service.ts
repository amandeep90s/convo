import { Injectable } from '@nestjs/common';
import { UserModel } from '@repo/db';
import type { RegisterDto, TRegisterResponse } from '@repo/shared';

import { CreateUserProvider } from '@/users/providers/create-user.provider';
import { FindOneUserByEmailProvider } from '@/users/providers/find-one-user-by-email.provider';
import { FindOneUserByUsernameProvider } from '@/users/providers/find-one-user-by-username.provider';

@Injectable()
export class UsersService {
  constructor(
    /**
     * Injecting FindOneUserByEmailProvider
     */
    private readonly findOneUserByEmailProvider: FindOneUserByEmailProvider,
    /**
     * Injecting FindOneUserByUsernameProvider
     */
    private readonly findOneUserByUsernameProvider: FindOneUserByUsernameProvider,
    /**
     * Injecting CreateUserProvider
     */
    private readonly createUserProvider: CreateUserProvider,
  ) {}

  public async findOneByEmail(email: string): Promise<UserModel | null> {
    return this.findOneUserByEmailProvider.findOneByEmail(email);
  }

  public async findOneByUsername(username: string): Promise<UserModel | null> {
    return this.findOneUserByUsernameProvider.findOneByUsername(username);
  }

  public async create(createUserDto: RegisterDto): Promise<TRegisterResponse> {
    return await this.createUserProvider.create(createUserDto);
  }
}
