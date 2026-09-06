import { Injectable } from '@nestjs/common';

import { MailService } from '@/mail/mail.service';

@Injectable()
export class SendVerificationEmailProvider {
  constructor(
    /**
     * Injecting Mail service to send verification emails
     */
    private readonly mailService: MailService,
  ) {}

  async send(email: string, name: string, token: string): Promise<void> {
    await this.mailService.sendVerificationEmail(email, name, token);
  }
}
