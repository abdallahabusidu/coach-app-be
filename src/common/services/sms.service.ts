import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Send an SMS
   * In production, this would use a proper SMS provider like Twilio, Nexmo, etc.
   * For development, we're just logging the message
   */
  async sendSms(options: SmsOptions): Promise<boolean> {
    try {
      // For development, just log the SMS
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.debug(`
          -------------------------
          SMS SENT (DEVELOPMENT)
          -------------------------
          To: ${options.to}
          Message: ${options.message}
          -------------------------
        `);
        return true;
      }

      // In production, would implement actual SMS sending
      // For example with Twilio:
      // await this.twilioClient.messages.create({
      //   body: options.message,
      //   from: this.configService.get('SMS_FROM'),
      //   to: options.to
      // });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Send a verification SMS with a code
   */
  async sendVerificationSms(
    phoneNumber: string,
    verificationCode: string,
  ): Promise<boolean> {
    return this.sendSms({
      to: phoneNumber,
      message: `Your verification code for the Fitness Coach app is: ${verificationCode}. This code will expire in 10 minutes.`,
    });
  }
}
