export type VerificationEmailJob = {
  type: 'verification-email';
  recipientEmail: string;
  recipientName: string;
  token: string;
};

export type PasswordResetEmailJob = {
  type: 'password-reset-email';
  recipientEmail: string;
  recipientName: string;
  token: string;
};

export type LoginOtpEmailJob = {
  type: 'login-otp-email';
  recipientEmail: string;
  recipientName: string;
  code: string;
  expiresIn: string;
};

export type MailJob =
  VerificationEmailJob | PasswordResetEmailJob | LoginOtpEmailJob;

export type VerificationEmailTemplateOptions = {
  recipientName: string;
  verificationUrl: string;
  expiresIn: string;
};

export type PasswordResetEmailTemplateOptions = {
  recipientName: string;
  resetUrl: string;
  expiresIn: string;
};

export type LoginOtpEmailTemplateOptions = {
  recipientName: string;
  code: string;
  expiresIn: string;
};
