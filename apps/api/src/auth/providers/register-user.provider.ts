import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { RegisterDto } from '@repo/shared';

import { UsersService } from '@/users/providers/users.service';

@Injectable()
export class RegisterUserProvider {
  constructor(
    /**
     * Injecting UsersService to access user data
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  public async register(body: RegisterDto) {
    const existingUsername = await this.usersService.findOneByUsername(
      body.username,
    );

    if (existingUsername) {
      throw new ConflictException('User with this username already exists');
    }

    const existingEmail = await this.usersService.findOneByEmail(body.email);

    if (existingEmail) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(body);

    return {
      message: 'User registered successfully',
      user,
    };
  }
}
