import { Injectable, Logger } from '@nestjs/common';

export interface PasswordResetOtp {
  email: string;
  otp: string;
  createdAt: Date;
  isUsed: boolean;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly passwordResetOtps = new Map<string, PasswordResetOtp>();
  private readonly OTP_EXPIRATION_MINUTES = 10; // OTP expires in 10 minutes

  /**
   * Store password reset OTP for an email
   */
  storePasswordResetOtp(
    email: string,
    otp: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    const passwordResetData: PasswordResetOtp = {
      email,
      otp,
      createdAt: new Date(),
      isUsed: false,
      ipAddress,
      userAgent,
    };

    this.passwordResetOtps.set(email, passwordResetData);

    // Auto-cleanup after expiration
    setTimeout(
      () => {
        this.passwordResetOtps.delete(email);
      },
      this.OTP_EXPIRATION_MINUTES * 60 * 1000,
    );

    this.logger.log(`Password reset OTP stored for email: ${email}`);
  }

  /**
   * Get password reset OTP data for an email
   */
  getPasswordResetOtp(email: string): PasswordResetOtp | undefined {
    return this.passwordResetOtps.get(email);
  }

  /**
   * Verify password reset OTP
   */
  verifyPasswordResetOtp(email: string, otp: string): boolean {
    const storedData = this.passwordResetOtps.get(email);

    if (!storedData) {
      this.logger.warn(`No password reset OTP found for email: ${email}`);
      return false;
    }

    if (storedData.isUsed) {
      this.logger.warn(`Password reset OTP already used for email: ${email}`);
      return false;
    }

    if (this.isPasswordResetOtpExpired(storedData)) {
      this.logger.warn(`Password reset OTP expired for email: ${email}`);
      this.passwordResetOtps.delete(email);
      return false;
    }

    if (storedData.otp !== otp) {
      this.logger.warn(`Invalid password reset OTP for email: ${email}`);
      return false;
    }

    // Mark as used
    storedData.isUsed = true;
    this.passwordResetOtps.set(email, storedData);

    this.logger.log(
      `Password reset OTP verified successfully for email: ${email}`,
    );
    return true;
  }

  /**
   * Check if password reset OTP is expired
   */
  isPasswordResetOtpExpired(passwordResetData: PasswordResetOtp): boolean {
    const now = new Date();
    const expirationTime = new Date(
      passwordResetData.createdAt.getTime() +
        this.OTP_EXPIRATION_MINUTES * 60 * 1000,
    );
    return now > expirationTime;
  }

  /**
   * Remove password reset OTP data
   */
  removePasswordResetOtp(email: string): void {
    this.passwordResetOtps.delete(email);
    this.logger.log(`Password reset OTP removed for email: ${email}`);
  }

  /**
   * Check if password reset OTP exists and is valid
   */
  hasValidPasswordResetOtp(email: string): boolean {
    const storedData = this.passwordResetOtps.get(email);
    return (
      storedData &&
      !storedData.isUsed &&
      !this.isPasswordResetOtpExpired(storedData)
    );
  }

  /**
   * Get password reset attempt info for logging
   */
  getPasswordResetAttemptInfo(
    email: string,
  ): Partial<PasswordResetOtp> | undefined {
    const storedData = this.passwordResetOtps.get(email);
    if (!storedData) return undefined;

    return {
      email: storedData.email,
      createdAt: storedData.createdAt,
      ipAddress: storedData.ipAddress,
      userAgent: storedData.userAgent,
    };
  }
}
