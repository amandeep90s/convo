import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { MailService } from '@/mail/mail.service';
import { MAIL_JOB_NAMES, MAIL_QUEUE_NAME } from '@/mail/queues/mail.queue';
import type { MailJob } from '@/mail/types/mail.types';

@Processor(MAIL_QUEUE_NAME)
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<MailJob>) {
    switch (job.data.type) {
      case MAIL_JOB_NAMES.verificationEmail:
        return this.mailService.send(
          this.mailService.getVerificationEmailOptions(job.data),
        );
      case MAIL_JOB_NAMES.passwordResetEmail:
        return this.mailService.send(
          this.mailService.getPasswordResetEmailOptions(job.data),
        );
      case MAIL_JOB_NAMES.loginOtpEmail:
        return this.mailService.send(
          this.mailService.getLoginOtpEmailOptions(job.data),
        );
      default:
        throw new Error(`Unsupported mail job: ${job.name}`);
    }
  }
}
