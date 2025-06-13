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
import { CoachProfileEntity } from '../../coach/entities/coach-profile.entity';

export enum ActivityType {
  WORKOUT_COMPLETED = 'workout_completed',
  MEAL_LOGGED = 'meal_logged',
  WEIGHT_RECORDED = 'weight_recorded',
  GOAL_ACHIEVED = 'goal_achieved',
  CHECK_IN = 'check_in',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

@Entity('trainee_progress')
export class TraineeProgressEntity {
  @ApiProperty({ description: 'Unique identifier for the progress record' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Reference to the trainee user' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee user ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Reference to the coach' })
  @ManyToOne(() => CoachProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: CoachProfileEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Current workout plan completion percentage' })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  workoutCompletionPercentage: number;

  @ApiProperty({ description: 'Total workouts completed' })
  @Column({ default: 0 })
  totalWorkoutsCompleted: number;

  @ApiProperty({ description: 'Current weight in kg' })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  currentWeight?: number;

  @ApiProperty({ description: 'Target weight in kg' })
  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  targetWeight?: number;

  @ApiProperty({ description: 'Current subscription status' })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @Index()
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ description: 'Date when subscription started' })
  @Column({ type: 'date', nullable: true })
  subscriptionStartDate?: Date;

  @ApiProperty({ description: 'Date when subscription ends' })
  @Column({ type: 'date', nullable: true })
  subscriptionEndDate?: Date;

  @ApiProperty({ description: 'Last activity date' })
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  lastActivityDate?: Date;

  @ApiProperty({ description: 'Last activity type' })
  @Column({
    type: 'enum',
    enum: ActivityType,
    nullable: true,
  })
  lastActivityType?: ActivityType;

  @ApiProperty({ description: 'Additional progress notes' })
  @Column('text', { nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Progress data in JSON format' })
  @Column('jsonb', { default: '{}' })
  progressData: {
    weeklyGoals?: {
      workouts: number;
      achieved: number;
    };
    measurements?: {
      date: string;
      weight: number;
      bodyFat?: number;
      muscleMass?: number;
    }[];
    achievements?: {
      type: string;
      description: string;
      date: string;
    }[];
  };

  @ApiProperty({ description: 'When the progress record was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the progress record was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
