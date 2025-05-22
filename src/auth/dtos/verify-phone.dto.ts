import { IsNotEmpty, IsString, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneDto {
  @ApiProperty({
    description: "The verification code sent to the user's phone",
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;

  @ApiProperty({
    description: 'The phone number to verify',
    example: '+12025550179',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}

export class RequestPhoneVerificationDto {
  @ApiProperty({
    description: 'The phone number to verify',
    example: '+12025550179',
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
