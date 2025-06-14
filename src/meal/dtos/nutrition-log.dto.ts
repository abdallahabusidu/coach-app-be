import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsDateString,
  IsUUID,
  Min,
  Max,
  IsInt,
  Matches,
} from 'class-validator';

export class AdditionalNutritionDto {
  @ApiPropertyOptional({ description: 'Fiber content (grams)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @ApiPropertyOptional({ description: 'Sugar content (grams)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sugar?: number;

  @ApiPropertyOptional({ description: 'Sodium content (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sodium?: number;

  @ApiPropertyOptional({ description: 'Cholesterol content (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cholesterol?: number;

  @ApiPropertyOptional({ description: 'Vitamin C content (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  vitaminC?: number;

  @ApiPropertyOptional({ description: 'Calcium content (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  calcium?: number;

  @ApiPropertyOptional({ description: 'Iron content (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  iron?: number;
}

export class LogMealDto {
  @ApiPropertyOptional({ description: 'Trainee ID (coaches only - for logging meals for their trainees)' })
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiProperty({ description: 'Meal ID' })
  @IsUUID()
  mealId: string;

  @ApiPropertyOptional({ description: 'Meal plan ID (if part of a plan)' })
  @IsOptional()
  @IsUUID()
  mealPlanId?: string;

  @ApiProperty({ description: 'Date when the meal was consumed (YYYY-MM-DD)' })
  @IsDateString()
  logDate: string;

  @ApiProperty({ description: 'Time when the meal was consumed (HH:MM)', example: '08:30' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'mealTime must be in HH:MM format',
  })
  mealTime: string;

  @ApiProperty({ description: 'Meal category', example: 'breakfast' })
  @IsString()
  mealCategory: string;

  @ApiProperty({ description: 'Portion size multiplier', example: 1.5 })
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  portionSize: number;

  @ApiPropertyOptional({ description: 'Additional nutritional information', type: AdditionalNutritionDto })
  @IsOptional()
  @Type(() => AdditionalNutritionDto)
  additionalNutrition?: AdditionalNutritionDto;

  @ApiPropertyOptional({ description: 'Notes about the meal' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Rating of the meal (1-5 stars)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Photo URL of the actual meal' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Whether this was a planned meal' })
  @IsOptional()
  wasPlanned?: boolean;

  @ApiPropertyOptional({ description: 'Location where meal was consumed' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Mood/energy level after eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  moodAfterEating?: number;

  @ApiPropertyOptional({ description: 'Hunger level before eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hungerLevelBefore?: number;

  @ApiPropertyOptional({ description: 'Satiety level after eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satietyLevelAfter?: number;
}

export class UpdateNutritionLogDto {
  @ApiPropertyOptional({ description: 'Portion size multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  portionSize?: number;

  @ApiPropertyOptional({ description: 'Additional nutritional information', type: AdditionalNutritionDto })
  @IsOptional()
  @Type(() => AdditionalNutritionDto)
  additionalNutrition?: AdditionalNutritionDto;

  @ApiPropertyOptional({ description: 'Notes about the meal' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Rating of the meal (1-5 stars)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Photo URL of the actual meal' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Location where meal was consumed' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Mood/energy level after eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  moodAfterEating?: number;

  @ApiPropertyOptional({ description: 'Hunger level before eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  hungerLevelBefore?: number;

  @ApiPropertyOptional({ description: 'Satiety level after eating (1-5)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  satietyLevelAfter?: number;
}

export class NutritionLogResponseDto {
  @ApiProperty({ description: 'Log entry ID' })
  id: string;

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Meal information' })
  meal: {
    id: string;
    name: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };

  @ApiProperty({ description: 'Meal plan information' })
  mealPlan?: {
    id: string;
    name: string;
    planType: string;
  };

  @ApiProperty({ description: 'Date when meal was consumed' })
  logDate: Date;

  @ApiProperty({ description: 'Time when meal was consumed' })
  mealTime: string;

  @ApiProperty({ description: 'Meal category' })
  mealCategory: string;

  @ApiProperty({ description: 'Portion size multiplier' })
  portionSize: number;

  @ApiProperty({ description: 'Actual calories consumed' })
  actualCalories: number;

  @ApiProperty({ description: 'Actual protein consumed' })
  actualProtein: number;

  @ApiProperty({ description: 'Actual carbs consumed' })
  actualCarbs: number;

  @ApiProperty({ description: 'Actual fat consumed' })
  actualFat: number;

  @ApiProperty({ description: 'Additional nutritional information' })
  additionalNutrition?: AdditionalNutritionDto;

  @ApiProperty({ description: 'Notes about the meal' })
  notes?: string;

  @ApiProperty({ description: 'Meal rating' })
  rating?: number;

  @ApiProperty({ description: 'Photo URL' })
  photoUrl?: string;

  @ApiProperty({ description: 'Was planned meal' })
  wasPlanned: boolean;

  @ApiProperty({ description: 'Location' })
  location?: string;

  @ApiProperty({ description: 'Mood after eating' })
  moodAfterEating?: number;

  @ApiProperty({ description: 'Hunger level before' })
  hungerLevelBefore?: number;

  @ApiProperty({ description: 'Satiety level after' })
  satietyLevelAfter?: number;

  @ApiProperty({ description: 'Log creation date' })
  createdAt: Date;
}

export class NutritionLogListResponseDto {
  @ApiProperty({ type: [NutritionLogResponseDto] })
  logs: NutritionLogResponseDto[];

  @ApiProperty({ description: 'Total number of logs' })
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

export class DailyNutritionSummaryDto {
  @ApiProperty({ description: 'Date' })
  date: Date;

  @ApiProperty({ description: 'Total calories consumed' })
  totalCalories: number;

  @ApiProperty({ description: 'Total protein consumed' })
  totalProtein: number;

  @ApiProperty({ description: 'Total carbs consumed' })
  totalCarbs: number;

  @ApiProperty({ description: 'Total fat consumed' })
  totalFat: number;

  @ApiProperty({ description: 'Number of meals logged' })
  mealsLogged: number;

  @ApiProperty({ description: 'Target calories' })
  targetCalories?: number;

  @ApiProperty({ description: 'Target protein' })
  targetProtein?: number;

  @ApiProperty({ description: 'Target carbs' })
  targetCarbs?: number;

  @ApiProperty({ description: 'Target fat' })
  targetFat?: number;

  @ApiProperty({ description: 'Calorie adherence percentage' })
  calorieAdherence: number;

  @ApiProperty({ description: 'Protein adherence percentage' })
  proteinAdherence: number;

  @ApiProperty({ description: 'Carbs adherence percentage' })
  carbsAdherence: number;

  @ApiProperty({ description: 'Fat adherence percentage' })
  fatAdherence: number;

  @ApiProperty({ description: 'Average meal rating' })
  averageMealRating?: number;
}

export class WeeklyNutritionReportDto {
  @ApiProperty({ description: 'Week start date' })
  weekStart: Date;

  @ApiProperty({ description: 'Week end date' })
  weekEnd: Date;

  @ApiProperty({ description: 'Daily summaries', type: [DailyNutritionSummaryDto] })
  dailySummaries: DailyNutritionSummaryDto[];

  @ApiProperty({ description: 'Weekly averages' })
  weeklyAverages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    adherence: number;
    mealRating: number;
  };

  @ApiProperty({ description: 'Weekly totals' })
  weeklyTotals: {
    mealsLogged: number;
    plannedMeals: number;
    adherencePercentage: number;
  };

  @ApiProperty({ description: 'Most consumed meals' })
  topMeals: {
    mealId: string;
    mealName: string;
    frequency: number;
    averageRating: number;
  }[];
}
