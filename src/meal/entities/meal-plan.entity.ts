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
import { UserEntity } from '../../auth/entities/user.entity';

export enum MealPlanType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  MAINTENANCE = 'maintenance',
  CUTTING = 'cutting',
  BULKING = 'bulking',
  KETO = 'keto',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  CUSTOM = 'custom',
}

export enum PlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
}

export enum DietaryRestriction {
  NONE = 'none',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten_free',
  DAIRY_FREE = 'dairy_free',
  NUT_FREE = 'nut_free',
  LOW_CARB = 'low_carb',
  KETO = 'keto',
  PALEO = 'paleo',
  HALAL = 'halal',
  KOSHER = 'kosher',
}

@Entity('meal_plans')
export class MealPlanEntity {
  @ApiProperty({ description: 'Unique identifier for the meal plan' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the meal plan' })
  @Column({ length: 100 })
  @Index()
  name: string;

  @ApiProperty({ description: 'Description of the meal plan' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ description: 'Type of meal plan', enum: MealPlanType })
  @Column({
    type: 'enum',
    enum: MealPlanType,
  })
  @Index()
  planType: MealPlanType;

  @ApiProperty({ description: 'Duration of the plan in days' })
  @Column('int')
  durationDays: number;

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

  @ApiProperty({ description: 'Status of the meal plan', enum: PlanStatus })
  @Column({
    type: 'enum',
    enum: PlanStatus,
    default: PlanStatus.DRAFT,
  })
  @Index()
  status: PlanStatus;

  @ApiProperty({
    description: 'Daily meal schedule structure',
    example: {
      day1: {
        breakfast: { mealId: 'uuid', portion: 1.0 },
        lunch: { mealId: 'uuid', portion: 1.0 },
        dinner: { mealId: 'uuid', portion: 1.0 },
        snacks: [{ mealId: 'uuid', portion: 0.5 }],
      },
    },
  })
  @Column('jsonb')
  schedule: {
    [day: string]: {
      breakfast?: {
        mealId: string;
        portion: number;
        notes?: string;
      };
      lunch?: {
        mealId: string;
        portion: number;
        notes?: string;
      };
      dinner?: {
        mealId: string;
        portion: number;
        notes?: string;
      };
      snacks?: {
        mealId: string;
        portion: number;
        notes?: string;
      }[];
    };
  };

  @ApiProperty({ description: 'Nutritional targets for the plan' })
  @Column('jsonb')
  nutritionTargets: {
    dailyCalories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    sugar?: number; // grams
    sodium?: number; // mg
    water?: number; // liters
  };

  @ApiProperty({
    description: 'Dietary restrictions',
    enum: DietaryRestriction,
    isArray: true,
    example: [DietaryRestriction.VEGETARIAN, DietaryRestriction.GLUTEN_FREE],
  })
  @Column('enum', {
    enum: DietaryRestriction,
    array: true,
    default: [DietaryRestriction.NONE],
  })
  dietaryRestrictions: DietaryRestriction[];

  @ApiProperty({ description: 'Meal preferences and customizations' })
  @Column('jsonb', { nullable: true })
  preferences?: {
    mealsPerDay?: number;
    snacksPerDay?: number;
    cookingTime?: 'quick' | 'medium' | 'extended'; // <30min, 30-60min, >60min
    skillLevel?: 'beginner' | 'intermediate' | 'advanced';
    budget?: 'low' | 'medium' | 'high';
    cuisineTypes?: string[];
    avoidedIngredients?: string[];
    preferredIngredients?: string[];
  };

  @ApiProperty({ description: 'Shopping list for the meal plan' })
  @Column('jsonb', { nullable: true })
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

  @ApiProperty({ description: 'Total estimated cost per week' })
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  estimatedWeeklyCost?: number;
}
