import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { AssignmentStatus } from '../entities/template-assignment.entity';

export class AssignTemplateDto {
  @ApiProperty({ description: 'Template ID to assign' })
  @IsUUID()
  templateId: string;

  @ApiProperty({ description: 'Trainee ID to assign the template to' })
  @IsUUID()
  traineeId: string;

  @ApiProperty({ description: 'Start date for the template' })
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
    description: 'Custom modifications to the template',
    example: {
      modifiedWorkouts: [
        {
          originalWorkoutId: 'uuid1',
          replacementWorkoutId: 'uuid2',
          reason: 'Knee injury accommodation',
          week: 1,
          day: 1,
        },
      ],
      nutritionAdjustments: {
        dailyCalories: 2200,
        reason: 'Higher calorie needs for weight gain',
      },
    },
  })
  @IsOptional()
  @IsObject()
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
}

export class UpdateTemplateAssignmentDto {
  @ApiPropertyOptional({
    description: 'Assignment status',
    enum: AssignmentStatus,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

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

  @ApiPropertyOptional({ description: 'Custom modifications to the template' })
  @IsOptional()
  @IsObject()
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
}

export class UpdateAssignmentProgressDto {
  @ApiProperty({ description: 'Assignment ID' })
  @IsUUID()
  assignmentId: string;

  @ApiProperty({ description: 'Current week of the template' })
  @IsNumber()
  @Min(1)
  currentWeek: number;

  @ApiProperty({ description: 'Current day of the week' })
  @IsNumber()
  @Min(1)
  @Max(7)
  currentDay: number;

  @ApiPropertyOptional({ description: 'Number of completed workouts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedWorkouts?: number;

  @ApiPropertyOptional({ description: 'Number of missed workouts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  missedWorkouts?: number;

  @ApiPropertyOptional({ description: 'Number of completed meals' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedMeals?: number;

  @ApiPropertyOptional({ description: 'Number of missed meals' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  missedMeals?: number;

  @ApiPropertyOptional({ description: 'Overall adherence percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  adherencePercentage?: number;

  @ApiPropertyOptional({ description: 'Weight change in kg' })
  @IsOptional()
  @IsNumber()
  weightChange?: number;

  @ApiPropertyOptional({ description: 'Energy level (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  energyLevel?: number;

  @ApiPropertyOptional({ description: 'Satisfaction score (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  satisfaction?: number;

  @ApiPropertyOptional({ description: 'Progress notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Overall rating (1-5 stars)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @ApiPropertyOptional({ description: 'Feedback text' })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class TemplateAssignmentResponseDto {
  @ApiProperty({ description: 'Assignment ID' })
  id: string;

  @ApiProperty({ description: 'Template information' })
  template: {
    id: string;
    name: string;
    templateType: string;
    durationWeeks: number;
    difficulty: string;
  };

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Assignment status', enum: AssignmentStatus })
  status: AssignmentStatus;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiProperty({ description: 'End date' })
  endDate: Date;

  @ApiProperty({ description: 'Custom modifications' })
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

  @ApiProperty({ description: 'Instructions for trainee' })
  instructions?: string;

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiProperty({ description: 'Progress tracking' })
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
      energyLevel?: number;
      satisfaction?: number;
      notes?: string;
    }[];
    overallRating?: number;
    feedback?: string;
    lastUpdated: Date;
  };

  @ApiProperty({ description: 'Auto adjustments made by system' })
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

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Actual start date' })
  actualStartDate?: Date;

  @ApiProperty({ description: 'Completion date' })
  completedAt?: Date;
}

export class TemplateAssignmentListResponseDto {
  @ApiProperty({ type: [TemplateAssignmentResponseDto] })
  assignments: TemplateAssignmentResponseDto[];

  @ApiProperty({ description: 'Total number of assignments' })
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

export class TemplateRecommendationResponseDto {
  @ApiProperty({ description: 'Recommendation ID' })
  id: string;

  @ApiProperty({ description: 'Template information' })
  template: {
    id: string;
    name: string;
    templateType: string;
    durationWeeks: number;
    difficulty: string;
    averageRating: number;
    usageCount: number;
  };

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Recommendation score (0-100)' })
  score: number;

  @ApiProperty({ description: 'Confidence level (0-100)' })
  confidence: number;

  @ApiProperty({ description: 'Recommendation reason' })
  reason: string;

  @ApiProperty({ description: 'Detailed matching criteria' })
  matchingDetails: {
    criteriaMatches: {
      age: {
        matched: boolean;
        score: number;
        traineeValue: number;
        templateRange: { min: number; max: number };
      };
      gender: {
        matched: boolean;
        score: number;
        traineeValue: string;
        templateValues: string[];
      };
      fitnessLevel: {
        matched: boolean;
        score: number;
        traineeValue: string;
        templateValues: string[];
      };
      goals: {
        matched: boolean;
        score: number;
        traineeGoals: string[];
        templateGoals: string[];
        overlap: string[];
      };
      equipmentAvailability: {
        matched: boolean;
        score: number;
        traineeEquipment: string[];
        requiredEquipment: string[];
        missingEquipment: string[];
      };
    };
    overallMatchScore: number;
    successProbability: number;
    recommendationReason: string;
    potentialChallenges?: string[];
    suggestedModifications?: string[];
  };

  @ApiProperty({ description: 'Whether viewed by coach' })
  viewed: boolean;

  @ApiProperty({ description: 'Whether accepted by coach' })
  accepted: boolean;

  @ApiProperty({ description: 'Whether dismissed by coach' })
  dismissed: boolean;

  @ApiProperty({ description: 'Coach feedback' })
  coachFeedback?: string;

  @ApiProperty({ description: 'Whether auto-generated' })
  isAutoGenerated: boolean;

  @ApiProperty({ description: 'Expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'View date' })
  viewedAt?: Date;

  @ApiProperty({ description: 'Acceptance date' })
  acceptedAt?: Date;

  @ApiProperty({ description: 'Dismissal date' })
  dismissedAt?: Date;
}

export class TemplateRecommendationListResponseDto {
  @ApiProperty({ type: [TemplateRecommendationResponseDto] })
  recommendations: TemplateRecommendationResponseDto[];

  @ApiProperty({ description: 'Total number of recommendations' })
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
