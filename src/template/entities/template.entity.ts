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

export enum TemplateType {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  STRENGTH_BUILDING = 'strength_building',
  ENDURANCE = 'endurance',
  GENERAL_FITNESS = 'general_fitness',
  CUTTING = 'cutting',
  BULKING = 'bulking',
  MAINTENANCE = 'maintenance',
  REHABILITATION = 'rehabilitation',
  BEGINNER_PROGRAM = 'beginner_program',
  INTERMEDIATE_PROGRAM = 'intermediate_program',
  ADVANCED_PROGRAM = 'advanced_program',
}

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  PUBLISHED = 'published',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('templates')
export class TemplateEntity {
  @ApiProperty({ description: 'Unique identifier for the template' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the template' })
  @Column({ length: 100 })
  @Index()
  name: string;

  @ApiProperty({ description: 'Description of the template' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ description: 'Type of template', enum: TemplateType })
  @Column({
    type: 'enum',
    enum: TemplateType,
  })
  @Index()
  templateType: TemplateType;

  @ApiProperty({ description: 'Coach who created the template' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Status of the template', enum: TemplateStatus })
  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  @Index()
  status: TemplateStatus;

  @ApiProperty({ description: 'Duration of the template in weeks' })
  @Column('int')
  durationWeeks: number;

  @ApiProperty({ description: 'Difficulty level', enum: DifficultyLevel })
  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
  @Index()
  difficulty: DifficultyLevel;

  @ApiProperty({
    description: 'Daily schedule combining workouts and meals',
    example: {
      week1: {
        day1: {
          workouts: [{ workoutId: 'uuid1', timeSlot: 'morning', duration: 60 }],
          meals: [
            { mealId: 'uuid1', mealType: 'breakfast', portion: 1.0 },
            { mealId: 'uuid2', mealType: 'lunch', portion: 1.0 },
          ],
          restDay: false,
          notes: 'Focus on form over speed',
        },
      },
    },
  })
  @Column('jsonb')
  schedule: {
    [week: string]: {
      [day: string]: {
        workouts?: {
          workoutId: string;
          timeSlot: 'morning' | 'afternoon' | 'evening';
          duration?: number;
          notes?: string;
        }[];
        meals?: {
          mealId: string;
          mealType:
            | 'breakfast'
            | 'lunch'
            | 'dinner'
            | 'snack1'
            | 'snack2'
            | 'pre_workout'
            | 'post_workout';
          portion: number;
          timing?: string; // e.g., '30 minutes before workout'
          notes?: string;
        }[];
        restDay: boolean;
        dailyNotes?: string;
        supplements?: {
          name: string;
          dosage: string;
          timing: string;
        }[];
      };
    };
  };

  @ApiProperty({
    description: 'Target demographic and criteria for this template',
  })
  @Column('jsonb')
  targetCriteria: {
    ageRange: {
      min: number;
      max: number;
    };
    gender?: Gender[];
    fitnessLevel: DifficultyLevel[];
    goals: TemplateType[];
    weightRange?: {
      min: number;
      max: number;
    };
    heightRange?: {
      min: number;
      max: number;
    };
    activityLevel?: (
      | 'sedentary'
      | 'lightly_active'
      | 'moderately_active'
      | 'very_active'
      | 'extremely_active'
    )[];
    medicalConditions?: string[];
    dietaryRestrictions?: string[];
    equipmentRequired?: string[];
    timeAvailability?: {
      minMinutesPerDay: number;
      maxMinutesPerDay: number;
      daysPerWeek: number;
    };
  };

  @ApiProperty({ description: 'Nutritional targets for the template' })
  @Column('jsonb')
  nutritionTargets: {
    dailyCalories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    water?: number; // liters
    calorieDistribution?: {
      breakfast: number; // percentage
      lunch: number;
      dinner: number;
      snacks: number;
    };
  };

  @ApiProperty({ description: 'Fitness goals and progression targets' })
  @Column('jsonb')
  fitnessTargets: {
    primaryGoals: string[];
    secondaryGoals?: string[];
    expectedOutcomes: {
      weightChange?: number; // kg (positive for gain, negative for loss)
      strengthIncrease?: number; // percentage
      enduranceImprovement?: number; // percentage
      bodyFatChange?: number; // percentage change
    };
    progressMilestones: {
      week: number;
      description: string;
      measurableTarget: string;
    }[];
  };

  @ApiProperty({ description: 'Equipment required for this template' })
  @Column('text', { array: true, default: [] })
  equipmentRequired: string[];

  @ApiProperty({ description: 'Prerequisites and warnings' })
  @Column('jsonb', { nullable: true })
  prerequisites?: {
    fitnessRequirements?: string[];
    medicalClearance?: boolean;
    experienceLevel?: string;
    warnings?: string[];
    contraindications?: string[];
  };

  @ApiProperty({ description: 'Template tags for better searchability' })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ApiProperty({ description: 'Whether the template is public/shareable' })
  @Column({ default: false })
  isPublic: boolean;

  @ApiProperty({ description: 'Number of times this template has been used' })
  @Column({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Average rating of the template' })
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @ApiProperty({ description: 'Number of ratings received' })
  @Column({ default: 0 })
  ratingCount: number;

  @ApiProperty({
    description: 'Estimated weekly cost for following this template',
  })
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  estimatedWeeklyCost?: number;

  @ApiProperty({
    description: 'Success rate of trainees completing this template',
  })
  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  successRate: number;

  @ApiProperty({ description: 'Template creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Template last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Template publication date' })
  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;
}
