import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send an email
   * In production, this would use a proper email provider like SendGrid, Mailgun, etc.
   * For development, we're just logging the email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // For development, just log the email
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.debug(`
          -------------------------
          EMAIL SENT (DEVELOPMENT)
          -------------------------
          To: ${options.to}
          Subject: ${options.subject}
          Content: ${options.text || options.html}
          -------------------------
        `);
        return true;
      }

      // In production, would implement actual email sending
      // For example with SendGrid:
      // const msg = {
      //   to: options.to,
      //   from: this.configService.get('EMAIL_FROM'),
      //   subject: options.subject,
      //   text: options.text,
      //   html: options.html,
      // };
      // await this.sendGridClient.send(msg);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a verification email
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    userName: string = 'User',
  ): Promise<boolean> {
    const verifyUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Hello ${userName},</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify Email</a></p>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verifyUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
      text: `Hello ${userName}, please verify your email address by visiting this link: ${verifyUrl}. This link will expire in 24 hours.`,
    });
  }
}
