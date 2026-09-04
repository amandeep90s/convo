export type MailJobName = 'verification-email';

export type VerificationEmailJob = {
  type: MailJobName;
  recipientEmail: string;
  recipientName: string;
  token: string;
};

export type MailJob = VerificationEmailJob;

export type VerificationEmailTemplateOptions = {
  recipientName: string;
  verificationUrl: string;
  expiresIn: string;
};
