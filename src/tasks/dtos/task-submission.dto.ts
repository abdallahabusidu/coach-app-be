import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SubmissionStatus } from '../entities/task-submission.entity';

export class SubmissionDataDto {
  @ApiPropertyOptional({ description: 'Workout submission data' })
  @IsOptional()
  @IsObject()
  workout?: {
    actualSets?: number;
    actualReps?: number[];
    actualWeight?: number[];
    duration?: number;
    difficulty?: number;
    notes?: string;
    exerciseCompletions?: {
      exerciseId: string;
      completed: boolean;
      sets: number;
      reps: number[];
      weight: number[];
      notes?: string;
    }[];
  };

  @ApiPropertyOptional({ description: 'Meal log submission data' })
  @IsOptional()
  @IsObject()
  mealLog?: {
    meals: {
      type: string;
      foods: string[];
      calories: number;
      macros: { protein: number; carbs: number; fat: number };
      photo?: string;
      time: string;
      notes?: string;
    }[];
    totalCalories: number;
    totalMacros: { protein: number; carbs: number; fat: number };
    waterIntake?: number;
  };

  @ApiPropertyOptional({ description: 'Weight check submission data' })
  @IsOptional()
  @IsObject()
  weightCheck?: {
    weight: number;
    unit: 'kg' | 'lbs';
    timeOfDay: string;
    notes?: string;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };

  @ApiPropertyOptional({ description: 'Progress photo submission data' })
  @IsOptional()
  @IsObject()
  progressPhoto?: {
    photos: {
      angle: string;
      url: string;
      timestamp?: Date;
    }[];
    lighting?: string;
    location?: string;
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Body measurement submission data' })
  @IsOptional()
  @IsObject()
  measurement?: {
    measurements: {
      bodyPart: string;
      value: number;
      unit: 'cm' | 'inch';
      notes?: string;
    }[];
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Habit tracking submission data' })
  @IsOptional()
  @IsObject()
  habitTracking?: {
    habits: {
      name: string;
      completed: number;
      target: number;
      unit?: string;
      notes?: string;
    }[];
    overallScore: number;
  };

  @ApiPropertyOptional({ description: 'Reflection submission data' })
  @IsOptional()
  @IsObject()
  reflection?: {
    responses: {
      question: string;
      answer: string;
    }[];
    wordCount: number;
    mood?: string;
    overallRating?: number;
  };

  @ApiPropertyOptional({ description: 'Education content submission data' })
  @IsOptional()
  @IsObject()
  education?: {
    completed: boolean;
    timeSpent: number;
    quiz?: {
      question: number;
      answer: number;
      correct: boolean;
    }[];
    score?: number;
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Goal setting submission data' })
  @IsOptional()
  @IsObject()
  goalSetting?: {
    goals: {
      category: string;
      goal: string;
      specific: boolean;
      measurable: boolean;
      achievable: boolean;
      relevant: boolean;
      timeBound: boolean;
      deadline?: Date;
    }[];
    confidence: number;
  };

  @ApiPropertyOptional({ description: 'Custom task submission data' })
  @IsOptional()
  @IsObject()
  custom?: {
    text?: string;
    files?: string[];
    data?: any;
  };
}

export class CreateTaskSubmissionDto {
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({
    description: 'Submission data based on task type',
    type: SubmissionDataDto,
  })
  @ValidateNested()
  @Type(() => SubmissionDataDto)
  submissionData: SubmissionDataDto;

  @ApiPropertyOptional({ description: 'Additional notes from the trainee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Attached files (URLs)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Time taken to complete the task in minutes',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600)
  timeTaken?: number;

  @ApiPropertyOptional({
    description: 'Trainee rating of the task difficulty (1-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  difficultyRating?: number;

  @ApiPropertyOptional({
    description: 'Trainee satisfaction with the task (1-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  satisfactionRating?: number;
}

export class UpdateTaskSubmissionDto {
  @ApiPropertyOptional({
    description: 'Submission data based on task type',
    type: SubmissionDataDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubmissionDataDto)
  submissionData?: SubmissionDataDto;

  @ApiPropertyOptional({ description: 'Additional notes from the trainee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Attached files (URLs)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    description: 'Time taken to complete the task in minutes',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600)
  timeTaken?: number;

  @ApiPropertyOptional({
    description: 'Trainee rating of the task difficulty (1-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  difficultyRating?: number;

  @ApiPropertyOptional({
    description: 'Trainee satisfaction with the task (1-10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  satisfactionRating?: number;
}

export class ReviewSubmissionDto {
  @ApiProperty({
    description: 'Submission status after review',
    enum: SubmissionStatus,
  })
  @IsEnum(SubmissionStatus)
  status: SubmissionStatus;

  @ApiPropertyOptional({ description: 'Coach feedback on the submission' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachFeedback?: string;

  @ApiPropertyOptional({ description: 'Coach rating of the submission (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  coachRating?: number;

  @ApiPropertyOptional({ description: 'Points awarded for this submission' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  pointsAwarded?: number;
}

export class TaskSubmissionResponseDto {
  @ApiProperty({ description: 'Submission ID' })
  id: string;

  @ApiProperty({ description: 'Task information' })
  task: {
    id: string;
    title: string;
    taskType: string;
  };

  @ApiProperty({ description: 'Submitter information' })
  submittedBy: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Submission status', enum: SubmissionStatus })
  status: SubmissionStatus;

  @ApiProperty({ description: 'Submission data' })
  submissionData: any;

  @ApiProperty({ description: 'Submission notes' })
  notes?: string;

  @ApiProperty({ description: 'Attached files' })
  attachments: string[];

  @ApiProperty({ description: 'Time taken in minutes' })
  timeTaken?: number;

  @ApiProperty({ description: 'Difficulty rating' })
  difficultyRating?: number;

  @ApiProperty({ description: 'Satisfaction rating' })
  satisfactionRating?: number;

  @ApiProperty({ description: 'Reviewer information' })
  reviewedBy?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Coach feedback' })
  coachFeedback?: string;

  @ApiProperty({ description: 'Coach rating' })
  coachRating?: number;

  @ApiProperty({ description: 'Points awarded' })
  pointsAwarded: number;

  @ApiProperty({ description: 'Is latest submission' })
  isLatest: boolean;

  @ApiProperty({ description: 'Submission number' })
  submissionNumber: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Review date' })
  reviewedAt?: Date;
}

export class TaskSubmissionListResponseDto {
  @ApiProperty({ type: [TaskSubmissionResponseDto] })
  submissions: TaskSubmissionResponseDto[];

  @ApiProperty({ description: 'Total number of submissions' })
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

export class QuickTaskSubmissionDto {
  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  taskId: string;

  @ApiProperty({ description: 'Simple completion status' })
  @IsBoolean()
  completed: boolean;

  @ApiPropertyOptional({ description: 'Quick notes' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @ApiPropertyOptional({ description: 'Overall rating (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  rating?: number;
}

export class BulkTaskActionDto {
  @ApiProperty({ description: 'Task IDs to perform action on', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  taskIds: string[];

  @ApiProperty({ description: 'Action to perform' })
  @IsEnum(['complete', 'cancel', 'extend_due_date', 'change_priority'])
  action: 'complete' | 'cancel' | 'extend_due_date' | 'change_priority';

  @ApiPropertyOptional({ description: 'Additional data for the action' })
  @IsOptional()
  @IsObject()
  actionData?: {
    dueDate?: string;
    priority?: string;
    notes?: string;
  };
}
