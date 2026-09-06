import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { environmentSchema } from '@repo/shared';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AuthModule } from '@/auth/auth.module';
import { BlockedUsersModule } from '@/blocked-users/blocked-users.module';
import { CallParticipantsModule } from '@/call-participants/call-participants.module';
import { CallsModule } from '@/calls/calls.module';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';
import { ZodValidationExceptionFilter } from '@/common/filters/zod-validation-exception.filter';
import { TransformResponseInterceptor } from '@/common/interceptors/transform-response.interceptor';
import { AppLoggerModule } from '@/common/logger/logger.module';
import appConfig from '@/config/app.config';
import mailConfig from '@/config/mail.config';
import { ContactsModule } from '@/contacts/contacts.module';
import { ConversationMembersModule } from '@/conversation-members/conversation-members.module';
import { ConversationsModule } from '@/conversations/conversations.module';
import { GroupInvitesModule } from '@/group-invites/group-invites.module';
import { GroupsModule } from '@/groups/groups.module';
import { HealthModule } from '@/health/health.module';
import { MailModule } from '@/mail/mail.module';
import { MessageAttachmentsModule } from '@/message-attachments/message-attachments.module';
import { MessageReactionsModule } from '@/message-reactions/message-reactions.module';
import { MessageReceiptsModule } from '@/message-receipts/message-receipts.module';
import { MessagesModule } from '@/messages/messages.module';
import { PinnedMessagesModule } from '@/pinned-messages/pinned-messages.module';
import { PrismaModule } from '@/prisma.module';
import { PrivateConversationsModule } from '@/private-conversations/private-conversations.module';
import { UserDevicesModule } from '@/user-devices/user-devices.module';
import { UserSessionsModule } from '@/user-sessions/user-sessions.module';
import { UserSettingsModule } from '@/user-settings/user-settings.module';
import { UsersModule } from '@/users/users.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
      load: [appConfig, mailConfig],
      validationSchema: environmentSchema,
    }),
    AppLoggerModule,
    PrismaModule,
    HealthModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            limit: configService.getOrThrow<number>('app.throttle.limit'),
            ttl: configService.getOrThrow<number>('app.throttle.ttl'),
          },
        ],
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('app.redisHost'),
          port: configService.getOrThrow<number>('app.redisPort'),
        },
      }),
    }),
    AuthModule,
    MessagesModule,
    UserDevicesModule,
    UserSessionsModule,
    ContactsModule,
    BlockedUsersModule,
    ConversationsModule,
    PrivateConversationsModule,
    GroupsModule,
    ConversationMembersModule,
    GroupInvitesModule,
    PinnedMessagesModule,
    MessageAttachmentsModule,
    MessageReactionsModule,
    MessageReceiptsModule,
    MailModule,
    CallsModule,
    CallParticipantsModule,
    UsersModule,
    UserSettingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    // Nest applies filters in reverse registration order, so the specific Zod
    // filter must come after the catch-all to take precedence.
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ZodValidationExceptionFilter,
    },
  ],
})
export class AppModule {}
