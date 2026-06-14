import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;
  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get('RESEND_API_KEY'));
  }

  async send(to: string, subject: string, html: string) {
    return this.resend.emails.send({
      from: this.config.get('RESEND_FROM') || 'noreply@example.com',
      to,
      subject,
      html,
    });
  }
}
