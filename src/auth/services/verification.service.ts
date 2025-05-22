import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import {
  VerifyEmailDto,
  RequestEmailVerificationDto,
} from '../dtos/verify-email.dto';
import {
  VerifyPhoneDto,
  RequestPhoneVerificationDto,
} from '../dtos/verify-phone.dto';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  // Email verification methods
  async generateEmailVerificationToken(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a verification token
    const token = uuidv4();

    // Set token expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update the user record with the token and expiration
    user.emailVerificationToken = token;
    user.emailVerificationExpires = expiresAt;

    await this.userRepository.save(user);

    // In a real application, this would send an email with the token
    // For testing purposes, we'll just return the token
    return token;
  }

  async requestEmailVerification(
    dto: RequestEmailVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return {
        message:
          'If your email is registered, a verification link has been sent.',
      };
    }

    try {
      // Generate a new token
      const token = await this.generateEmailVerificationToken(user.id);

      // Send the verification email
      await this.emailService.sendVerificationEmail(
        user.email,
        token,
        user.firstName,
      );

      this.logger.log(`Email verification sent to ${user.email}`);

      return {
        message:
          'If your email is registered, a verification link has been sent.',
      };
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      return {
        message:
          'If your email is registered, a verification link has been sent.',
      };
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: dto.token },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    // Check if the token is expired
    const now = new Date();
    if (user.emailVerificationExpires < now) {
      throw new UnauthorizedException('Verification token expired');
    }

    // Mark the email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  // Phone verification methods
  async generatePhoneVerificationCode(userId: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Set code expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Update the user record with the code and expiration
    user.phoneVerificationCode = code;
    user.phoneVerificationExpires = expiresAt;

    await this.userRepository.save(user);

    // In a real application, this would send an SMS with the code
    // For testing purposes, we'll just return the code
    return code;
  }

  async requestPhoneVerification(
    dto: RequestPhoneVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { phone: dto.phone },
    });

    if (!user) {
      // Don't reveal that the user doesn't exist for security
      return {
        message:
          'If your phone number is registered, a verification code has been sent.',
      };
    }

    try {
      // Generate a new code
      const code = await this.generatePhoneVerificationCode(user.id);

      // Send the verification SMS
      await this.smsService.sendVerificationSms(user.phone, code);

      this.logger.log(`SMS verification sent to ${user.phone}`);

      return {
        message:
          'If your phone number is registered, a verification code has been sent.',
      };
    } catch (error) {
      this.logger.error(`Failed to send verification SMS: ${error.message}`);
      return {
        message:
          'If your phone number is registered, a verification code has been sent.',
      };
    }
  }

  async verifyPhone(dto: VerifyPhoneDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { phone: dto.phone, phoneVerificationCode: dto.code },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Check if the code is expired
    const now = new Date();
    if (user.phoneVerificationExpires < now) {
      throw new UnauthorizedException('Verification code expired');
    }

    // Mark the phone as verified
    user.isPhoneVerified = true;
    user.phoneVerificationCode = null;
    user.phoneVerificationExpires = null;

    await this.userRepository.save(user);

    return { message: 'Phone verified successfully' };
  }

  // Check verification status
  async getVerificationStatus(
    userId: string,
  ): Promise<{ isEmailVerified: boolean; isPhoneVerified: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    };
  }
}
