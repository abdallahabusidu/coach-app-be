import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class PreAuthRegistrationResponseDto {
  @ApiProperty({
    description: 'Pre-authentication token for verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  preAuthToken: string;

  @ApiProperty({
    description: 'Confirmation message',
    example:
      'Registration initiated. Please check your email for the verification code.',
  })
  message: string;

  @ApiProperty({
    description: 'Email where verification code was sent',
    example: 'user@example.com',
  })
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Pre-authentication token received during registration',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  preAuthToken: string;

  @ApiProperty({
    description: 'One-time password received via email',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp: string;
}
