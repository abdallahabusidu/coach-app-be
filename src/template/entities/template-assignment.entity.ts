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
import { TemplateEntity } from './template.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum AssignmentStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('template_assignments')
export class TemplateAssignmentEntity {
  @ApiProperty({ description: 'Unique identifier for the template assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Template being assigned' })
  @ManyToOne(() => TemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  template: TemplateEntity;

  @ApiProperty({ description: 'Template ID' })
  @Column()
  @Index()
  templateId: string;

  @ApiProperty({ description: 'Trainee receiving the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach who made the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({
    description: 'Status of the assignment',
    enum: AssignmentStatus,
  })
  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.SCHEDULED,
  })
  @Index()
  status: AssignmentStatus;

  @ApiProperty({ description: 'When the template should start' })
  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @ApiProperty({ description: 'When the template should end' })
  @Column({ type: 'date' })
  endDate: Date;

  @ApiProperty({
    description: 'Custom modifications to the template for this trainee',
  })
  @Column('jsonb', { nullable: true })
  customizations?: {
    modifiedWorkouts?: {
      originalWorkoutId: string;
      replacementWorkoutId: string;
      reason: string;
      week: number;
      day: number;
    }[];
    modifiedMeals?: {
      originalMealId: string;
      replacementMealId: string;
      reason: string;
      week: number;
      day: number;
    }[];
    nutritionAdjustments?: {
      dailyCalories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      reason: string;
    };
    scheduleAdjustments?: {
      week: number;
      day: number;
      originalTimeSlot: string;
      newTimeSlot: string;
      reason: string;
    }[];
    additionalNotes?: string;
  };

  @ApiProperty({ description: 'Special instructions for the trainee' })
  @Column('text', { nullable: true })
  instructions?: string;

  @ApiProperty({ description: 'Priority level of this assignment' })
  @Column({ default: 1 })
  priority: number;

  @ApiProperty({ description: 'Progress tracking for the assignment' })
  @Column('jsonb', { nullable: true })
  progress?: {
    currentWeek: number;
    currentDay: number;
    completedWorkouts: number;
    missedWorkouts: number;
    completedMeals: number;
    missedMeals: number;
    adherencePercentage: number;
    weeklyProgress: {
      week: number;
      workoutAdherence: number;
      nutritionAdherence: number;
      weightChange?: number;
      energyLevel?: number; // 1-10 scale
      satisfaction?: number; // 1-10 scale
      notes?: string;
    }[];
    overallRating?: number; // 1-5 stars
    feedback?: string;
    lastUpdated: Date;
  };

  @ApiProperty({ description: 'Automated adjustments made by the system' })
  @Column('jsonb', { nullable: true })
  autoAdjustments?: {
    difficultyAdjustments?: {
      week: number;
      adjustment: 'increase' | 'decrease' | 'maintain';
      reason: string;
      appliedAt: Date;
    }[];
    nutritionAdjustments?: {
      week: number;
      calorieAdjustment: number;
      reason: string;
      appliedAt: Date;
    }[];
    scheduleAdjustments?: {
      week: number;
      day: number;
      change: string;
      reason: string;
      appliedAt: Date;
    }[];
  };

  @ApiProperty({ description: 'Assignment creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Assignment last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'When the assignment was actually started' })
  @Column({ type: 'timestamp', nullable: true })
  actualStartDate?: Date;

  @ApiProperty({ description: 'When the assignment was completed' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;
}
