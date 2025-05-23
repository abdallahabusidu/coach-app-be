import { ApiProperty } from '@nestjs/swagger';

export class PendingRegistrationResponseDto {
  @ApiProperty({
    description: 'Confirmation message',
    example:
      'Registration pending. Please check your email to verify your account.',
  })
  message: string;

  @ApiProperty({
    description: 'Email where verification was sent',
    example: 'user@example.com',
  })
  email: string;
}
