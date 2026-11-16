import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

import type {
  LoginOtpEmailTemplateOptions,
  PasswordResetEmailTemplateOptions,
  VerificationEmailTemplateOptions,
} from '@/mail/types/mail.types';

@Injectable()
export class MailTemplateService {
  private readonly verificationEmailTemplate = Handlebars.compile(
    readFileSync(
      join(__dirname, 'templates', 'verification-email.hbs'),
      'utf8',
    ),
  );
  private readonly passwordResetEmailTemplate = Handlebars.compile(
    readFileSync(
      join(__dirname, 'templates', 'password-reset-email.hbs'),
      'utf8',
    ),
  );
  private readonly loginOtpEmailTemplate = Handlebars.compile(
    readFileSync(join(__dirname, 'templates', 'login-otp-email.hbs'), 'utf8'),
  );

  renderVerificationEmail(options: VerificationEmailTemplateOptions) {
    return this.verificationEmailTemplate(options);
  }

  renderPasswordResetEmail(options: PasswordResetEmailTemplateOptions) {
    return this.passwordResetEmailTemplate(options);
  }

  renderLoginOtpEmail(options: LoginOtpEmailTemplateOptions) {
    return this.loginOtpEmailTemplate(options);
  }
}
