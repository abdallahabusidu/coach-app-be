import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailUser = this.configService.get('EMAIL_USER');
    const emailPassword = this.configService.get('EMAIL_PASSWORD');

    if (
      emailUser &&
      emailPassword &&
      this.configService.get('NODE_ENV') !== 'development'
    ) {
      // Use Gmail SMTP (you can change this to other providers)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    }
  }

  /**
   * Send an email
   * In production, this would use a proper email provider like SendGrid, Mailgun, etc.
   * For development, we're just logging the email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // For development, just log the email
      if (
        this.configService.get('NODE_ENV') === 'development' ||
        !this.transporter
      ) {
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

      // Send actual email using nodemailer
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM'),
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a verification email with OTP
   */
  async sendVerificationEmail(
    email: string,
    token: string,
    userName: string = 'User',
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Your Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello ${userName},</h1>
          <p style="font-size: 16px; line-height: 1.5;">
            Thank you for signing up! Please use the verification code below to verify your email address:
          </p>
          <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${token}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">
            This verification code will expire in 5 minutes.
          </p>
          <p style="font-size: 14px; color: #666;">
            If you did not request this verification, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your email verification code is: ${token}. This code will expire in 5 minutes. If you did not request this verification, please ignore this email.`,
    });
  }

  /**
   * Send OTP for general purposes
   */
  async sendOTP(
    email: string,
    otp: string,
    purpose: string = 'verification',
    userName: string = 'User',
    expiryMinutes: number = 5,
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Your ${purpose} Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello ${userName},</h1>
          <p style="font-size: 16px; line-height: 1.5;">
            Here is your ${purpose} code:
          </p>
          <div style="background-color: #f8f9fa; border: 2px dashed #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #28a745; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">
            This code will expire in ${expiryMinutes} minutes.
          </p>
          <p style="font-size: 14px; color: #666;">
            If you did not request this code, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
      text: `Hello ${userName}, your ${purpose} code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`,
    });
  }
}
