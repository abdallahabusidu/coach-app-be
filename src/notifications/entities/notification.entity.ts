import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';

export enum NotificationType {
  TASK_COMPLETED = 'task_completed',
  MISSED_TASK = 'missed_task',
  NEW_TRAINEE_JOINED = 'new_trainee_joined',
  MESSAGE_RECEIVED = 'message_received',
  PAYMENT_DUE = 'payment_due',
  WORKOUT_REMINDER = 'workout_reminder',
  MEAL_REMINDER = 'meal_reminder',
  GOAL_ACHIEVED = 'goal_achieved',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  CERTIFICATE_EXPIRING = 'certificate_expiring',
  PROFILE_INCOMPLETE = 'profile_incomplete',
  SYSTEM_UPDATE = 'system_update',
  PROMOTIONAL = 'promotional',
}

export enum NotificationStatus {
  READ = 'read',
  UNREAD = 'unread',
}

@Entity('notifications')
export class NotificationEntity {
  @ApiProperty({ description: 'Unique identifier for the notification' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.NEW_TRAINEE_JOINED,
  })
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Index()
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title/header',
    example: 'New Trainee Joined!',
  })
  @Column({ length: 200 })
  header: string;

  @ApiProperty({
    description: 'Detailed notification content',
    example:
      'John Doe has joined your coaching program and is ready to start their fitness journey.',
  })
  @Column('text')
  description: string;

  @ApiProperty({
    description: 'Notification status',
    enum: NotificationStatus,
    example: NotificationStatus.UNREAD,
  })
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  @Index()
  status: NotificationStatus;

  @ApiProperty({
    description: 'Deep link to relevant app page',
    example: '/dashboard/trainees/123',
    required: false,
  })
  @Column({ nullable: true })
  navigationLink?: string;

  @ApiProperty({
    description: 'Reference to the user receiving the notification',
  })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @ApiProperty({ description: 'User ID receiving the notification' })
  @Column()
  @Index()
  userId: string;

  @ApiProperty({ description: 'Additional metadata for the notification' })
  @Column('jsonb', { default: '{}' })
  metadata: {
    entityId?: string;
    entityType?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    expiresAt?: Date;
    actionRequired?: boolean;
    [key: string]: any;
  };

  @ApiProperty({ description: 'When the notification was created' })
  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @ApiProperty({ description: 'When the notification was read (if read)' })
  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @ApiProperty({ description: 'When the notification was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
