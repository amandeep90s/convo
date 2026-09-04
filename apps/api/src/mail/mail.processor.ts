import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

import { MailService } from './mail.service';
import { MAIL_JOB_NAMES, MAIL_QUEUE_NAME } from './queues/mail.queue';
import type { MailJob } from './types/mail.types';

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
      default:
        throw new Error(`Unsupported mail job: ${job.name}`);
    }
  }
}
