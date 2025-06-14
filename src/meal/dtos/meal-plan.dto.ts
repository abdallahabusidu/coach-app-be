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
  IsUUID,
} from 'class-validator';
import {
  MealPlanType,
  PlanStatus,
  DietaryRestriction,
} from '../entities/meal-plan.entity';

export class DailyMealDto {
  @ApiProperty({ description: 'Meal ID' })
  @IsUUID()
  mealId: string;

  @ApiProperty({ description: 'Portion size multiplier', example: 1.0 })
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  portion: number;

  @ApiPropertyOptional({ description: 'Notes for this meal' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DayScheduleDto {
  @ApiPropertyOptional({ description: 'Breakfast meal', type: DailyMealDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DailyMealDto)
  breakfast?: DailyMealDto;

  @ApiPropertyOptional({ description: 'Lunch meal', type: DailyMealDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DailyMealDto)
  lunch?: DailyMealDto;

  @ApiPropertyOptional({ description: 'Dinner meal', type: DailyMealDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DailyMealDto)
  dinner?: DailyMealDto;

  @ApiPropertyOptional({ description: 'Snack meals', type: [DailyMealDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyMealDto)
  snacks?: DailyMealDto[];
}

export class NutritionTargetsDto {
  @ApiProperty({ description: 'Daily calorie target' })
  @IsNumber()
  @Min(1000)
  @Max(5000)
  dailyCalories: number;

  @ApiProperty({ description: 'Daily protein target (grams)' })
  @IsNumber()
  @Min(10)
  @Max(300)
  protein: number;

  @ApiProperty({ description: 'Daily carbs target (grams)' })
  @IsNumber()
  @Min(20)
  @Max(500)
  carbs: number;

  @ApiProperty({ description: 'Daily fat target (grams)' })
  @IsNumber()
  @Min(10)
  @Max(200)
  fat: number;

  @ApiPropertyOptional({ description: 'Daily fiber target (grams)' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  fiber?: number;

  @ApiPropertyOptional({ description: 'Daily sugar limit (grams)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sugar?: number;

  @ApiPropertyOptional({ description: 'Daily sodium limit (mg)' })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(5000)
  sodium?: number;

  @ApiPropertyOptional({ description: 'Daily water target (liters)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  water?: number;
}

export class MealPreferencesDto {
  @ApiPropertyOptional({ description: 'Number of meals per day' })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(8)
  mealsPerDay?: number;

  @ApiPropertyOptional({ description: 'Number of snacks per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  snacksPerDay?: number;

  @ApiPropertyOptional({ description: 'Cooking time preference' })
  @IsOptional()
  @IsEnum(['quick', 'medium', 'extended'])
  cookingTime?: 'quick' | 'medium' | 'extended';

  @ApiPropertyOptional({ description: 'Cooking skill level' })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';

  @ApiPropertyOptional({ description: 'Budget level' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  budget?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    description: 'Preferred cuisine types',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cuisineTypes?: string[];

  @ApiPropertyOptional({ description: 'Ingredients to avoid', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avoidedIngredients?: string[];

  @ApiPropertyOptional({ description: 'Preferred ingredients', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredIngredients?: string[];
}

export class CreateMealPlanDto {
  @ApiProperty({ description: 'Name of the meal plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the meal plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Type of meal plan', enum: MealPlanType })
  @IsEnum(MealPlanType)
  planType: MealPlanType;

  @ApiProperty({ description: 'Duration of the plan in days' })
  @IsNumber()
  @Min(1)
  @Max(365)
  durationDays: number;

  @ApiPropertyOptional({ description: 'Trainee ID to assign this plan to' })
  @IsOptional()
  @IsUUID()
  traineeId?: string;

  @ApiProperty({
    description: 'Daily meal schedule structure',
    example: {
      day1: {
        breakfast: { mealId: 'uuid', portion: 1.0 },
        lunch: { mealId: 'uuid', portion: 1.0 },
      },
    },
  })
  @IsObject()
  schedule: {
    [day: string]: DayScheduleDto;
  };

  @ApiProperty({
    description: 'Nutritional targets for the plan',
    type: NutritionTargetsDto,
  })
  @ValidateNested()
  @Type(() => NutritionTargetsDto)
  nutritionTargets: NutritionTargetsDto;

  @ApiProperty({
    description: 'Dietary restrictions',
    enum: DietaryRestriction,
    isArray: true,
    example: [DietaryRestriction.VEGETARIAN],
  })
  @IsArray()
  @IsEnum(DietaryRestriction, { each: true })
  dietaryRestrictions: DietaryRestriction[];

  @ApiPropertyOptional({
    description: 'Meal preferences and customizations',
    type: MealPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MealPreferencesDto)
  preferences?: MealPreferencesDto;

  @ApiPropertyOptional({ description: 'Whether the plan is a public template' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}

export class UpdateMealPlanDto {
  @ApiPropertyOptional({ description: 'Name of the meal plan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the meal plan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the meal plan',
    enum: PlanStatus,
  })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional({ description: 'Duration of the plan in days' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  durationDays?: number;

  @ApiPropertyOptional({
    description: 'Daily meal schedule structure',
    example: {
      day1: {
        breakfast: { mealId: 'uuid', portion: 1.0 },
        lunch: { mealId: 'uuid', portion: 1.0 },
      },
    },
  })
  @IsOptional()
  @IsObject()
  schedule?: {
    [day: string]: DayScheduleDto;
  };

  @ApiPropertyOptional({
    description: 'Nutritional targets for the plan',
    type: NutritionTargetsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionTargetsDto)
  nutritionTargets?: NutritionTargetsDto;

  @ApiPropertyOptional({
    description: 'Dietary restrictions',
    enum: DietaryRestriction,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(DietaryRestriction, { each: true })
  dietaryRestrictions?: DietaryRestriction[];

  @ApiPropertyOptional({
    description: 'Meal preferences and customizations',
    type: MealPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MealPreferencesDto)
  preferences?: MealPreferencesDto;
}

export class AssignMealPlanDto {
  @ApiProperty({ description: 'Meal plan ID to assign' })
  @IsUUID()
  mealPlanId: string;

  @ApiProperty({ description: 'Trainee ID to assign the plan to' })
  @IsUUID()
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
      modifiedMeals: [
        {
          originalMealId: 'uuid1',
          replacementMealId: 'uuid2',
          reason: 'Allergy to nuts',
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  customizations?: {
    modifiedMeals?: {
      originalMealId: string;
      replacementMealId: string;
      reason: string;
    }[];
    portionAdjustments?: {
      mealId: string;
      originalPortion: number;
      adjustedPortion: number;
      reason: string;
    }[];
    nutritionAdjustments?: {
      dailyCalories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      reason: string;
    };
    additionalNotes?: string;
  };
}

export class MealPlanResponseDto {
  @ApiProperty({ description: 'Meal plan ID' })
  id: string;

  @ApiProperty({ description: 'Name of the meal plan' })
  name: string;

  @ApiProperty({ description: 'Description of the meal plan' })
  description?: string;

  @ApiProperty({ description: 'Type of meal plan', enum: MealPlanType })
  planType: MealPlanType;

  @ApiProperty({ description: 'Duration of the plan in days' })
  durationDays: number;

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Assigned trainee information' })
  trainee?: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Status of the meal plan', enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty({ description: 'Daily meal schedule structure' })
  schedule: {
    [day: string]: DayScheduleDto;
  };

  @ApiProperty({ description: 'Nutritional targets for the plan' })
  nutritionTargets: NutritionTargetsDto;

  @ApiProperty({ description: 'Dietary restrictions' })
  dietaryRestrictions: DietaryRestriction[];

  @ApiProperty({ description: 'Meal preferences and customizations' })
  preferences?: MealPreferencesDto;

  @ApiProperty({ description: 'Shopping list for the meal plan' })
  shoppingList?: {
    category: string;
    items: {
      name: string;
      quantity: string;
      unit: string;
      estimated_cost?: number;
    }[];
  }[];

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

  @ApiProperty({ description: 'Estimated weekly cost' })
  estimatedWeeklyCost?: number;
}

export class MealPlanListResponseDto {
  @ApiProperty({ type: [MealPlanResponseDto] })
  plans: MealPlanResponseDto[];

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
