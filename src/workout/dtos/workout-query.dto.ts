import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { WorkoutType, DifficultyLevel } from '../entities/workout.entity';

export class WorkoutQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by workout type',
    enum: WorkoutType,
    required: false,
  })
  @IsOptional()
  @IsEnum(WorkoutType)
  workoutType?: WorkoutType;

  @ApiProperty({
    description: 'Filter by difficulty level',
    enum: DifficultyLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiProperty({
    description: 'Minimum duration in minutes',
    required: false,
    minimum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  minDuration?: number;

  @ApiProperty({
    description: 'Maximum duration in minutes',
    required: false,
    maximum: 300,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(300)
  maxDuration?: number;

  @ApiProperty({
    description: 'Minimum calories burned',
    required: false,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minCalories?: number;

  @ApiProperty({
    description: 'Maximum calories burned',
    required: false,
    maximum: 2000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(2000)
  maxCalories?: number;

  @ApiProperty({
    description: 'Search in workout name and description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by equipment needed',
    required: false,
    example: 'Dumbbells',
  })
  @IsOptional()
  @IsString()
  equipment?: string;

  @ApiProperty({
    description: 'Filter by target muscle group',
    required: false,
    example: 'Chest',
  })
  @IsOptional()
  @IsString()
  targetMuscleGroup?: string;

  @ApiProperty({
    description: 'Field to sort by',
    required: false,
    default: 'createdAt',
    enum: ['name', 'duration', 'difficulty', 'caloriesBurned', 'createdAt'],
  })
  @IsOptional()
  @IsIn(['name', 'duration', 'difficulty', 'caloriesBurned', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
