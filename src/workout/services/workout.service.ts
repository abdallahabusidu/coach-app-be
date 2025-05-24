import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike, Between } from 'typeorm';
import { WorkoutEntity, WorkoutType, DifficultyLevel } from '../entities/workout.entity';
import { CreateWorkoutDto } from '../dtos/create-workout.dto';
import { UpdateWorkoutDto } from '../dtos/update-workout.dto';
import { WorkoutQueryDto } from '../dtos/workout-query.dto';
import { WorkoutStatsResponseDto } from '../dtos/workout-response.dto';

@Injectable()
export class WorkoutService {
  private readonly logger = new Logger(WorkoutService.name);

  constructor(
    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,
  ) {}

  /**
   * Create a new workout
   */
  async create(createWorkoutDto: CreateWorkoutDto): Promise<WorkoutEntity> {
    try {
      // Check if workout with same name already exists
      const existingWorkout = await this.workoutRepository.findOne({
        where: { name: createWorkoutDto.name },
      });

      if (existingWorkout) {
        throw new ConflictException(`Workout with name "${createWorkoutDto.name}" already exists`);
      }

      // Validate exercises data
      this.validateExercises(createWorkoutDto.exercises);

      const workout = this.workoutRepository.create({
        ...createWorkoutDto,
        media: createWorkoutDto.media || [],
        equipment: createWorkoutDto.equipment || [],
        targetMuscleGroups: createWorkoutDto.targetMuscleGroups || [],
      });

      const savedWorkout = await this.workoutRepository.save(workout);
      
      this.logger.log(`Created new workout: ${savedWorkout.name} (ID: ${savedWorkout.id})`);
      return savedWorkout;
    } catch (error) {
      this.logger.error(`Failed to create workout: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get all workouts with filtering and pagination
   */
  async findAll(queryDto: WorkoutQueryDto): Promise<{
    workouts: WorkoutEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page, limit, sortBy, sortOrder, ...filters } = queryDto;
      
      const skip = (page - 1) * limit;
      const whereClause = this.buildWhereClause(filters);

      const [workouts, total] = await this.workoutRepository.findAndCount({
        where: whereClause,
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.log(`Retrieved ${workouts.length} workouts (page ${page}/${totalPages})`);

      return {
        workouts,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve workouts: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve workouts');
    }
  }

  /**
   * Get a specific workout by ID
   */
  async findOne(id: string): Promise<WorkoutEntity> {
    try {
      const workout = await this.workoutRepository.findOne({
        where: { id },
      });

      if (!workout) {
        throw new NotFoundException(`Workout with ID ${id} not found`);
      }

      this.logger.log(`Retrieved workout: ${workout.name} (ID: ${id})`);
      return workout;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve workout ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve workout');
    }
  }

  /**
   * Update an existing workout
   */
  async update(id: string, updateWorkoutDto: UpdateWorkoutDto): Promise<WorkoutEntity> {
    try {
      const workout = await this.findOne(id);

      // Check for name conflicts if name is being updated
      if (updateWorkoutDto.name && updateWorkoutDto.name !== workout.name) {
        const existingWorkout = await this.workoutRepository.findOne({
          where: { name: updateWorkoutDto.name },
        });

        if (existingWorkout) {
          throw new ConflictException(`Workout with name "${updateWorkoutDto.name}" already exists`);
        }
      }

      // Validate exercises if provided
      if (updateWorkoutDto.exercises) {
        this.validateExercises(updateWorkoutDto.exercises);
      }

      // Merge the updates
      const updatedWorkout = this.workoutRepository.merge(workout, updateWorkoutDto);
      const savedWorkout = await this.workoutRepository.save(updatedWorkout);

      this.logger.log(`Updated workout: ${savedWorkout.name} (ID: ${id})`);
      return savedWorkout;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to update workout ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update workout');
    }
  }

  /**
   * Delete a workout
   */
  async remove(id: string): Promise<void> {
    try {
      const workout = await this.findOne(id);
      await this.workoutRepository.remove(workout);
      
      this.logger.log(`Deleted workout: ${workout.name} (ID: ${id})`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete workout ${id}: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete workout');
    }
  }

  /**
   * Get workout statistics
   */
  async getStatistics(): Promise<WorkoutStatsResponseDto> {
    try {
      const totalWorkouts = await this.workoutRepository.count();
      
      if (totalWorkouts === 0) {
        return {
          totalWorkouts: 0,
          averageDuration: 0,
          averageCalories: 0,
          workoutsByType: {},
          workoutsByDifficulty: {},
          popularEquipment: [],
          popularMuscleGroups: [],
        };
      }

      // Get averages
      const avgResult = await this.workoutRepository
        .createQueryBuilder('workout')
        .select('AVG(workout.duration)', 'avgDuration')
        .addSelect('AVG(workout.caloriesBurned)', 'avgCalories')
        .getRawOne();

      // Get workout distribution by type
      const typeDistribution = await this.workoutRepository
        .createQueryBuilder('workout')
        .select('workout.workoutType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('workout.workoutType')
        .getRawMany();

      // Get workout distribution by difficulty
      const difficultyDistribution = await this.workoutRepository
        .createQueryBuilder('workout')
        .select('workout.difficulty', 'difficulty')
        .addSelect('COUNT(*)', 'count')
        .groupBy('workout.difficulty')
        .getRawMany();

      // Get popular equipment
      const equipmentStats = await this.workoutRepository
        .createQueryBuilder('workout')
        .select('UNNEST(workout.equipment)', 'equipment')
        .addSelect('COUNT(*)', 'count')
        .groupBy('equipment')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      // Get popular muscle groups
      const muscleGroupStats = await this.workoutRepository
        .createQueryBuilder('workout')
        .select('UNNEST(workout.targetMuscleGroups)', 'muscleGroup')
        .addSelect('COUNT(*)', 'count')
        .groupBy('muscleGroup')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();

      const workoutsByType = typeDistribution.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {});

      const workoutsByDifficulty = difficultyDistribution.reduce((acc, item) => {
        acc[item.difficulty] = parseInt(item.count);
        return acc;
      }, {});

      const popularEquipment = equipmentStats.map(item => ({
        equipment: item.equipment,
        count: parseInt(item.count),
      }));

      const popularMuscleGroups = muscleGroupStats.map(item => ({
        muscleGroup: item.muscleGroup,
        count: parseInt(item.count),
      }));

      this.logger.log('Generated workout statistics');

      return {
        totalWorkouts,
        averageDuration: parseFloat(avgResult.avgDuration) || 0,
        averageCalories: parseFloat(avgResult.avgCalories) || 0,
        workoutsByType,
        workoutsByDifficulty,
        popularEquipment,
        popularMuscleGroups,
      };
    } catch (error) {
      this.logger.error(`Failed to generate statistics: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to generate workout statistics');
    }
  }

  /**
   * Get workouts by type
   */
  async findByType(workoutType: WorkoutType): Promise<WorkoutEntity[]> {
    try {
      const workouts = await this.workoutRepository.find({
        where: { workoutType },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${workouts.length} workouts of type: ${workoutType}`);
      return workouts;
    } catch (error) {
      this.logger.error(`Failed to retrieve workouts by type: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve workouts by type');
    }
  }

  /**
   * Get workouts by difficulty
   */
  async findByDifficulty(difficulty: DifficultyLevel): Promise<WorkoutEntity[]> {
    try {
      const workouts = await this.workoutRepository.find({
        where: { difficulty },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${workouts.length} workouts of difficulty: ${difficulty}`);
      return workouts;
    } catch (error) {
      this.logger.error(`Failed to retrieve workouts by difficulty: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to retrieve workouts by difficulty');
    }
  }

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters: Partial<WorkoutQueryDto>): FindOptionsWhere<WorkoutEntity> {
    const where: FindOptionsWhere<WorkoutEntity> = {};

    if (filters.workoutType) {
      where.workoutType = filters.workoutType;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.minDuration !== undefined || filters.maxDuration !== undefined) {
      where.duration = Between(
        filters.minDuration || 0,
        filters.maxDuration || 999999
      );
    }

    if (filters.minCalories !== undefined || filters.maxCalories !== undefined) {
      where.caloriesBurned = Between(
        filters.minCalories || 0,
        filters.maxCalories || 999999
      );
    }

    if (filters.search) {
      // Note: For PostgreSQL, you might want to use more advanced search
      where.name = ILike(`%${filters.search}%`);
    }

    return where;
  }

  /**
   * Validate exercises data
   */
  private validateExercises(exercises: any[]): void {
    if (!exercises || exercises.length === 0) {
      throw new BadRequestException('At least one exercise is required');
    }

    for (const exercise of exercises) {
      if (!exercise.name || !exercise.sets || !exercise.reps) {
        throw new BadRequestException('Each exercise must have name, sets, and reps');
      }

      if (exercise.sets < 1 || exercise.sets > 20) {
        throw new BadRequestException('Sets must be between 1 and 20');
      }

      if (exercise.reps < 1 || exercise.reps > 200) {
        throw new BadRequestException('Reps must be between 1 and 200');
      }

      if (exercise.restTime !== undefined && (exercise.restTime < 0 || exercise.restTime > 600)) {
        throw new BadRequestException('Rest time must be between 0 and 600 seconds');
      }
    }
  }
}
