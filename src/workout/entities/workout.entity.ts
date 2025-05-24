import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
}

@Entity('workouts')
export class WorkoutEntity {
  @ApiProperty({ description: 'Unique identifier for the workout' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the workout' })
  @Column({ length: 100 })
  @Index()
  name: string;

  @ApiProperty({ description: 'Detailed description of the workout' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ 
    description: 'List of exercises in the workout',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        sets: { type: 'number' },
        reps: { type: 'number' },
        restTime: { type: 'number' },
        notes: { type: 'string' }
      }
    }
  })
  @Column('jsonb')
  exercises: {
    name: string;
    sets: number;
    reps: number;
    restTime?: number; // in seconds
    notes?: string;
  }[];

  @ApiProperty({ 
    description: 'Type of workout',
    enum: WorkoutType,
    example: WorkoutType.STRENGTH
  })
  @Column({
    type: 'enum',
    enum: WorkoutType,
  })
  @Index()
  workoutType: WorkoutType;

  @ApiProperty({ description: 'Duration of the workout in minutes' })
  @Column('int')
  @Index()
  duration: number;

  @ApiProperty({ 
    description: 'Difficulty level of the workout',
    enum: DifficultyLevel,
    example: DifficultyLevel.INTERMEDIATE
  })
  @Column({
    type: 'enum',
    enum: DifficultyLevel,
  })
  @Index()
  difficulty: DifficultyLevel;

  @ApiProperty({ 
    description: 'Media files associated with the workout',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { 
          type: 'string',
          enum: ['image', 'video', 'pdf']
        },
        url: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  @Column('jsonb', { default: [] })
  media: {
    type: MediaType;
    url: string;
    title?: string;
    description?: string;
  }[];

  @ApiProperty({ description: 'Estimated calories burned during workout' })
  @Column('int', { nullable: true })
  caloriesBurned?: number;

  @ApiProperty({ description: 'Equipment needed for the workout' })
  @Column('text', { array: true, default: [] })
  equipment: string[];

  @ApiProperty({ description: 'Target muscle groups' })
  @Column('text', { array: true, default: [] })
  targetMuscleGroups: string[];

  @ApiProperty({ description: 'Workout creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Workout last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
