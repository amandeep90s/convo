import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import type { CreateBatchOptions, CreateEmailOptions } from 'nestjs-resend';
import { ResendService } from 'nestjs-resend';

import { MailTemplateService } from '@/mail/mail-template.service';
import {
  MAIL_JOB_NAMES,
  MAIL_QUEUE_NAME,
  VERIFICATION_EMAIL_JOB_OPTIONS,
} from '@/mail/queues/mail.queue';
import type { VerificationEmailJob } from '@/mail/types/mail.types';

@Injectable()
export class MailService {
  constructor(
    private readonly resendService: ResendService,
    private readonly configService: ConfigService,
    private readonly mailTemplateService: MailTemplateService,
    @InjectQueue(MAIL_QUEUE_NAME)
    private readonly mailQueue: Queue<VerificationEmailJob>,
  ) {}

  send(options: CreateEmailOptions) {
    return this.resendService.send(options);
  }

  sendBatch(options: CreateBatchOptions) {
    return this.resendService.sendBatch(options);
  }

  sendVerificationEmail(
    recipientEmail: string,
    recipientName: string,
    token: string,
  ) {
    return this.mailQueue.add(
      MAIL_JOB_NAMES.verificationEmail,
      {
        type: MAIL_JOB_NAMES.verificationEmail,
        recipientEmail,
        recipientName,
        token,
      },
      VERIFICATION_EMAIL_JOB_OPTIONS,
    );
  }

  getVerificationEmailOptions(job: VerificationEmailJob): CreateEmailOptions {
    const verificationUrl = new URL(
      '/verify',
      this.configService.getOrThrow<string>('mail.webUrl'),
    );
    verificationUrl.searchParams.set('token', job.token);

    return {
      from: this.configService.getOrThrow<string>('mail.from'),
      to: job.recipientEmail,
      subject: 'Verify your Convo email address',
      html: this.mailTemplateService.renderVerificationEmail({
        recipientName: job.recipientName,
        verificationUrl: verificationUrl.toString(),
        expiresIn: `${this.configService.getOrThrow<number>('mail.verificationTokenTtl')} minutes`,
      }),
    };
  }
}
