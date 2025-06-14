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
  TemplateType,
  TemplateStatus,
  DifficultyLevel,
  Gender,
} from '../entities/template.entity';

export class WorkoutScheduleItemDto {
  @ApiProperty({ description: 'Workout ID' })
  @IsUUID()
  workoutId: string;

  @ApiProperty({ description: 'Time slot for the workout' })
  @IsEnum(['morning', 'afternoon', 'evening'])
  timeSlot: 'morning' | 'afternoon' | 'evening';

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({ description: 'Notes for this workout' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MealScheduleItemDto {
  @ApiProperty({ description: 'Meal ID' })
  @IsUUID()
  mealId: string;

  @ApiProperty({ description: 'Type of meal' })
  @IsEnum([
    'breakfast',
    'lunch',
    'dinner',
    'snack1',
    'snack2',
    'pre_workout',
    'post_workout',
  ])
  mealType:
    | 'breakfast'
    | 'lunch'
    | 'dinner'
    | 'snack1'
    | 'snack2'
    | 'pre_workout'
    | 'post_workout';

  @ApiProperty({ description: 'Portion size multiplier' })
  @IsNumber()
  @Min(0.1)
  @Max(3.0)
  portion: number;

  @ApiPropertyOptional({ description: 'Meal timing relative to workouts' })
  @IsOptional()
  @IsString()
  timing?: string;

  @ApiPropertyOptional({ description: 'Notes for this meal' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SupplementDto {
  @ApiProperty({ description: 'Supplement name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Dosage information' })
  @IsString()
  dosage: string;

  @ApiProperty({ description: 'Timing for taking the supplement' })
  @IsString()
  timing: string;
}

export class DayScheduleDto {
  @ApiPropertyOptional({
    description: 'Workouts for this day',
    type: [WorkoutScheduleItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutScheduleItemDto)
  workouts?: WorkoutScheduleItemDto[];

  @ApiPropertyOptional({
    description: 'Meals for this day',
    type: [MealScheduleItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealScheduleItemDto)
  meals?: MealScheduleItemDto[];

  @ApiProperty({ description: 'Whether this is a rest day' })
  @IsBoolean()
  restDay: boolean;

  @ApiPropertyOptional({ description: 'Daily notes' })
  @IsOptional()
  @IsString()
  dailyNotes?: string;

  @ApiPropertyOptional({
    description: 'Supplements for this day',
    type: [SupplementDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SupplementDto)
  supplements?: SupplementDto[];
}

export class TargetCriteriaDto {
  @ApiProperty({ description: 'Age range', type: Object })
  @ValidateNested()
  @Type(() => Object)
  ageRange: {
    min: number;
    max: number;
  };

  @ApiPropertyOptional({
    description: 'Target genders',
    enum: Gender,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  gender?: Gender[];

  @ApiProperty({
    description: 'Fitness levels',
    enum: DifficultyLevel,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DifficultyLevel, { each: true })
  fitnessLevel: DifficultyLevel[];

  @ApiProperty({
    description: 'Target goals',
    enum: TemplateType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(TemplateType, { each: true })
  goals: TemplateType[];

  @ApiPropertyOptional({ description: 'Weight range in kg' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  weightRange?: {
    min: number;
    max: number;
  };

  @ApiPropertyOptional({ description: 'Height range in cm' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  heightRange?: {
    min: number;
    max: number;
  };

  @ApiPropertyOptional({ description: 'Activity levels', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activityLevel?: (
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extremely_active'
  )[];

  @ApiPropertyOptional({
    description: 'Medical conditions to consider',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalConditions?: string[];

  @ApiPropertyOptional({ description: 'Dietary restrictions', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional({ description: 'Required equipment', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentRequired?: string[];

  @ApiPropertyOptional({ description: 'Time availability requirements' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  timeAvailability?: {
    minMinutesPerDay: number;
    maxMinutesPerDay: number;
    daysPerWeek: number;
  };
}

export class NutritionTargetsDto {
  @ApiProperty({ description: 'Daily calorie target' })
  @IsNumber()
  @Min(1000)
  @Max(5000)
  dailyCalories: number;

  @ApiProperty({ description: 'Daily protein target (grams)' })
  @IsNumber()
  @Min(50)
  @Max(300)
  protein: number;

  @ApiProperty({ description: 'Daily carbs target (grams)' })
  @IsNumber()
  @Min(50)
  @Max(500)
  carbs: number;

  @ApiProperty({ description: 'Daily fat target (grams)' })
  @IsNumber()
  @Min(20)
  @Max(200)
  fat: number;

  @ApiPropertyOptional({ description: 'Daily fiber target (grams)' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(100)
  fiber?: number;

  @ApiPropertyOptional({ description: 'Daily water target (liters)' })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(5)
  water?: number;

  @ApiPropertyOptional({ description: 'Calorie distribution across meals' })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  calorieDistribution?: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snacks: number;
  };
}

export class FitnessTargetsDto {
  @ApiProperty({ description: 'Primary fitness goals', type: [String] })
  @IsArray()
  @IsString({ each: true })
  primaryGoals: string[];

  @ApiPropertyOptional({
    description: 'Secondary fitness goals',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  secondaryGoals?: string[];

  @ApiProperty({ description: 'Expected outcomes' })
  @ValidateNested()
  @Type(() => Object)
  expectedOutcomes: {
    weightChange?: number;
    strengthIncrease?: number;
    enduranceImprovement?: number;
    bodyFatChange?: number;
  };

  @ApiProperty({ description: 'Progress milestones' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  progressMilestones: {
    week: number;
    description: string;
    measurableTarget: string;
  }[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Name of the template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Type of template', enum: TemplateType })
  @IsEnum(TemplateType)
  templateType: TemplateType;

  @ApiProperty({ description: 'Duration in weeks' })
  @IsNumber()
  @Min(1)
  @Max(52)
  durationWeeks: number;

  @ApiProperty({ description: 'Difficulty level', enum: DifficultyLevel })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({
    description: 'Daily schedule combining workouts and meals',
    example: {
      week1: {
        day1: {
          workouts: [{ workoutId: 'uuid', timeSlot: 'morning' }],
          meals: [{ mealId: 'uuid', mealType: 'breakfast', portion: 1.0 }],
          restDay: false,
        },
      },
    },
  })
  @IsObject()
  schedule: {
    [week: string]: {
      [day: string]: DayScheduleDto;
    };
  };

  @ApiProperty({
    description: 'Target criteria for this template',
    type: TargetCriteriaDto,
  })
  @ValidateNested()
  @Type(() => TargetCriteriaDto)
  targetCriteria: TargetCriteriaDto;

  @ApiProperty({ description: 'Nutrition targets', type: NutritionTargetsDto })
  @ValidateNested()
  @Type(() => NutritionTargetsDto)
  nutritionTargets: NutritionTargetsDto;

  @ApiProperty({ description: 'Fitness targets', type: FitnessTargetsDto })
  @ValidateNested()
  @Type(() => FitnessTargetsDto)
  fitnessTargets: FitnessTargetsDto;

  @ApiProperty({ description: 'Equipment required', type: [String] })
  @IsArray()
  @IsString({ each: true })
  equipmentRequired: string[];

  @ApiPropertyOptional({ description: 'Prerequisites and warnings' })
  @IsOptional()
  @IsObject()
  prerequisites?: {
    fitnessRequirements?: string[];
    medicalClearance?: boolean;
    experienceLevel?: string;
    warnings?: string[];
    contraindications?: string[];
  };

  @ApiProperty({ description: 'Tags for better searchability', type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ description: 'Whether the template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Name of the template' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Status of the template',
    enum: TemplateStatus,
  })
  @IsOptional()
  @IsEnum(TemplateStatus)
  status?: TemplateStatus;

  @ApiPropertyOptional({ description: 'Duration in weeks' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  durationWeeks?: number;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: DifficultyLevel,
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Daily schedule combining workouts and meals',
  })
  @IsOptional()
  @IsObject()
  schedule?: {
    [week: string]: {
      [day: string]: DayScheduleDto;
    };
  };

  @ApiPropertyOptional({
    description: 'Target criteria for this template',
    type: TargetCriteriaDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TargetCriteriaDto)
  targetCriteria?: TargetCriteriaDto;

  @ApiPropertyOptional({
    description: 'Nutrition targets',
    type: NutritionTargetsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionTargetsDto)
  nutritionTargets?: NutritionTargetsDto;

  @ApiPropertyOptional({
    description: 'Fitness targets',
    type: FitnessTargetsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FitnessTargetsDto)
  fitnessTargets?: FitnessTargetsDto;

  @ApiPropertyOptional({ description: 'Equipment required', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentRequired?: string[];

  @ApiPropertyOptional({
    description: 'Tags for better searchability',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the template is public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template ID' })
  id: string;

  @ApiProperty({ description: 'Name of the template' })
  name: string;

  @ApiProperty({ description: 'Description of the template' })
  description?: string;

  @ApiProperty({ description: 'Type of template', enum: TemplateType })
  templateType: TemplateType;

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Status of the template', enum: TemplateStatus })
  status: TemplateStatus;

  @ApiProperty({ description: 'Duration in weeks' })
  durationWeeks: number;

  @ApiProperty({ description: 'Difficulty level', enum: DifficultyLevel })
  difficulty: DifficultyLevel;

  @ApiProperty({ description: 'Daily schedule structure' })
  schedule: {
    [week: string]: {
      [day: string]: DayScheduleDto;
    };
  };

  @ApiProperty({ description: 'Target criteria' })
  targetCriteria: TargetCriteriaDto;

  @ApiProperty({ description: 'Nutrition targets' })
  nutritionTargets: NutritionTargetsDto;

  @ApiProperty({ description: 'Fitness targets' })
  fitnessTargets: FitnessTargetsDto;

  @ApiProperty({ description: 'Equipment required' })
  equipmentRequired: string[];

  @ApiProperty({ description: 'Prerequisites and warnings' })
  prerequisites?: {
    fitnessRequirements?: string[];
    medicalClearance?: boolean;
    experienceLevel?: string;
    warnings?: string[];
    contraindications?: string[];
  };

  @ApiProperty({ description: 'Tags' })
  tags: string[];

  @ApiProperty({ description: 'Whether the template is public' })
  isPublic: boolean;

  @ApiProperty({ description: 'Usage count' })
  usageCount: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Success rate' })
  successRate: number;

  @ApiProperty({ description: 'Estimated weekly cost' })
  estimatedWeeklyCost?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Publication date' })
  publishedAt?: Date;
}

export class TemplateListResponseDto {
  @ApiProperty({ type: [TemplateResponseDto] })
  templates: TemplateResponseDto[];

  @ApiProperty({ description: 'Total number of templates' })
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
