import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import {
  SessionStatus,
  ExerciseStatus,
} from '../entities/workout-session.entity';

export class ExerciseDataDto {
  @ApiProperty({ description: 'Name of the exercise' })
  @IsString()
  exerciseName: string;

  @ApiProperty({ description: 'Status of the exercise', enum: ExerciseStatus })
  @IsEnum(ExerciseStatus)
  status: ExerciseStatus;

  @ApiProperty({ description: 'Actual number of sets performed' })
  @IsNumber()
  @Min(0)
  actualSets: number;

  @ApiProperty({
    description: 'Actual reps performed for each set',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  actualReps: number[];

  @ApiPropertyOptional({
    description: 'Weights used for each set (in kg)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weights?: number[];

  @ApiPropertyOptional({
    description: 'Rest times between sets (in seconds)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  restTimes?: number[];

  @ApiPropertyOptional({ description: 'Notes about the exercise performance' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Difficulty rating (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  difficultyRating?: number;
}

export class HeartRateDataDto {
  @ApiPropertyOptional({ description: 'Average heart rate during session' })
  @IsOptional()
  @IsNumber()
  averageHR?: number;

  @ApiPropertyOptional({ description: 'Maximum heart rate during session' })
  @IsOptional()
  @IsNumber()
  maxHR?: number;

  @ApiPropertyOptional({ description: 'Minimum heart rate during session' })
  @IsOptional()
  @IsNumber()
  minHR?: number;

  @ApiPropertyOptional({
    description: 'Time spent in each heart rate zone (minutes)',
    example: { zone1: 5, zone2: 15, zone3: 20, zone4: 10, zone5: 0 },
  })
  @IsOptional()
  hrZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
}

export class CreateWorkoutSessionDto {
  @ApiProperty({ description: 'Workout ID' })
  @IsString()
  workoutId: string;

  @ApiPropertyOptional({ description: 'Workout plan ID (if part of a plan)' })
  @IsOptional()
  @IsString()
  workoutPlanId?: string;

  @ApiPropertyOptional({
    description: 'Trainee ID (if different from current user)',
  })
  @IsOptional()
  @IsString()
  traineeId?: string;

  @ApiProperty({ description: 'Scheduled date and time for the workout' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Week number in the workout plan' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  planWeek?: number;

  @ApiPropertyOptional({ description: 'Day number in the week' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  planDay?: number;

  @ApiPropertyOptional({ description: 'Whether this is a makeup session' })
  @IsOptional()
  @IsBoolean()
  isMakeupSession?: boolean;
}

export class StartWorkoutSessionDto {
  @ApiProperty({ description: 'Workout session ID' })
  @IsString()
  sessionId: string;
}

export class UpdateWorkoutSessionDto {
  @ApiPropertyOptional({
    description: 'Status of the workout session',
    enum: SessionStatus,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({
    description: 'Exercise-level tracking data',
    type: [ExerciseDataDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDataDto)
  exerciseData?: ExerciseDataDto[];

  @ApiPropertyOptional({ description: 'Overall session rating (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  sessionRating?: number;

  @ApiPropertyOptional({ description: 'Trainee notes about the session' })
  @IsOptional()
  @IsString()
  traineeNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated calories burned' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesBurned?: number;

  @ApiPropertyOptional({
    description: 'Heart rate data',
    type: HeartRateDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeartRateDataDto)
  heartRateData?: HeartRateDataDto;
}

export class CompleteWorkoutSessionDto {
  @ApiProperty({ description: 'Workout session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Exercise-level tracking data',
    type: [ExerciseDataDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDataDto)
  exerciseData: ExerciseDataDto[];

  @ApiPropertyOptional({ description: 'Overall session rating (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  sessionRating?: number;

  @ApiPropertyOptional({ description: 'Trainee notes about the session' })
  @IsOptional()
  @IsString()
  traineeNotes?: string;

  @ApiPropertyOptional({ description: 'Estimated calories burned' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesBurned?: number;

  @ApiPropertyOptional({
    description: 'Heart rate data',
    type: HeartRateDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HeartRateDataDto)
  heartRateData?: HeartRateDataDto;
}

export class AddCoachFeedbackDto {
  @ApiProperty({ description: 'Workout session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Coach feedback about the session' })
  @IsString()
  coachFeedback: string;
}

export class WorkoutSessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Workout information' })
  workout: {
    id: string;
    name: string;
    workoutType: string;
    duration: number;
    difficulty: string;
  };

  @ApiProperty({ description: 'Workout plan information' })
  workoutPlan?: {
    id: string;
    name: string;
    planType: string;
  };

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Coach information' })
  coach?: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({
    description: 'Status of the workout session',
    enum: SessionStatus,
  })
  status: SessionStatus;

  @ApiProperty({ description: 'Scheduled date and time' })
  scheduledAt: Date;

  @ApiProperty({ description: 'Start time of the session' })
  startedAt?: Date;

  @ApiProperty({ description: 'Completion time of the session' })
  completedAt?: Date;

  @ApiProperty({ description: 'Actual duration in minutes' })
  actualDuration?: number;

  @ApiProperty({
    description: 'Exercise-level tracking data',
    type: [ExerciseDataDto],
  })
  exerciseData: ExerciseDataDto[];

  @ApiProperty({ description: 'Overall session rating' })
  sessionRating?: number;

  @ApiProperty({ description: 'Trainee notes' })
  traineeNotes?: string;

  @ApiProperty({ description: 'Coach feedback' })
  coachFeedback?: string;

  @ApiProperty({ description: 'Calories burned' })
  caloriesBurned?: number;

  @ApiProperty({ description: 'Heart rate data' })
  heartRateData?: HeartRateDataDto;

  @ApiProperty({ description: 'Week number in plan' })
  planWeek?: number;

  @ApiProperty({ description: 'Day number in week' })
  planDay?: number;

  @ApiProperty({ description: 'Is makeup session' })
  isMakeupSession: boolean;

  @ApiProperty({ description: 'Session creation date' })
  createdAt: Date;
}

export class WorkoutSessionListResponseDto {
  @ApiProperty({ type: [WorkoutSessionResponseDto] })
  sessions: WorkoutSessionResponseDto[];

  @ApiProperty({ description: 'Total number of sessions' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

export class WorkoutSessionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by trainee ID' })
  @IsOptional()
  @IsString()
  traineeId?: string;

  @ApiPropertyOptional({ description: 'Filter by workout plan ID' })
  @IsOptional()
  @IsString()
  workoutPlanId?: string;

  @ApiPropertyOptional({
    description: 'Filter by session status',
    enum: SessionStatus,
  })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ description: 'Filter by date from (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by date to (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['scheduledAt', 'completedAt', 'sessionRating', 'createdAt'],
    default: 'scheduledAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'scheduledAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
