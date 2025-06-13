import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
  MaxLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_TRAINEE_JOINED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title/header',
    example: 'New Trainee Joined!',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  header: string;

  @ApiProperty({
    description: 'Detailed notification content',
    example:
      'John Doe has joined your coaching program and is ready to start their fitness journey.',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'User ID to receive the notification',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Deep link to relevant app page',
    example: '/dashboard/trainees/123',
    required: false,
  })
  @IsString()
  @IsOptional()
  navigationLink?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: {
      entityId: '123',
      entityType: 'trainee',
      priority: 'normal',
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    entityId?: string;
    entityType?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    expiresAt?: Date;
    actionRequired?: boolean;
    [key: string]: any;
  };
}
