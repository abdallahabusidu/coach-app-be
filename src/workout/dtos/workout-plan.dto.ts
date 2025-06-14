import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { WorkoutPlanType, PlanStatus } from '../entities/workout-plan.entity';

export class WeeklyScheduleDto {
  @ApiProperty({ description: 'Workout ID for this day' })
  @IsOptional()
  @IsString()
  workoutId?: string;

  @ApiProperty({ description: 'Whether this is a rest day' })
  @IsBoolean()
  restDay: boolean;

  @ApiProperty({ description: 'Notes for this day' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PlanGoalsDto {
  @ApiPropertyOptional({ description: 'Target weight' })
  @IsOptional()
  @IsNumber()
  weightTarget?: number;

  @ApiPropertyOptional({ description: 'Strength goals', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strengthGoals?: string[];

  @ApiPropertyOptional({ description: 'Endurance goals', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enduranceGoals?: string[];

  @ApiPropertyOptional({ description: 'Flexibility goals', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  flexibilityGoals?: string[];

  @ApiPropertyOptional({ description: 'Custom goals', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customGoals?: string[];
}

export class DifficultyProgressionDto {
  @ApiProperty({ description: 'Starting difficulty level' })
  @IsString()
  startLevel: string;

  @ApiProperty({ description: 'Ending difficulty level' })
  @IsString()
  endLevel: string;

  @ApiPropertyOptional({ description: 'Progression notes' })
  @IsOptional()
  @IsString()
  progressionNotes?: string;
}

export class CreateWorkoutPlanDto {
  @ApiProperty({ description: 'Name of the workout plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the workout plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Type of workout plan', enum: WorkoutPlanType })
  @IsEnum(WorkoutPlanType)
  planType: WorkoutPlanType;

  @ApiProperty({ description: 'Duration of the plan in weeks' })
  @IsNumber()
  @Min(1)
  @Max(52)
  durationWeeks: number;

  @ApiProperty({ description: 'Workouts per week' })
  @IsNumber()
  @Min(1)
  @Max(7)
  workoutsPerWeek: number;

  @ApiPropertyOptional({ description: 'Trainee ID to assign this plan to' })
  @IsOptional()
  @IsString()
  traineeId?: string;

  @ApiProperty({
    description: 'Weekly schedule structure',
    example: {
      week1: {
        day1: { workoutId: 'uuid', restDay: false },
        day2: { restDay: true },
      },
    },
  })
  @IsObject()
  schedule: {
    [week: string]: {
      [day: string]: WeeklyScheduleDto;
    };
  };

  @ApiProperty({ description: 'Target goals for the plan', type: PlanGoalsDto })
  @ValidateNested()
  @Type(() => PlanGoalsDto)
  goals: PlanGoalsDto;

  @ApiPropertyOptional({
    description: 'Prerequisites for starting this plan',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    description: 'Equipment needed for the plan',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiProperty({
    description: 'Difficulty level progression',
    type: DifficultyProgressionDto,
  })
  @ValidateNested()
  @Type(() => DifficultyProgressionDto)
  difficultyProgression: DifficultyProgressionDto;

  @ApiPropertyOptional({ description: 'Whether the plan is a public template' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}

export class UpdateWorkoutPlanDto {
  @ApiPropertyOptional({ description: 'Name of the workout plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the workout plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the workout plan',
    enum: PlanStatus,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional({ description: 'Duration of the plan in weeks' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  durationWeeks?: number;

  @ApiPropertyOptional({ description: 'Workouts per week' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  workoutsPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Weekly schedule structure',
    example: {
      week1: {
        day1: { workoutId: 'uuid', restDay: false },
        day2: { restDay: true },
      },
    },
  })
  @IsOptional()
  @IsObject()
  schedule?: {
    [week: string]: {
      [day: string]: WeeklyScheduleDto;
    };
  };

  @ApiPropertyOptional({
    description: 'Target goals for the plan',
    type: PlanGoalsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanGoalsDto)
  goals?: PlanGoalsDto;

  @ApiPropertyOptional({
    description: 'Prerequisites for starting this plan',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({
    description: 'Equipment needed for the plan',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiPropertyOptional({
    description: 'Difficulty level progression',
    type: DifficultyProgressionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DifficultyProgressionDto)
  difficultyProgression?: DifficultyProgressionDto;
}

export class AssignWorkoutPlanDto {
  @ApiProperty({ description: 'Workout plan ID to assign' })
  @IsString()
  workoutPlanId: string;

  @ApiProperty({ description: 'Trainee ID to assign the plan to' })
  @IsString()
  traineeId: string;

  @ApiProperty({ description: 'Start date for the plan' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Special instructions for the trainee' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Priority level (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Custom modifications to the plan',
    example: {
      modifiedExercises: [
        {
          originalExercise: 'Push-ups',
          replacementExercise: 'Incline Push-ups',
          reason: 'Shoulder injury accommodation',
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  customizations?: {
    modifiedExercises?: {
      originalExercise: string;
      replacementExercise: string;
      reason: string;
    }[];
    intensityAdjustments?: {
      week: number;
      adjustment: 'increase' | 'decrease' | 'maintain';
      percentage: number;
    }[];
    additionalNotes?: string;
  };
}

export class WorkoutPlanResponseDto {
  @ApiProperty({ description: 'Workout plan ID' })
  id: string;

  @ApiProperty({ description: 'Name of the workout plan' })
  name: string;

  @ApiProperty({ description: 'Description of the workout plan' })
  description?: string;

  @ApiProperty({ description: 'Type of workout plan', enum: WorkoutPlanType })
  planType: WorkoutPlanType;

  @ApiProperty({ description: 'Duration of the plan in weeks' })
  durationWeeks: number;

  @ApiProperty({ description: 'Workouts per week' })
  workoutsPerWeek: number;

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Assigned trainee information' })
  trainee?: {
    id: string;
    name: string;
    profilePictureUrl?: string;
  };

  @ApiProperty({ description: 'Status of the workout plan', enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty({ description: 'Weekly schedule structure' })
  schedule: {
    [week: string]: {
      [day: string]: WeeklyScheduleDto;
    };
  };

  @ApiProperty({ description: 'Target goals for the plan' })
  goals: PlanGoalsDto;

  @ApiProperty({ description: 'Prerequisites for starting this plan' })
  prerequisites: string[];

  @ApiProperty({ description: 'Equipment needed for the plan' })
  equipment: string[];

  @ApiProperty({ description: 'Difficulty level progression' })
  difficultyProgression: DifficultyProgressionDto;

  @ApiProperty({ description: 'Whether the plan is a public template' })
  isTemplate: boolean;

  @ApiProperty({ description: 'Number of times this plan has been used' })
  usageCount: number;

  @ApiProperty({ description: 'Average rating of the plan' })
  averageRating: number;

  @ApiProperty({ description: 'Plan creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Plan start date (when assigned)' })
  startDate?: Date;

  @ApiProperty({ description: 'Plan end date (when assigned)' })
  endDate?: Date;
}

export class WorkoutPlanListResponseDto {
  @ApiProperty({ type: [WorkoutPlanResponseDto] })
  plans: WorkoutPlanResponseDto[];

  @ApiProperty({ description: 'Total number of plans' })
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
