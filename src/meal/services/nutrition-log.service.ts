import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { NutritionLogEntity } from '../entities/nutrition-log.entity';
import { MealEntity } from '../entities/meal.entity';
import { MealPlanEntity, PlanStatus } from '../entities/meal-plan.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import {
  LogMealDto,
  UpdateNutritionLogDto,
  NutritionLogResponseDto,
  NutritionLogListResponseDto,
  DailyNutritionSummaryDto,
  WeeklyNutritionReportDto,
} from '../dtos/nutrition-log.dto';

@Injectable()
export class NutritionLogService {
  private readonly logger = new Logger(NutritionLogService.name);

  constructor(
    @InjectRepository(NutritionLogEntity)
    private readonly nutritionLogRepository: Repository<NutritionLogEntity>,

    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,

    @InjectRepository(MealPlanEntity)
    private readonly mealPlanRepository: Repository<MealPlanEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Log a meal consumption
   */
  async logMeal(
    traineeId: string,
    logDto: LogMealDto,
  ): Promise<NutritionLogResponseDto> {
    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Verify meal exists
    const meal = await this.mealRepository.findOne({
      where: { id: logDto.mealId },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    // Verify meal plan exists if provided
    let mealPlan: MealPlanEntity | undefined;
    if (logDto.mealPlanId) {
      mealPlan = await this.mealPlanRepository.findOne({
        where: { id: logDto.mealPlanId },
      });

      if (!mealPlan) {
        throw new NotFoundException('Meal plan not found');
      }
    }

    // Calculate actual nutrition values based on portion size
    const actualCalories = parseFloat(
      (meal.calories * logDto.portionSize).toFixed(2),
    );
    const actualProtein = parseFloat(
      (meal.protein * logDto.portionSize).toFixed(2),
    );
    const actualCarbs = parseFloat(
      (meal.carbs * logDto.portionSize).toFixed(2),
    );
    const actualFat = parseFloat((meal.fat * logDto.portionSize).toFixed(2));

    // Check for duplicate entry
    const existingLog = await this.nutritionLogRepository.findOne({
      where: {
        traineeId,
        mealId: logDto.mealId,
        logDate: new Date(logDto.logDate),
        mealTime: logDto.mealTime,
        mealCategory: logDto.mealCategory,
      },
    });

    if (existingLog) {
      throw new BadRequestException(
        'A meal log already exists for this meal, date, time, and category combination',
      );
    }

    const nutritionLog = this.nutritionLogRepository.create({
      traineeId,
      mealId: logDto.mealId,
      mealPlanId: logDto.mealPlanId,
      logDate: new Date(logDto.logDate),
      mealTime: logDto.mealTime,
      mealCategory: logDto.mealCategory,
      portionSize: logDto.portionSize,
      actualCalories,
      actualProtein,
      actualCarbs,
      actualFat,
      additionalNutrition: logDto.additionalNutrition,
      notes: logDto.notes,
      rating: logDto.rating,
      photoUrl: logDto.photoUrl,
      wasPlanned: logDto.wasPlanned ?? true,
      location: logDto.location,
      moodAfterEating: logDto.moodAfterEating,
      hungerLevelBefore: logDto.hungerLevelBefore,
      satietyLevelAfter: logDto.satietyLevelAfter,
    });

    const savedLog = await this.nutritionLogRepository.save(nutritionLog);
    return this.transformToResponseDto(savedLog, trainee, meal, mealPlan);
  }

  /**
   * Get nutrition logs with filtering and pagination
   */
  async getNutritionLogs(
    traineeId: string,
    filters: {
      dateFrom?: string;
      dateTo?: string;
      mealPlanId?: string;
      mealCategory?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<NutritionLogListResponseDto> {
    const queryBuilder = this.createNutritionLogQueryBuilder(traineeId);

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, filters);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const logs = await queryBuilder.getMany();

    // Transform to response DTOs
    const logDtos = logs.map((log) => this.transformToResponseDto(log));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      logs: logDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get a single nutrition log by ID
   */
  async getNutritionLogById(
    logId: string,
    traineeId: string,
  ): Promise<NutritionLogResponseDto> {
    const log = await this.nutritionLogRepository.findOne({
      where: { id: logId, traineeId },
      relations: ['trainee', 'meal', 'mealPlan'],
    });

    if (!log) {
      throw new NotFoundException('Nutrition log not found');
    }

    return this.transformToResponseDto(log);
  }

  /**
   * Update a nutrition log
   */
  async updateNutritionLog(
    logId: string,
    traineeId: string,
    updateDto: UpdateNutritionLogDto,
  ): Promise<NutritionLogResponseDto> {
    const log = await this.nutritionLogRepository.findOne({
      where: { id: logId, traineeId },
      relations: ['trainee', 'meal', 'mealPlan'],
    });

    if (!log) {
      throw new NotFoundException('Nutrition log not found');
    }

    // Update fields
    Object.assign(log, updateDto);

    // Recalculate nutrition values if portion size changed
    if (updateDto.portionSize !== undefined) {
      log.actualCalories = parseFloat(
        (log.meal.calories * updateDto.portionSize).toFixed(2),
      );
      log.actualProtein = parseFloat(
        (log.meal.protein * updateDto.portionSize).toFixed(2),
      );
      log.actualCarbs = parseFloat(
        (log.meal.carbs * updateDto.portionSize).toFixed(2),
      );
      log.actualFat = parseFloat(
        (log.meal.fat * updateDto.portionSize).toFixed(2),
      );
    }

    const updatedLog = await this.nutritionLogRepository.save(log);
    return this.transformToResponseDto(updatedLog);
  }

  /**
   * Delete a nutrition log
   */
  async deleteNutritionLog(logId: string, traineeId: string): Promise<void> {
    const log = await this.nutritionLogRepository.findOne({
      where: { id: logId, traineeId },
    });

    if (!log) {
      throw new NotFoundException('Nutrition log not found');
    }

    await this.nutritionLogRepository.remove(log);
  }

  /**
   * Get daily nutrition summary
   */
  async getDailyNutritionSummary(
    traineeId: string,
    date: string,
  ): Promise<DailyNutritionSummaryDto> {
    const targetDate = new Date(date);

    // Get all logs for the day
    const logs = await this.nutritionLogRepository.find({
      where: {
        traineeId,
        logDate: targetDate,
      },
      relations: ['meal'],
    });

    // Calculate totals
    const totalCalories = logs.reduce(
      (sum, log) => sum + log.actualCalories,
      0,
    );
    const totalProtein = logs.reduce((sum, log) => sum + log.actualProtein, 0);
    const totalCarbs = logs.reduce((sum, log) => sum + log.actualCarbs, 0);
    const totalFat = logs.reduce((sum, log) => sum + log.actualFat, 0);
    const mealsLogged = logs.length;

    // Get targets from active meal plan
    let targets = { calories: 2000, protein: 100, carbs: 250, fat: 70 }; // defaults

    const activeMealPlan = await this.mealPlanRepository.findOne({
      where: { traineeId, status: PlanStatus.ACTIVE },
    });

    if (activeMealPlan) {
      targets = {
        calories: activeMealPlan.nutritionTargets.dailyCalories,
        protein: activeMealPlan.nutritionTargets.protein,
        carbs: activeMealPlan.nutritionTargets.carbs,
        fat: activeMealPlan.nutritionTargets.fat,
      };
    }

    // Calculate adherence percentages
    const calorieAdherence = (totalCalories / targets.calories) * 100;
    const proteinAdherence = (totalProtein / targets.protein) * 100;
    const carbsAdherence = (totalCarbs / targets.carbs) * 100;
    const fatAdherence = (totalFat / targets.fat) * 100;

    // Calculate average meal rating
    const ratedLogs = logs.filter((log) => log.rating);
    const averageMealRating =
      ratedLogs.length > 0
        ? ratedLogs.reduce((sum, log) => sum + (log.rating || 0), 0) /
          ratedLogs.length
        : undefined;

    return {
      date: targetDate,
      totalCalories: Math.round(totalCalories * 100) / 100,
      totalProtein: Math.round(totalProtein * 100) / 100,
      totalCarbs: Math.round(totalCarbs * 100) / 100,
      totalFat: Math.round(totalFat * 100) / 100,
      mealsLogged,
      targetCalories: targets.calories,
      targetProtein: targets.protein,
      targetCarbs: targets.carbs,
      targetFat: targets.fat,
      calorieAdherence: Math.round(calorieAdherence * 100) / 100,
      proteinAdherence: Math.round(proteinAdherence * 100) / 100,
      carbsAdherence: Math.round(carbsAdherence * 100) / 100,
      fatAdherence: Math.round(fatAdherence * 100) / 100,
      averageMealRating: averageMealRating
        ? Math.round(averageMealRating * 100) / 100
        : undefined,
    };
  }

  /**
   * Get weekly nutrition report
   */
  async getWeeklyNutritionReport(
    traineeId: string,
    weekStart: string,
  ): Promise<WeeklyNutritionReportDto> {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    // Get daily summaries for the week
    const dailySummaries: DailyNutritionSummaryDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const summary = await this.getDailyNutritionSummary(traineeId, dateStr);
      dailySummaries.push(summary);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly averages
    const weeklyAverages = {
      calories:
        dailySummaries.reduce((sum, day) => sum + day.totalCalories, 0) / 7,
      protein:
        dailySummaries.reduce((sum, day) => sum + day.totalProtein, 0) / 7,
      carbs: dailySummaries.reduce((sum, day) => sum + day.totalCarbs, 0) / 7,
      fat: dailySummaries.reduce((sum, day) => sum + day.totalFat, 0) / 7,
      adherence:
        dailySummaries.reduce((sum, day) => sum + day.calorieAdherence, 0) / 7,
      mealRating:
        dailySummaries.filter((day) => day.averageMealRating).length > 0
          ? dailySummaries
              .filter((day) => day.averageMealRating)
              .reduce((sum, day) => sum + (day.averageMealRating || 0), 0) /
            dailySummaries.filter((day) => day.averageMealRating).length
          : 0,
    };

    // Calculate weekly totals
    const totalMealsLogged = dailySummaries.reduce(
      (sum, day) => sum + day.mealsLogged,
      0,
    );
    const plannedMeals = await this.nutritionLogRepository.count({
      where: {
        traineeId,
        logDate: Between(startDate, endDate),
        wasPlanned: true,
      },
    });

    const adherencePercentage =
      totalMealsLogged > 0 ? (plannedMeals / totalMealsLogged) * 100 : 0;

    // Get top meals for the week
    const topMealsQuery = await this.nutritionLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.meal', 'meal')
      .select([
        'log.mealId as mealId',
        'meal.name as mealName',
        'COUNT(log.id) as frequency',
        'AVG(log.rating) as averageRating',
      ])
      .where('log.traineeId = :traineeId', { traineeId })
      .andWhere('log.logDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('log.mealId, meal.name')
      .orderBy('frequency', 'DESC')
      .limit(5)
      .getRawMany();

    const topMeals = topMealsQuery.map((item) => ({
      mealId: item.mealId,
      mealName: item.mealName,
      frequency: parseInt(item.frequency),
      averageRating: item.averageRating ? parseFloat(item.averageRating) : 0,
    }));

    return {
      weekStart: startDate,
      weekEnd: endDate,
      dailySummaries,
      weeklyAverages: {
        calories: Math.round(weeklyAverages.calories * 100) / 100,
        protein: Math.round(weeklyAverages.protein * 100) / 100,
        carbs: Math.round(weeklyAverages.carbs * 100) / 100,
        fat: Math.round(weeklyAverages.fat * 100) / 100,
        adherence: Math.round(weeklyAverages.adherence * 100) / 100,
        mealRating: Math.round(weeklyAverages.mealRating * 100) / 100,
      },
      weeklyTotals: {
        mealsLogged: totalMealsLogged,
        plannedMeals,
        adherencePercentage: Math.round(adherencePercentage * 100) / 100,
      },
      topMeals,
    };
  }

  /**
   * Create base query builder for nutrition logs
   */
  private createNutritionLogQueryBuilder(
    traineeId: string,
  ): SelectQueryBuilder<NutritionLogEntity> {
    return this.nutritionLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.trainee', 'trainee')
      .leftJoinAndSelect('log.meal', 'meal')
      .leftJoinAndSelect('log.mealPlan', 'mealPlan')
      .where('log.traineeId = :traineeId', { traineeId });
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<NutritionLogEntity>,
    filters: any,
  ): void {
    if (filters.dateFrom || filters.dateTo) {
      const fromDate = filters.dateFrom
        ? new Date(filters.dateFrom)
        : new Date('1900-01-01');
      const toDate = filters.dateTo
        ? new Date(filters.dateTo)
        : new Date('2100-12-31');

      queryBuilder.andWhere('log.logDate BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    if (filters.mealPlanId) {
      queryBuilder.andWhere('log.mealPlanId = :mealPlanId', {
        mealPlanId: filters.mealPlanId,
      });
    }

    if (filters.mealCategory) {
      queryBuilder.andWhere('log.mealCategory = :mealCategory', {
        mealCategory: filters.mealCategory,
      });
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<NutritionLogEntity>,
    filters: any,
  ): void {
    const sortBy = filters.sortBy || 'logDate';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'logDate':
        queryBuilder.orderBy('log.logDate', sortOrder);
        queryBuilder.addOrderBy('log.mealTime', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('log.createdAt', sortOrder);
        break;
      case 'rating':
        queryBuilder.orderBy('log.rating', sortOrder);
        break;
      case 'calories':
        queryBuilder.orderBy('log.actualCalories', sortOrder);
        break;
      default:
        queryBuilder.orderBy('log.logDate', sortOrder);
        queryBuilder.addOrderBy('log.mealTime', sortOrder);
    }
  }

  /**
   * Transform entity to response DTO
   */
  private transformToResponseDto(
    log: NutritionLogEntity,
    trainee?: UserEntity,
    meal?: MealEntity,
    mealPlan?: MealPlanEntity,
  ): NutritionLogResponseDto {
    return {
      id: log.id,
      trainee:
        trainee || log.trainee
          ? {
              id: (trainee || log.trainee).id,
              name: `${(trainee || log.trainee).firstName} ${(trainee || log.trainee).lastName}`,
            }
          : { id: log.traineeId, name: 'Unknown Trainee' },
      meal:
        meal || log.meal
          ? {
              id: (meal || log.meal).id,
              name: (meal || log.meal).name,
              mealType: (meal || log.meal).mealType,
              calories: parseFloat((meal || log.meal).calories.toString()),
              protein: parseFloat((meal || log.meal).protein.toString()),
              carbs: parseFloat((meal || log.meal).carbs.toString()),
              fat: parseFloat((meal || log.meal).fat.toString()),
            }
          : {
              id: log.mealId,
              name: 'Unknown Meal',
              mealType: 'unknown',
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            },
      mealPlan:
        mealPlan || log.mealPlan
          ? {
              id: (mealPlan || log.mealPlan).id,
              name: (mealPlan || log.mealPlan).name,
              planType: (mealPlan || log.mealPlan).planType,
            }
          : undefined,
      logDate: log.logDate,
      mealTime: log.mealTime,
      mealCategory: log.mealCategory,
      portionSize: parseFloat(log.portionSize.toString()),
      actualCalories: parseFloat(log.actualCalories.toString()),
      actualProtein: parseFloat(log.actualProtein.toString()),
      actualCarbs: parseFloat(log.actualCarbs.toString()),
      actualFat: parseFloat(log.actualFat.toString()),
      additionalNutrition: log.additionalNutrition,
      notes: log.notes,
      rating: log.rating,
      photoUrl: log.photoUrl,
      wasPlanned: log.wasPlanned,
      location: log.location,
      moodAfterEating: log.moodAfterEating,
      hungerLevelBefore: log.hungerLevelBefore,
      satietyLevelAfter: log.satietyLevelAfter,
      createdAt: log.createdAt,
    };
  }
}
