import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DifficultyLevel,
  MediaType,
  WorkoutType,
} from '../entities/workout.entity';

export class ExerciseDto {
  @ApiProperty({ description: 'Name of the exercise', example: 'Push-ups' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: 'Number of sets', example: 3 })
  @IsInt()
  @Min(1)
  @Max(20)
  sets: number;

  @ApiProperty({ description: 'Number of repetitions per set', example: 15 })
  @IsInt()
  @Min(1)
  @Max(200)
  reps: number;

  @ApiProperty({
    description: 'Rest time between sets in seconds',
    example: 60,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  restTime?: number;

  @ApiProperty({
    description: 'Additional notes for the exercise',
    required: false,
    example: 'Focus on proper form',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;

  @ApiProperty({
    description: 'Weight used for the exercise in kg',
    required: false,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  weight?: number;

  @ApiProperty({
    description: 'Instructions for performing the exercise',
    required: false,
    example: 'Keep your back straight and core engaged',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  instructions?: string;

  @ApiProperty({
    description: 'Duration of the exercise in seconds',
    required: false,
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3600)
  duration?: number; // Duration in seconds, optional for exercises
}

export class WorkoutMediaDto {
  @ApiProperty({
    description: 'Type of media',
    enum: MediaType,
    example: MediaType.IMAGE,
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({
    description: 'URL of the media file',
    example: '/uploads/workouts/exercise-demo.mp4',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Title of the media',
    required: false,
    example: 'Exercise demonstration video',
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  title?: string;

  @ApiProperty({
    description: 'Description of the media',
    required: false,
    example: 'Shows proper form for deadlift exercise',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;
}

export class CreateWorkoutDto {
  @ApiProperty({
    description: 'Name of the workout',
    example: 'Upper Body Strength Training',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the workout',
    required: false,
    example:
      'A comprehensive upper body workout focusing on compound movements',
  })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({
    description: 'List of exercises in the workout',
    type: [ExerciseDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];

  @ApiProperty({
    description: 'Type of workout',
    enum: WorkoutType,
    example: WorkoutType.STRENGTH,
  })
  @IsEnum(WorkoutType)
  workoutType: WorkoutType;

  @ApiProperty({
    description: 'Duration of the workout in minutes',
    example: 45,
  })
  @IsInt()
  @Min(5)
  @Max(300)
  duration: number;

  @ApiProperty({
    description: 'Difficulty level of the workout',
    enum: DifficultyLevel,
    example: DifficultyLevel.INTERMEDIATE,
  })
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  @ApiProperty({
    description: 'Media files associated with the workout',
    type: [WorkoutMediaDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkoutMediaDto)
  media?: WorkoutMediaDto[];

  @ApiProperty({
    description: 'Estimated calories burned during workout',
    required: false,
    example: 350,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  caloriesBurned?: number;

  @ApiProperty({
    description: 'Equipment needed for the workout',
    required: false,
    example: ['Dumbbells', 'Barbell', 'Bench'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiProperty({
    description: 'Target muscle groups',
    required: false,
    example: ['Chest', 'Shoulders', 'Triceps'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMuscleGroups?: string[];
}
