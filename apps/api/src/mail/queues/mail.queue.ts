import type { JobsOptions } from 'bullmq';

export const MAIL_QUEUE_NAME = 'mail';

export const MAIL_JOB_NAMES = {
  verificationEmail: 'verification-email',
  passwordResetEmail: 'password-reset-email',
  loginOtpEmail: 'login-otp-email',
} as const;

export const VERIFICATION_EMAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: false,
};

export const PASSWORD_RESET_EMAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: false,
};

export const LOGIN_OTP_EMAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5_000 },
  removeOnComplete: true,
  removeOnFail: false,
};
