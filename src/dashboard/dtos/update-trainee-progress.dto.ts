import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsObject,
} from 'class-validator';
import {
  ActivityType,
  SubscriptionStatus,
} from '../entities/trainee-progress.entity';

export class UpdateTraineeProgressDto {
  @ApiProperty({
    description: 'Current workout plan completion percentage',
    example: 75.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  workoutCompletionPercentage?: number;

  @ApiProperty({
    description: 'Total workouts completed',
    example: 15,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  totalWorkoutsCompleted?: number;

  @ApiProperty({
    description: 'Current weight in kg',
    example: 72.5,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  currentWeight?: number;

  @ApiProperty({
    description: 'Target weight in kg',
    example: 70.0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  targetWeight?: number;

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    required: false,
  })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({
    description: 'Last activity type',
    enum: ActivityType,
    required: false,
  })
  @IsEnum(ActivityType)
  @IsOptional()
  lastActivityType?: ActivityType;

  @ApiProperty({
    description: 'Progress notes',
    example: 'Great progress this week!',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Additional progress data',
    example: {
      weeklyGoals: {
        workouts: 4,
        achieved: 3,
      },
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  progressData?: any;
}
