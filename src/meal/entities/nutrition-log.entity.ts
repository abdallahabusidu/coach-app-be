import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { MealEntity } from './meal.entity';
import { MealPlanEntity } from './meal-plan.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('nutrition_logs')
@Unique(['traineeId', 'logDate', 'mealId', 'mealTime'])
export class NutritionLogEntity {
  @ApiProperty({ description: 'Unique identifier for the nutrition log entry' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Trainee who logged this meal' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Meal that was consumed' })
  @ManyToOne(() => MealEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  meal: MealEntity;

  @ApiProperty({ description: 'Meal ID' })
  @Column()
  @Index()
  mealId: string;

  @ApiProperty({ description: 'Meal plan this log belongs to (optional)' })
  @ManyToOne(() => MealPlanEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn()
  mealPlan?: MealPlanEntity;

  @ApiProperty({ description: 'Meal plan ID (optional)' })
  @Column({ nullable: true })
  @Index()
  mealPlanId?: string;

  @ApiProperty({ description: 'Date when the meal was consumed' })
  @Column({ type: 'date' })
  @Index()
  logDate: Date;

  @ApiProperty({ description: 'Time when the meal was consumed' })
  @Column({ type: 'time' })
  mealTime: string;

  @ApiProperty({ description: 'Meal type/category', example: 'breakfast' })
  @Column({ length: 50 })
  @Index()
  mealCategory: string; // breakfast, lunch, dinner, snack1, snack2, etc.

  @ApiProperty({ description: 'Portion size multiplier', example: 1.5 })
  @Column('decimal', { precision: 4, scale: 2, default: 1.0 })
  portionSize: number;

  @ApiProperty({ description: 'Actual calories consumed (calculated from meal * portion)' })
  @Column('decimal', { precision: 8, scale: 2 })
  actualCalories: number;

  @ApiProperty({ description: 'Actual protein consumed (grams)' })
  @Column('decimal', { precision: 8, scale: 2 })
  actualProtein: number;

  @ApiProperty({ description: 'Actual carbs consumed (grams)' })
  @Column('decimal', { precision: 8, scale: 2 })
  actualCarbs: number;

  @ApiProperty({ description: 'Actual fat consumed (grams)' })
  @Column('decimal', { precision: 8, scale: 2 })
  actualFat: number;

  @ApiProperty({ description: 'Additional nutritional information' })
  @Column('jsonb', { nullable: true })
  additionalNutrition?: {
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
    vitaminC?: number;
    calcium?: number;
    iron?: number;
  };

  @ApiProperty({ description: 'Trainee notes about the meal' })
  @Column('text', { nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Rating of the meal (1-5 stars)' })
  @Column('int', { nullable: true })
  rating?: number;

  @ApiProperty({ description: 'Photo of the actual meal consumed' })
  @Column('text', { nullable: true })
  photoUrl?: string;

  @ApiProperty({ description: 'Whether this was a planned meal or improvised' })
  @Column({ default: true })
  wasPlanned: boolean;

  @ApiProperty({ description: 'Location where the meal was consumed' })
  @Column({ length: 100, nullable: true })
  location?: string;

  @ApiProperty({ description: 'Mood/energy level after eating (1-5)' })
  @Column('int', { nullable: true })
  moodAfterEating?: number;

  @ApiProperty({ description: 'Hunger level before eating (1-5)' })
  @Column('int', { nullable: true })
  hungerLevelBefore?: number;

  @ApiProperty({ description: 'Satiety level after eating (1-5)' })
  @Column('int', { nullable: true })
  satietyLevelAfter?: number;

  @ApiProperty({ description: 'Log creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
