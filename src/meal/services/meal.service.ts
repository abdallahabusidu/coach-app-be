import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { MealEntity, MealType } from '../entities/meal.entity';
import { CreateMealDto } from '../dtos/create-meal.dto';
import { UpdateMealDto } from '../dtos/update-meal.dto';
import { MealQueryDto } from '../dtos/meal-query.dto';
import { PaginatedMealsResponseDto, MealResponseDto } from '../dtos/meal-response.dto';

@Injectable()
export class MealService {
  private readonly logger = new Logger(MealService.name);

  constructor(
    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,
  ) {}

  /**
   * Create a new meal
   */
  async create(createMealDto: CreateMealDto): Promise<MealResponseDto> {
    try {
      const meal = this.mealRepository.create(createMealDto);
      const savedMeal = await this.mealRepository.save(meal);
      
      this.logger.log(`Created new meal: ${savedMeal.name} (ID: ${savedMeal.id})`);
      return new MealResponseDto(savedMeal);
    } catch (error) {
      this.logger.error(`Failed to create meal: ${error.message}`);
      throw new BadRequestException('Failed to create meal');
    }
  }

  /**
   * Get all meals with filtering and pagination
   */
  async findAll(queryDto: MealQueryDto): Promise<PaginatedMealsResponseDto> {
    const { page = 1, limit = 10, mealType, search, maxCalories, minProtein } = queryDto;

    try {
      const queryBuilder = this.mealRepository.createQueryBuilder('meal');

      // Apply filters
      if (mealType) {
        queryBuilder.andWhere('meal.mealType = :mealType', { mealType });
      }

      if (search) {
        queryBuilder.andWhere(
          '(meal.name ILIKE :search OR meal.description ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (maxCalories) {
        queryBuilder.andWhere('meal.calories <= :maxCalories', { maxCalories });
      }

      if (minProtein) {
        queryBuilder.andWhere('meal.protein >= :minProtein', { minProtein });
      }

      // Add ordering
      queryBuilder.orderBy('meal.createdAt', 'DESC');

      // Apply pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [meals, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Retrieved ${meals.length} meals (page ${page}, total: ${total})`);
      return new PaginatedMealsResponseDto(meals, total, page, limit);
    } catch (error) {
      this.logger.error(`Failed to retrieve meals: ${error.message}`);
      throw new BadRequestException('Failed to retrieve meals');
    }
  }

  /**
   * Get a single meal by ID
   */
  async findOne(id: string): Promise<MealResponseDto> {
    try {
      const meal = await this.mealRepository.findOne({ where: { id } });
      
      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      this.logger.log(`Retrieved meal: ${meal.name} (ID: ${id})`);
      return new MealResponseDto(meal);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve meal ${id}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve meal');
    }
  }

  /**
   * Update a meal
   */
  async update(id: string, updateMealDto: UpdateMealDto): Promise<MealResponseDto> {
    try {
      const meal = await this.mealRepository.findOne({ where: { id } });
      
      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      // Update the meal with new data
      Object.assign(meal, updateMealDto);
      const updatedMeal = await this.mealRepository.save(meal);

      this.logger.log(`Updated meal: ${updatedMeal.name} (ID: ${id})`);
      return new MealResponseDto(updatedMeal);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update meal ${id}: ${error.message}`);
      throw new BadRequestException('Failed to update meal');
    }
  }

  /**
   * Delete a meal
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const meal = await this.mealRepository.findOne({ where: { id } });
      
      if (!meal) {
        throw new NotFoundException(`Meal with ID ${id} not found`);
      }

      await this.mealRepository.remove(meal);

      this.logger.log(`Deleted meal: ${meal.name} (ID: ${id})`);
      return { message: 'Meal deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete meal ${id}: ${error.message}`);
      throw new BadRequestException('Failed to delete meal');
    }
  }

  /**
   * Get meals by type
   */
  async findByType(mealType: MealType): Promise<MealResponseDto[]> {
    try {
      const meals = await this.mealRepository.find({
        where: { mealType },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${meals.length} meals of type: ${mealType}`);
      return meals.map(meal => new MealResponseDto(meal));
    } catch (error) {
      this.logger.error(`Failed to retrieve meals by type ${mealType}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve meals by type');
    }
  }

  /**
   * Get meal statistics
   */
  async getStatistics(): Promise<{
    totalMeals: number;
    mealsByType: Record<MealType, number>;
    averageCalories: number;
    averageProtein: number;
  }> {
    try {
      const totalMeals = await this.mealRepository.count();
      
      const mealsByType = {} as Record<MealType, number>;
      for (const type of Object.values(MealType)) {
        mealsByType[type] = await this.mealRepository.count({ where: { mealType: type } });
      }

      const avgStats = await this.mealRepository
        .createQueryBuilder('meal')
        .select('AVG(meal.calories)', 'avgCalories')
        .addSelect('AVG(meal.protein)', 'avgProtein')
        .getRawOne();

      return {
        totalMeals,
        mealsByType,
        averageCalories: parseFloat(avgStats.avgCalories) || 0,
        averageProtein: parseFloat(avgStats.avgProtein) || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get meal statistics: ${error.message}`);
      throw new BadRequestException('Failed to get meal statistics');
    }
  }
}
