import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResendModule } from 'nestjs-resend';

import { MailProcessor } from '@/mail/mail.processor';
import { MailService } from '@/mail/mail.service';
import { MailTemplateService } from '@/mail/mail-template.service';
import { MAIL_QUEUE_NAME } from '@/mail/queues/mail.queue';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.getOrThrow<string>('mail.apiKey'),
      }),
    }),
  ],
  providers: [MailService, MailProcessor, MailTemplateService],
  exports: [MailService],
})
export class MailModule {}
