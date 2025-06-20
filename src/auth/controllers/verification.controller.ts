import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import {
  RequestEmailVerificationDto,
  VerifyEmailDto,
} from '../dtos/verify-email.dto';
import {
  RequestPhoneVerificationDto,
  VerifyPhoneDto,
} from '../dtos/verify-phone.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VerificationService } from '../services/verification.service';
import {
  ApiSuccessResponse,
  ApiAuthResponses,
} from '../../common/decorators/api-responses.decorator';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  // Email verification endpoints
  @ApiOperation({
    summary: 'Request email verification',
    description: 'Send a verification email to the provided email address',
  })
  @ApiSuccessResponse('Email verification requested successfully')
  @Public()
  @Post('email/request')
  @HttpCode(HttpStatus.OK)
  async requestEmailVerification(@Body() dto: RequestEmailVerificationDto) {
    return await this.verificationService.requestEmailVerification(dto);
  }

  @ApiOperation({
    summary: 'Verify email with token',
    description: 'Verify email address using the token received via email',
  })
  @ApiSuccessResponse('Email verified successfully')
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired verification token.',
  })
  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return await this.verificationService.verifyEmail(dto);
  }

  @ApiOperation({
    summary: 'Generate a new email verification token (authenticated users)',
    description: 'Generate a new verification token for authenticated users',
  })
  @ApiSuccessResponse('Token generated successfully')
  @ApiAuthResponses()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('email/generate-token')
  @HttpCode(HttpStatus.OK)
  async generateEmailToken(@CurrentUser() user) {
    const token = await this.verificationService.generateEmailVerificationToken(
      user.id,
    );
    return { token };
  }

  // Phone verification endpoints
  @ApiOperation({ summary: 'Request phone verification' })
  @ApiResponse({
    status: 200,
    description: 'Phone verification requested successfully.',
  })
  @Public()
  @Post('phone/request')
  @HttpCode(HttpStatus.OK)
  async requestPhoneVerification(@Body() dto: RequestPhoneVerificationDto) {
    return await this.verificationService.requestPhoneVerification(dto);
  }

  @ApiOperation({ summary: 'Verify phone with code' })
  @ApiResponse({
    status: 200,
    description: 'Phone verified successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired verification code.',
  })
  @Public()
  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPhone(@Body() dto: VerifyPhoneDto) {
    return await this.verificationService.verifyPhone(dto);
  }

  @ApiOperation({
    summary: 'Generate a new phone verification code (authenticated users)',
  })
  @ApiResponse({
    status: 200,
    description: 'Code generated successfully.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('phone/generate-code')
  @HttpCode(HttpStatus.OK)
  async generatePhoneCode(@CurrentUser() user) {
    const code = await this.verificationService.generatePhoneVerificationCode(
      user.id,
    );
    return { code };
  }

  // Check verification status
  @ApiOperation({ summary: 'Check verification status' })
  @ApiResponse({
    status: 200,
    description: 'Returns verification status for email and phone.',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getVerificationStatus(@CurrentUser() user) {
    return await this.verificationService.getVerificationStatus(user.id);
  }
}
