import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  NotificationType,
  NotificationStatus,
} from '../entities/notification.entity';

export class NotificationQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({
    description: 'Filter by notification type(s)',
    enum: NotificationType,
    isArray: true,
    required: false,
    example: [
      NotificationType.NEW_TRAINEE_JOINED,
      NotificationType.MESSAGE_RECEIVED,
    ],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationType, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return [value];
    }
    return Array.isArray(value) ? value : [];
  })
  type?: NotificationType[];

  @ApiProperty({
    description: 'Filter by notification status',
    enum: NotificationStatus,
    required: false,
    example: NotificationStatus.UNREAD,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({
    description: 'Sort order for timestamp',
    enum: ['ASC', 'DESC'],
    example: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Filter by user ID (admin only)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdateNotificationStatusDto {
  @ApiProperty({
    description: 'New notification status',
    enum: NotificationStatus,
    example: NotificationStatus.READ,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

export class BulkUpdateNotificationsDto {
  @ApiProperty({
    description: 'Array of notification IDs to update',
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  notificationIds: string[];

  @ApiProperty({
    description: 'New status for all notifications',
    enum: NotificationStatus,
    example: NotificationStatus.READ,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}
