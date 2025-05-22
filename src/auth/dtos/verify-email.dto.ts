import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: "The verification token sent to the user's email",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  token: string;
}

export class RequestEmailVerificationDto {
  @ApiProperty({
    description: 'The email address of the user to verify',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;
}
