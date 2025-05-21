import { ApiProperty } from '@nestjs/swagger';
import { UserEntity, UserRole } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'The first name of the user' })
  firstName: string;

  @ApiProperty({ description: 'The last name of the user' })
  lastName: string;

  @ApiProperty({ description: 'The email address of the user' })
  email: string;

  @ApiProperty({ description: 'The phone number of the user' })
  phone: string;

  @ApiProperty({
    description: 'The role of the user in the system',
    enum: UserRole,
  })
  role: UserRole;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'When the user account was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the user account was last updated' })
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'The authenticated user information',
    type: UserResponseDto,
  })
  user: Partial<UserEntity>;

  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
