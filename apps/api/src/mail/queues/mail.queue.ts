import type { JobsOptions } from 'bullmq';

export const MAIL_QUEUE_NAME = 'mail';

export const MAIL_JOB_NAMES = {
  verificationEmail: 'verification-email',
} as const;

export const VERIFICATION_EMAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: false,
};
