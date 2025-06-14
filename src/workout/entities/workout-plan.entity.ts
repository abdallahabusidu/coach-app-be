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
import { WorkoutEntity } from './workout.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum WorkoutPlanType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness',
}

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

@Entity('workout_plans')
export class WorkoutPlanEntity {
  @ApiProperty({ description: 'Unique identifier for the workout plan' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the workout plan' })
  @Column({ length: 100 })
  @Index()
  name: string;

  @ApiProperty({ description: 'Description of the workout plan' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ description: 'Type of workout plan', enum: WorkoutPlanType })
  @Column({
    type: 'enum',
    enum: WorkoutPlanType,
  })
  @Index()
  planType: WorkoutPlanType;

  @ApiProperty({ description: 'Duration of the plan in weeks' })
  @Column('int')
  durationWeeks: number;

  @ApiProperty({ description: 'Workouts per week' })
  @Column('int')
  workoutsPerWeek: number;

  @ApiProperty({ description: 'Coach who created the plan' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Trainee assigned to this plan (optional)' })
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  trainee?: UserEntity;

  @ApiProperty({ description: 'Trainee ID (optional)' })
  @Column({ nullable: true })
  @Index()
  traineeId?: string;

  @ApiProperty({ description: 'Status of the workout plan', enum: PlanStatus })
  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  @Index()
  status: PlanStatus;

  @ApiProperty({
    description: 'Weekly schedule structure',
    example: {
      week1: {
        day1: { workoutId: 'uuid', restDay: false },
        day2: { restDay: true },
        day3: { workoutId: 'uuid', restDay: false },
      },
    },
  })
  @Column('jsonb')
  schedule: {
    [week: string]: {
      [day: string]: {
        workoutId?: string;
        restDay: boolean;
        notes?: string;
      };
    };
  };

  @ApiProperty({ description: 'Target goals for the plan' })
  @Column('jsonb')
  goals: {
    weightTarget?: number;
    strengthGoals?: string[];
    enduranceGoals?: string[];
    flexibilityGoals?: string[];
    customGoals?: string[];
  };

  @ApiProperty({ description: 'Prerequisites for starting this plan' })
  @Column('text', { array: true, default: [] })
  prerequisites: string[];

  @ApiProperty({ description: 'Equipment needed for the plan' })
  @Column('text', { array: true, default: [] })
  equipment: string[];

  @ApiProperty({ description: 'Difficulty level progression' })
  @Column('jsonb')
  difficultyProgression: {
    startLevel: string;
    endLevel: string;
    progressionNotes?: string;
  };

  @ApiProperty({ description: 'Whether the plan is public template' })
  @Column({ default: false })
  isTemplate: boolean;

  @ApiProperty({ description: 'Number of times this plan has been used' })
  @Column({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Average rating of the plan' })
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @ApiProperty({ description: 'Plan creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Plan last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Plan start date (when assigned to trainee)' })
  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @ApiProperty({ description: 'Plan end date (when assigned to trainee)' })
  @Column({ type: 'date', nullable: true })
  endDate?: Date;
}
