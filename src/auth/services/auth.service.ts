import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/services/email.service';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { LoginDto } from '../dtos/login.dto';
import {
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  VerifyPasswordResetOtpResponseDto,
} from '../dtos/password-reset-response.dto';
import { PreAuthRegistrationResponseDto } from '../dtos/preauth-registration.dto';
import { RegisterDto } from '../dtos/register.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { VerifyPasswordResetOtpDto } from '../dtos/verify-password-reset-otp.dto';
import { UserEntity } from '../entities/user.entity';
import { PasswordResetService } from './password-reset.service';
import { PendingRegistrationService } from './pending-registration.service';
import { VerificationService } from './verification.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly verificationService: VerificationService,
    private readonly pendingRegistrationService: PendingRegistrationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailService: EmailService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<PreAuthRegistrationResponseDto> {
    // Check if user already exists with email or phone
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Generate preAuthToken (JWT containing email and expiration)
    const preAuthToken = this.generatePreAuthToken(registerDto.email);

    // Check if there's already a pending registration for this email
    const existingPending =
      this.pendingRegistrationService.getPendingRegistration(registerDto.email);
    if (
      existingPending &&
      !this.pendingRegistrationService.isExpired(existingPending)
    ) {
      // If there's a non-expired pending registration, just resend the email with new OTP
      try {
        await this.emailService.sendOtpEmail(
          registerDto.email,
          otp,
          registerDto.firstName,
        );
        this.logger.log(`Resent OTP email to ${registerDto.email}`);

        // Update the existing pending registration with new OTP
        this.pendingRegistrationService.storePendingRegistration(
          registerDto.email,
          registerDto,
          otp,
        );
      } catch (error) {
        this.logger.error(`Failed to resend OTP email: ${error.message}`);
      }

      return {
        preAuthToken,
        message:
          'Registration initiated. Please check your email for the verification code.',
        email: registerDto.email,
      };
    }

    // Store pending registration with OTP
    this.pendingRegistrationService.storePendingRegistration(
      registerDto.email,
      registerDto,
      otp,
    );

    // Send OTP email
    try {
      await this.emailService.sendOtpEmail(
        registerDto.email,
        otp,
        registerDto.firstName,
      );
      this.logger.log(
        `OTP email sent to ${registerDto.email} for registration`,
      );
    } catch (error) {
      this.logger.error(`Failed to send OTP email: ${error.message}`);
      // Remove pending registration if email fails
      this.pendingRegistrationService.removePendingRegistration(
        registerDto.email,
      );
      throw new Error('Failed to send verification email. Please try again.');
    }

    return {
      preAuthToken,
      message:
        'Registration initiated. Please check your email for the verification code.',
      email: registerDto.email,
    };
  }

  async login(loginDto: LoginDto): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Generate auth response with tokens
    return await this.generateAuthResponse(user);
  }

  async findUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async validateUser(userId: string): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }

  generateAccessToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access_token',
    };

    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: UserEntity): Promise<string> {
    const payload = {
      sub: user.id,
      type: 'refresh_token',
    };

    // Create refresh token with longer expiration
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    // Store the refresh token and its expiration in the database
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // Default 7 days

    // Use query builder to update only the refresh token fields without triggering hooks
    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({
        refreshToken: refreshToken,
        refreshTokenExpires: refreshTokenExpires,
      })
      .where('id = :id', { id: user.id })
      .execute();

    return refreshToken;
  }

  async generateAuthResponse(user: UserEntity): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Fetch fresh user data to avoid any password rehashing
    const freshUser = await this.userRepository.findOne({
      where: { id: user.id },
    });

    // Create a safe user response object without sensitive data
    const {
      password,
      refreshToken: userRefreshToken,
      ...userResponse
    } = freshUser;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      if (payload.type !== 'refresh_token') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find the user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpires < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      } // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw the original UnauthorizedException
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate preAuthToken (JWT containing email and expiration)
   */
  generatePreAuthToken(email: string): string {
    const payload = {
      email,
      type: 'pre_auth_token',
      purpose: 'email_verification',
    };

    return this.jwtService.sign(payload, {
      expiresIn: '24h', // preAuthToken expires in 24 hours
    });
  }

  /**
   * Verify and decode preAuthToken
   */
  verifyPreAuthToken(token: string): { email: string } {
    try {
      const payload = this.jwtService.verify(token);

      if (
        payload.type !== 'pre_auth_token' ||
        payload.purpose !== 'email_verification'
      ) {
        throw new UnauthorizedException('Invalid preAuthToken');
      }

      return { email: payload.email };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired preAuthToken');
    }
  }

  /**
   * Verify OTP and create user account
   */
  async verifyOtpAndCreateAccount(
    preAuthToken: string,
    otp: string,
  ): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify preAuthToken
    const { email } = this.verifyPreAuthToken(preAuthToken);

    // Get pending registration
    const pendingRegistration =
      this.pendingRegistrationService.getPendingRegistration(email);

    if (!pendingRegistration) {
      throw new UnauthorizedException(
        'No pending registration found for this email',
      );
    }

    // Check if expired
    if (this.pendingRegistrationService.isExpired(pendingRegistration)) {
      this.pendingRegistrationService.removePendingRegistration(email);
      throw new UnauthorizedException(
        'Registration session expired. Please register again.',
      );
    }

    // Verify OTP
    if (pendingRegistration.otp !== otp) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Check if user already exists (edge case)
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: pendingRegistration.registrationData.email },
        { phone: pendingRegistration.registrationData.phone },
      ],
    });

    if (existingUser) {
      this.pendingRegistrationService.removePendingRegistration(email);
      throw new ConflictException('User already exists');
    }

    // Create the user account
    let user = this.userRepository.create({
      ...pendingRegistration.registrationData,
      isEmailVerified: true, // Mark as verified since they just verified
    });

    user = await this.userRepository.save(user);

    // Remove from pending registrations
    this.pendingRegistrationService.removePendingRegistration(email);

    this.logger.log(
      `User account created after OTP verification: ${user.email}`,
    );

    // Send welcome email (async, don't wait for it)
    this.sendWelcomeEmailAsync(user);

    // Generate auth response with tokens
    return await this.generateAuthResponse(user);
  }

  /**
   * Send welcome email asynchronously after user registration
   * This method doesn't block the registration response
   */
  private async sendWelcomeEmailAsync(user: UserEntity): Promise<void> {
    try {
      const userName =
        `${user.firstName} ${user.lastName}`.trim() || user.firstName || 'User';
      await this.emailService.sendWelcomeEmail(user.email, userName, user.role);
      this.logger.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${user.email}: ${error.message}`,
      );
      // Don't throw error since welcome email is not critical for registration flow
    }
  }

  /**
   * Initiate forgot password flow by sending OTP to email
   */
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ForgotPasswordResponseDto> {
    const { email } = forgotPasswordDto;

    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // For security reasons, don't reveal if email exists or not
      // Always return success to prevent email enumeration attacks
      this.logger.warn(
        `Forgot password attempt for non-existent email: ${email}`,
      );
      return {
        message:
          'If an account with this email exists, an OTP has been sent to your email address',
        email,
      };
    }

    // Generate 6-digit OTP
    const otp = this.generateOtp();

    // Store password reset OTP
    this.passwordResetService.storePasswordResetOtp(
      email,
      otp,
      ipAddress,
      userAgent,
    );

    try {
      // Send password reset email with OTP
      await this.emailService.sendPasswordResetOtpEmail(
        email,
        otp,
        user.firstName,
        ipAddress,
        userAgent,
      );
      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP email: ${error.message}`,
      );
      // Don't expose email sending errors to client
    }

    return {
      message:
        'If an account with this email exists, an OTP has been sent to your email address',
      email,
    };
  }

  /**
   * Verify OTP for password reset and return reset token
   */
  async verifyPasswordResetOtp(
    verifyOtpDto: VerifyPasswordResetOtpDto,
  ): Promise<VerifyPasswordResetOtpResponseDto> {
    const { email, otp } = verifyOtpDto;

    // Verify OTP
    const isValidOtp = this.passwordResetService.verifyPasswordResetOtp(
      email,
      otp,
    );

    if (!isValidOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Generate reset token (short-lived JWT)
    const resetToken = this.jwtService.sign(
      { email, type: 'password-reset' },
      { expiresIn: '15m' }, // Reset token expires in 15 minutes
    );

    this.logger.log(`Password reset OTP verified for email: ${email}`);

    return {
      message: 'OTP verified successfully',
      resetToken,
    };
  }

  /**
   * Reset password using verified reset token
   */
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ResetPasswordResponseDto> {
    const { email, resetToken, newPassword } = resetPasswordDto;

    try {
      // Verify reset token
      const decoded = this.jwtService.verify(resetToken);

      if (decoded.email !== email || decoded.type !== 'password-reset') {
        throw new BadRequestException('Invalid reset token');
      }
    } catch (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update password
    user.password = newPassword; // This will be hashed by the entity's beforeInsert/beforeUpdate hook
    await this.userRepository.save(user);

    // Clean up password reset data
    this.passwordResetService.removePasswordResetOtp(email);

    this.logger.log(`Password reset successfully for user: ${email}`);

    // Send password change confirmation email
    try {
      await this.emailService.sendPasswordResetConfirmationEmail(
        email,
        user.firstName,
        ipAddress,
        userAgent,
      );
      this.logger.log(`Password reset confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset confirmation email: ${error.message}`,
      );
    }

    return {
      message: 'Password reset successfully',
    };
  }
}
