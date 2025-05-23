import { Injectable, Logger } from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';

export interface PendingRegistration {
  registrationData: RegisterDto;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class PendingRegistrationService {
  private readonly logger = new Logger(PendingRegistrationService.name);
  private readonly pendingRegistrations = new Map<
    string,
    PendingRegistration
  >();
  private readonly EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  constructor() {
    // Clean up expired registrations every hour
    setInterval(() => this.cleanupExpiredRegistrations(), 60 * 60 * 1000);
  }

  /**
   * Store a pending registration with OTP
   */
  storePendingRegistration(
    email: string,
    registrationData: RegisterDto,
    otp: string,
  ): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.EXPIRATION_TIME);

    this.pendingRegistrations.set(email, {
      registrationData,
      otp,
      createdAt: now,
      expiresAt,
    });

    this.logger.log(`Stored pending registration for email: ${email}`);
  }

  /**
   * Get pending registration by email
   */
  getPendingRegistration(email: string): PendingRegistration | null {
    return this.pendingRegistrations.get(email) || null;
  }

  /**
   * Get pending registration by OTP
   */
  getPendingRegistrationByOtp(
    otp: string,
  ): { email: string; registration: PendingRegistration } | null {
    for (const [email, registration] of this.pendingRegistrations.entries()) {
      if (registration.otp === otp) {
        return { email, registration };
      }
    }
    return null;
  }

  /**
   * Remove pending registration
   */
  removePendingRegistration(email: string): boolean {
    const deleted = this.pendingRegistrations.delete(email);
    if (deleted) {
      this.logger.log(`Removed pending registration for email: ${email}`);
    }
    return deleted;
  }

  /**
   * Check if a pending registration is expired
   */
  isExpired(registration: PendingRegistration): boolean {
    return new Date() > registration.expiresAt;
  }

  /**
   * Clean up expired pending registrations
   */
  private cleanupExpiredRegistrations(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [email, registration] of this.pendingRegistrations.entries()) {
      if (now > registration.expiresAt) {
        this.pendingRegistrations.delete(email);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(
        `Cleaned up ${cleanedCount} expired pending registrations`,
      );
    }
  }

  /**
   * Get total count of pending registrations (for monitoring)
   */
  getPendingCount(): number {
    return this.pendingRegistrations.size;
  }
}
