import { ApiProperty } from '@nestjs/swagger';
import { WorkoutEntity } from '../entities/workout.entity';

export class WorkoutResponseDto {
  @ApiProperty({ description: 'Workout details' })
  workout: WorkoutEntity;
}

export class WorkoutListResponseDto {
  @ApiProperty({ description: 'List of workouts', type: [WorkoutEntity] })
  workouts: WorkoutEntity[];

  @ApiProperty({ description: 'Total number of workouts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class WorkoutStatsResponseDto {
  @ApiProperty({ description: 'Total number of workouts' })
  totalWorkouts: number;

  @ApiProperty({ description: 'Average workout duration in minutes' })
  averageDuration: number;

  @ApiProperty({ description: 'Average calories burned per workout' })
  averageCalories: number;

  @ApiProperty({ description: 'Distribution of workouts by type' })
  workoutsByType: Record<string, number>;

  @ApiProperty({ description: 'Distribution of workouts by difficulty' })
  workoutsByDifficulty: Record<string, number>;

  @ApiProperty({ description: 'Most common equipment used' })
  popularEquipment: { equipment: string; count: number }[];

  @ApiProperty({ description: 'Most targeted muscle groups' })
  popularMuscleGroups: { muscleGroup: string; count: number }[];
}
