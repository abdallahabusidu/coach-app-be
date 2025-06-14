import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  MealPlanEntity,
  MealPlanType,
  PlanStatus,
} from '../entities/meal-plan.entity';
import { MealAssignmentEntity } from '../entities/meal-assignment.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import {
  CreateMealPlanDto,
  UpdateMealPlanDto,
  AssignMealPlanDto,
  MealPlanResponseDto,
  MealPlanListResponseDto,
} from '../dtos/meal-plan.dto';

@Injectable()
export class MealPlanService {
  private readonly logger = new Logger(MealPlanService.name);

  constructor(
    @InjectRepository(MealPlanEntity)
    private readonly mealPlanRepository: Repository<MealPlanEntity>,

    @InjectRepository(MealAssignmentEntity)
    private readonly mealAssignmentRepository: Repository<MealAssignmentEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new meal plan
   */
  async createMealPlan(
    coachId: string,
    createDto: CreateMealPlanDto,
  ): Promise<MealPlanResponseDto> {
    // Verify coach exists
    const coach = await this.userRepository.findOne({
      where: { id: coachId, role: UserRole.COACH },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // If traineeId is provided, verify trainee exists
    let trainee: UserEntity | undefined;
    if (createDto.traineeId) {
      trainee = await this.userRepository.findOne({
        where: { id: createDto.traineeId, role: UserRole.TRAINEE },
      });

      if (!trainee) {
        throw new NotFoundException('Trainee not found');
      }
    }

    // Calculate end date if trainee is assigned
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    if (trainee) {
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(startDate.getDate() + createDto.durationDays);
    }

    // Generate shopping list based on meals in schedule
    const shoppingList = await this.generateShoppingList(createDto.schedule);

    const mealPlan = this.mealPlanRepository.create({
      name: createDto.name,
      description: createDto.description,
      planType: createDto.planType,
      durationDays: createDto.durationDays,
      coachId,
      traineeId: createDto.traineeId,
      schedule: createDto.schedule,
      nutritionTargets: createDto.nutritionTargets,
      dietaryRestrictions: createDto.dietaryRestrictions,
      preferences: createDto.preferences,
      isTemplate: createDto.isTemplate || false,
      status: trainee ? PlanStatus.ACTIVE : PlanStatus.DRAFT,
      startDate,
      endDate,
      shoppingList,
    });

    const savedPlan = await this.mealPlanRepository.save(mealPlan);

    // If assigned to trainee, create assignment record
    if (trainee && startDate) {
      await this.createAssignment(savedPlan.id, trainee.id, coachId, startDate);
    }

    return this.transformToResponseDto(savedPlan, coach, trainee);
  }

  /**
   * Get meal plans with filtering and pagination
   */
  async getMealPlans(
    coachId: string,
    filters: {
      planType?: MealPlanType;
      status?: PlanStatus;
      isTemplate?: boolean;
      traineeId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<MealPlanListResponseDto> {
    const queryBuilder = this.createMealPlanQueryBuilder(coachId);

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
    const mealPlans = await queryBuilder.getMany();

    // Transform to response DTOs
    const plans = await Promise.all(
      mealPlans.map((plan) => this.transformToResponseDto(plan)),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      plans,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get a single meal plan by ID
   */
  async getMealPlanById(
    planId: string,
    coachId: string,
  ): Promise<MealPlanResponseDto> {
    const plan = await this.mealPlanRepository.findOne({
      where: { id: planId, coachId },
      relations: ['coach', 'trainee'],
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    return this.transformToResponseDto(plan);
  }

  /**
   * Update a meal plan
   */
  async updateMealPlan(
    planId: string,
    coachId: string,
    updateDto: UpdateMealPlanDto,
  ): Promise<MealPlanResponseDto> {
    const plan = await this.mealPlanRepository.findOne({
      where: { id: planId, coachId },
      relations: ['coach', 'trainee'],
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Update fields
    Object.assign(plan, updateDto);

    // Regenerate shopping list if schedule changed
    if (updateDto.schedule) {
      plan.shoppingList = await this.generateShoppingList(updateDto.schedule);
    }

    const updatedPlan = await this.mealPlanRepository.save(plan);
    return this.transformToResponseDto(updatedPlan);
  }

  /**
   * Delete a meal plan
   */
  async deleteMealPlan(planId: string, coachId: string): Promise<void> {
    const plan = await this.mealPlanRepository.findOne({
      where: { id: planId, coachId },
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Check if plan is currently assigned
    const activeAssignments = await this.mealAssignmentRepository.count({
      where: { mealPlanId: planId, isActive: true },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete a meal plan that is currently assigned to trainees',
      );
    }

    await this.mealPlanRepository.remove(plan);
  }

  /**
   * Assign a meal plan to a trainee
   */
  async assignMealPlan(
    coachId: string,
    assignDto: AssignMealPlanDto,
  ): Promise<MealPlanResponseDto> {
    // Verify plan exists and belongs to coach
    const plan = await this.mealPlanRepository.findOne({
      where: { id: assignDto.mealPlanId, coachId },
      relations: ['coach'],
    });

    if (!plan) {
      throw new NotFoundException('Meal plan not found');
    }

    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: assignDto.traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Check if trainee already has an active assignment for this plan
    const existingAssignment = await this.mealAssignmentRepository.findOne({
      where: {
        mealPlanId: assignDto.mealPlanId,
        traineeId: assignDto.traineeId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Trainee already has an active assignment for this meal plan',
      );
    }

    const startDate = new Date(assignDto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // Create assignment
    await this.createAssignment(
      assignDto.mealPlanId,
      assignDto.traineeId,
      coachId,
      startDate,
      assignDto.instructions,
      assignDto.priority,
      assignDto.customizations,
    );

    // Update plan with trainee info if not already set
    if (!plan.traineeId) {
      plan.traineeId = assignDto.traineeId;
      plan.status = PlanStatus.ACTIVE;
      plan.startDate = startDate;
      plan.endDate = endDate;
      await this.mealPlanRepository.save(plan);
    }

    // Increment usage count
    plan.usageCount += 1;
    await this.mealPlanRepository.save(plan);

    return this.transformToResponseDto(plan, plan.coach, trainee);
  }

  /**
   * Get meal plans assigned to a specific trainee
   */
  async getTraineeMealPlans(
    traineeId: string,
    coachId?: string,
  ): Promise<MealPlanListResponseDto> {
    const queryBuilder = this.mealPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.coach', 'coach')
      .leftJoinAndSelect('plan.trainee', 'trainee')
      .innerJoin(
        'meal_assignments',
        'assignment',
        'assignment.mealPlanId = plan.id',
      )
      .where('assignment.traineeId = :traineeId', { traineeId })
      .andWhere('assignment.isActive = :isActive', { isActive: true });

    if (coachId) {
      queryBuilder.andWhere('plan.coachId = :coachId', { coachId });
    }

    const plans = await queryBuilder.getMany();

    const transformedPlans = await Promise.all(
      plans.map((plan) => this.transformToResponseDto(plan)),
    );

    return {
      plans: transformedPlans,
      total: plans.length,
      page: 1,
      limit: plans.length,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }

  /**
   * Generate shopping list from meal schedule
   */
  private async generateShoppingList(schedule: any): Promise<any[]> {
    // This is a simplified implementation
    // In a real app, you'd query meals and aggregate ingredients

    const categories = [
      {
        category: 'Proteins',
        items: [
          {
            name: 'Chicken Breast',
            quantity: '2',
            unit: 'lbs',
            estimated_cost: 15.99,
          },
          {
            name: 'Salmon Fillet',
            quantity: '1',
            unit: 'lb',
            estimated_cost: 12.99,
          },
        ],
      },
      {
        category: 'Vegetables',
        items: [
          {
            name: 'Mixed Greens',
            quantity: '2',
            unit: 'bags',
            estimated_cost: 6.99,
          },
          {
            name: 'Broccoli',
            quantity: '3',
            unit: 'heads',
            estimated_cost: 4.5,
          },
        ],
      },
      {
        category: 'Grains',
        items: [
          {
            name: 'Brown Rice',
            quantity: '2',
            unit: 'lbs',
            estimated_cost: 3.99,
          },
          { name: 'Quinoa', quantity: '1', unit: 'bag', estimated_cost: 5.99 },
        ],
      },
    ];

    return categories;
  }

  /**
   * Create assignment record
   */
  private async createAssignment(
    mealPlanId: string,
    traineeId: string,
    coachId: string,
    startDate: Date,
    instructions?: string,
    priority: number = 1,
    customizations?: any,
  ): Promise<MealAssignmentEntity> {
    const endDate = new Date(startDate);
    const plan = await this.mealPlanRepository.findOne({
      where: { id: mealPlanId },
    });

    if (plan) {
      endDate.setDate(startDate.getDate() + plan.durationDays);
    }

    const assignment = this.mealAssignmentRepository.create({
      mealPlanId,
      traineeId,
      coachId,
      startDate,
      endDate,
      instructions,
      priority,
      customizations,
    });

    return this.mealAssignmentRepository.save(assignment);
  }

  /**
   * Create base query builder for meal plans
   */
  private createMealPlanQueryBuilder(
    coachId: string,
  ): SelectQueryBuilder<MealPlanEntity> {
    return this.mealPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.coach', 'coach')
      .leftJoinAndSelect('plan.trainee', 'trainee')
      .where('plan.coachId = :coachId', { coachId });
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<MealPlanEntity>,
    filters: any,
  ): void {
    if (filters.planType) {
      queryBuilder.andWhere('plan.planType = :planType', {
        planType: filters.planType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('plan.status = :status', {
        status: filters.status,
      });
    }

    if (filters.isTemplate !== undefined) {
      queryBuilder.andWhere('plan.isTemplate = :isTemplate', {
        isTemplate: filters.isTemplate,
      });
    }

    if (filters.traineeId) {
      queryBuilder.andWhere('plan.traineeId = :traineeId', {
        traineeId: filters.traineeId,
      });
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<MealPlanEntity>,
    filters: any,
  ): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('plan.name', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('plan.createdAt', sortOrder);
        break;
      case 'usageCount':
        queryBuilder.orderBy('plan.usageCount', sortOrder);
        break;
      case 'averageRating':
        queryBuilder.orderBy('plan.averageRating', sortOrder);
        break;
      default:
        queryBuilder.orderBy('plan.createdAt', sortOrder);
    }
  }

  /**
   * Transform entity to response DTO
   */
  private transformToResponseDto(
    plan: MealPlanEntity,
    coach?: UserEntity,
    trainee?: UserEntity,
  ): MealPlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      planType: plan.planType,
      durationDays: plan.durationDays,
      coach:
        coach || plan.coach
          ? {
              id: (coach || plan.coach).id,
              name: `${(coach || plan.coach).firstName} ${(coach || plan.coach).lastName}`,
            }
          : { id: plan.coachId, name: 'Unknown Coach' },
      trainee:
        trainee || plan.trainee
          ? {
              id: (trainee || plan.trainee).id,
              name: `${(trainee || plan.trainee).firstName} ${(trainee || plan.trainee).lastName}`,
            }
          : undefined,
      status: plan.status,
      schedule: plan.schedule,
      nutritionTargets: plan.nutritionTargets,
      dietaryRestrictions: plan.dietaryRestrictions,
      preferences: plan.preferences,
      shoppingList: plan.shoppingList,
      isTemplate: plan.isTemplate,
      usageCount: plan.usageCount,
      averageRating: parseFloat(plan.averageRating.toString()),
      createdAt: plan.createdAt,
      startDate: plan.startDate,
      endDate: plan.endDate,
      estimatedWeeklyCost: plan.estimatedWeeklyCost
        ? parseFloat(plan.estimatedWeeklyCost.toString())
        : undefined,
    };
  }
}
