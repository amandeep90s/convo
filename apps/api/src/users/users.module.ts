import { forwardRef, Module } from '@nestjs/common';

import { AuthModule } from '@/auth/auth.module';
import { MailModule } from '@/mail/mail.module';
import { CreateUserProvider } from '@/users/providers/create-user.provider';
import { FindOneUserByEmailProvider } from '@/users/providers/find-one-user-by-email.provider';
import { FindOneUserByIdentifierProvider } from '@/users/providers/find-one-user-by-identifier.provider';
import { FindOneUserByUsernameProvider } from '@/users/providers/find-one-user-by-username.provider';
import { UsersProvider } from '@/users/providers/users.provider';
import { UsersService } from '@/users/providers/users.service';
import { UsersController } from '@/users/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UsersProvider,
    FindOneUserByEmailProvider,
    FindOneUserByUsernameProvider,
    CreateUserProvider,
    FindOneUserByIdentifierProvider,
  ],
  exports: [
    UsersService,
    FindOneUserByEmailProvider,
    CreateUserProvider,
    FindOneUserByUsernameProvider,
    FindOneUserByIdentifierProvider,
  ],
  imports: [forwardRef(() => AuthModule), MailModule],
})
export class UsersModule {}
