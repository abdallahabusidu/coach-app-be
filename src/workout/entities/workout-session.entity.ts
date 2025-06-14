import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { WorkoutEntity } from './workout.entity';
import { WorkoutPlanEntity } from './workout-plan.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export enum ExerciseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
}

@Entity('workout_sessions')
export class WorkoutSessionEntity {
  @ApiProperty({ description: 'Unique identifier for the workout session' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Workout being performed' })
  @ManyToOne(() => WorkoutEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  workout: WorkoutEntity;

  @ApiProperty({ description: 'Workout ID' })
  @Column()
  @Index()
  workoutId: string;

  @ApiProperty({ description: 'Workout plan this session belongs to' })
  @ManyToOne(() => WorkoutPlanEntity, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  workoutPlan?: WorkoutPlanEntity;

  @ApiProperty({ description: 'Workout plan ID' })
  @Column({ nullable: true })
  @Index()
  workoutPlanId?: string;

  @ApiProperty({ description: 'Trainee performing the workout' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach supervising the session (optional)' })
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  coach?: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column({ nullable: true })
  @Index()
  coachId?: string;

  @ApiProperty({
    description: 'Status of the workout session',
    enum: SessionStatus,
  })
  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  @Index()
  status: SessionStatus;

  @ApiProperty({ description: 'Scheduled date and time for the workout' })
  @Column({ type: 'timestamp' })
  @Index()
  scheduledAt: Date;

  @ApiProperty({ description: 'When the workout was actually started' })
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'When the workout was completed' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Total duration of the session in minutes' })
  @Column('int', { nullable: true })
  actualDuration?: number;

  @ApiProperty({
    description: 'Exercise-level tracking data',
    example: [
      {
        exerciseName: 'Push-ups',
        status: 'completed',
        actualSets: 3,
        actualReps: [12, 10, 8],
        weights: [0, 0, 0],
        restTimes: [60, 60],
        notes: 'Good form maintained',
      },
    ],
  })
  @Column('jsonb', { default: [] })
  exerciseData: {
    exerciseName: string;
    status: ExerciseStatus;
    actualSets: number;
    actualReps: number[];
    weights?: number[]; // weights used for each set
    restTimes?: number[]; // actual rest times between sets
    notes?: string;
    difficultyRating?: number; // 1-10 scale
  }[];

  @ApiProperty({ description: 'Overall session rating (1-10)' })
  @Column('int', { nullable: true })
  sessionRating?: number;

  @ApiProperty({ description: 'Trainee notes about the session' })
  @Column('text', { nullable: true })
  traineeNotes?: string;

  @ApiProperty({ description: 'Coach feedback about the session' })
  @Column('text', { nullable: true })
  coachFeedback?: string;

  @ApiProperty({ description: 'Estimated calories burned' })
  @Column('int', { nullable: true })
  caloriesBurned?: number;

  @ApiProperty({ description: 'Heart rate data (if available)' })
  @Column('jsonb', { nullable: true })
  heartRateData?: {
    averageHR?: number;
    maxHR?: number;
    minHR?: number;
    hrZones?: {
      zone1: number; // minutes in each zone
      zone2: number;
      zone3: number;
      zone4: number;
      zone5: number;
    };
  };

  @ApiProperty({ description: 'Week number in the workout plan' })
  @Column('int', { nullable: true })
  planWeek?: number;

  @ApiProperty({ description: 'Day number in the week' })
  @Column('int', { nullable: true })
  planDay?: number;

  @ApiProperty({ description: 'Whether this was a makeup session' })
  @Column({ default: false })
  isMakeupSession: boolean;

  @ApiProperty({ description: 'Session creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
