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
import { MealPlanEntity } from './meal-plan.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('meal_assignments')
export class MealAssignmentEntity {
  @ApiProperty({ description: 'Unique identifier for the meal assignment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Meal plan being assigned' })
  @ManyToOne(() => MealPlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  mealPlan: MealPlanEntity;

  @ApiProperty({ description: 'Meal plan ID' })
  @Column()
  @Index()
  mealPlanId: string;

  @ApiProperty({ description: 'Trainee receiving the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach who made the assignment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'When the plan should start' })
  @Column({ type: 'date' })
  @Index()
  startDate: Date;

  @ApiProperty({ description: 'When the plan should end' })
  @Column({ type: 'date' })
  endDate: Date;

  @ApiProperty({ description: 'Whether the assignment is active' })
  @Column({ default: true })
  @Index()
  isActive: boolean;

  @ApiProperty({
    description: 'Custom modifications to the plan for this trainee',
  })
  @Column('jsonb', { nullable: true })
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

  @ApiProperty({ description: 'Special instructions for the trainee' })
  @Column('text', { nullable: true })
  instructions?: string;

  @ApiProperty({ description: 'Priority level of this assignment' })
  @Column({ default: 1 })
  priority: number;

  @ApiProperty({ description: 'Progress tracking for the assignment' })
  @Column('jsonb', { nullable: true })
  progress?: {
    completedDays: number;
    adherencePercentage: number;
    averageRating: number;
    weightChange?: number;
    energyLevels?: number;
    satisfactionScore?: number;
    lastUpdated: Date;
  };

  @ApiProperty({ description: 'Assignment creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;
}
