import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { AuthResponseDto, TokenResponseDto } from '../dtos/auth-response.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { LoginDto } from '../dtos/login.dto';
import {
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  VerifyPasswordResetOtpResponseDto,
} from '../dtos/password-reset-response.dto';
import {
  PreAuthRegistrationResponseDto,
  VerifyOtpDto,
} from '../dtos/preauth-registration.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RegisterDto } from '../dtos/register.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { VerifyPasswordResetOtpDto } from '../dtos/verify-password-reset-otp.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description:
      'Registration initiated. Please check email for verification code.',
    type: PreAuthRegistrationResponseDto,
  })
  @ApiConflictResponse({
    description: 'User with this email or phone already exists',
  })
  @Public()
  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<PreAuthRegistrationResponseDto> {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'User has been successfully authenticated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Login using guard-based authentication' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User has been successfully authenticated through guard',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login-with-guard')
  @HttpCode(HttpStatus.OK)
  async loginWithGuard(@Request() req) {
    // The user is automatically validated via LocalStrategy and attached to req
    return await this.authService.generateAuthResponse(req.user);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiOkResponse({
    description: 'Tokens have been successfully refreshed',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body(ValidationPipe) refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @ApiOperation({ summary: 'Verify OTP and complete registration' })
  @ApiOkResponse({
    description: 'OTP verified successfully and user account created',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid OTP, preAuthToken, or expired registration session',
  })
  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body(ValidationPipe) verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtpAndCreateAccount(
      verifyOtpDto.preAuthToken,
      verifyOtpDto.otp,
    );
  }

  @ApiOperation({ summary: 'Initiate forgot password flow' })
  @ApiOkResponse({
    description: 'OTP sent to email if account exists',
    type: ForgotPasswordResponseDto,
  })
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
    @Request() req,
  ): Promise<ForgotPasswordResponseDto> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');
    return this.authService.forgotPassword(
      forgotPasswordDto,
      ipAddress,
      userAgent,
    );
  }

  @ApiOperation({ summary: 'Verify OTP for password reset' })
  @ApiOkResponse({
    description: 'OTP verified successfully, reset token provided',
    type: VerifyPasswordResetOtpResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired OTP' })
  @Public()
  @Post('verify-password-reset-otp')
  @HttpCode(HttpStatus.OK)
  async verifyPasswordResetOtp(
    @Body(ValidationPipe) verifyOtpDto: VerifyPasswordResetOtpDto,
  ): Promise<VerifyPasswordResetOtpResponseDto> {
    return this.authService.verifyPasswordResetOtp(verifyOtpDto);
  }

  @ApiOperation({ summary: 'Reset password with verified token' })
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired reset token' })
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
    @Request() req,
  ): Promise<ResetPasswordResponseDto> {
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');
    return this.authService.resetPassword(
      resetPasswordDto,
      ipAddress,
      userAgent,
    );
  }
}
