import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';

import type { VerificationEmailTemplateOptions } from '@/mail/types/mail.types';

@Injectable()
export class MailTemplateService {
  private readonly verificationEmailTemplate = Handlebars.compile(
    readFileSync(
      join(__dirname, 'templates', 'verification-email.hbs'),
      'utf8',
    ),
  );

  renderVerificationEmail(options: VerificationEmailTemplateOptions) {
    return this.verificationEmailTemplate(options);
  }
}
