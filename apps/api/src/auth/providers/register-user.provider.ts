import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { RegisterDto } from '@repo/shared';

import { SendVerificationEmailProvider } from '@/auth/providers/send-verification-email.provider';
import { VerificationTokenProvider } from '@/auth/providers/verification-token.provider';
import { UsersService } from '@/users/providers/users.service';

@Injectable()
export class RegisterUserProvider {
  constructor(
    /**
     * Injecting UsersService to access user data
     */
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,

    /**
     * Injecting IssueVerificationTokenProvider to issue verification tokens and send verification emails
     */
    private readonly verificationToken: VerificationTokenProvider,

    /**
     * Injecting SendVerificationEmailProvider to send verification emails to users
     */
    private readonly sendVerificationEmail: SendVerificationEmailProvider,
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

    const token = await this.verificationToken.issue(user);

    await this.sendVerificationEmail.send(user.email, user.name, token);

    return true;
  }
}
