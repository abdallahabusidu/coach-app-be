import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  WorkoutPlanEntity,
  WorkoutPlanType,
  PlanStatus,
} from '../entities/workout-plan.entity';
import { WorkoutAssignmentEntity } from '../entities/workout-assignment.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import {
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
  AssignWorkoutPlanDto,
  WorkoutPlanResponseDto,
  WorkoutPlanListResponseDto,
} from '../dtos/workout-plan.dto';

@Injectable()
export class WorkoutPlanService {
  private readonly logger = new Logger(WorkoutPlanService.name);

  constructor(
    @InjectRepository(WorkoutPlanEntity)
    private readonly workoutPlanRepository: Repository<WorkoutPlanEntity>,

    @InjectRepository(WorkoutAssignmentEntity)
    private readonly workoutAssignmentRepository: Repository<WorkoutAssignmentEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new workout plan
   */
  async createWorkoutPlan(
    coachId: string,
    createDto: CreateWorkoutPlanDto,
  ): Promise<WorkoutPlanResponseDto> {
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
      endDate.setDate(startDate.getDate() + createDto.durationWeeks * 7);
    }

    const workoutPlan = this.workoutPlanRepository.create({
      name: createDto.name,
      description: createDto.description,
      planType: createDto.planType,
      durationWeeks: createDto.durationWeeks,
      workoutsPerWeek: createDto.workoutsPerWeek,
      coachId,
      traineeId: createDto.traineeId,
      schedule: createDto.schedule,
      goals: createDto.goals,
      prerequisites: createDto.prerequisites || [],
      equipment: createDto.equipment || [],
      difficultyProgression: createDto.difficultyProgression,
      isTemplate: createDto.isTemplate || false,
      status: trainee ? PlanStatus.ACTIVE : PlanStatus.DRAFT,
      startDate,
      endDate,
    });

    const savedPlan = await this.workoutPlanRepository.save(workoutPlan);

    // If assigned to trainee, create assignment record
    if (trainee && startDate) {
      await this.createAssignment(savedPlan.id, trainee.id, coachId, startDate);
    }

    return this.transformToResponseDto(savedPlan, coach, trainee);
  }

  /**
   * Get workout plans with filtering and pagination
   */
  async getWorkoutPlans(
    coachId: string,
    filters: {
      planType?: WorkoutPlanType;
      status?: PlanStatus;
      isTemplate?: boolean;
      traineeId?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<WorkoutPlanListResponseDto> {
    const queryBuilder = this.createWorkoutPlanQueryBuilder(coachId);

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
    const workoutPlans = await queryBuilder.getMany();

    // Transform to response DTOs
    const plans = await Promise.all(
      workoutPlans.map((plan) => this.transformToResponseDto(plan)),
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
   * Get a single workout plan by ID
   */
  async getWorkoutPlanById(
    planId: string,
    coachId: string,
  ): Promise<WorkoutPlanResponseDto> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, coachId },
      relations: ['coach', 'trainee'],
    });

    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }

    return this.transformToResponseDto(plan);
  }

  /**
   * Update a workout plan
   */
  async updateWorkoutPlan(
    planId: string,
    coachId: string,
    updateDto: UpdateWorkoutPlanDto,
  ): Promise<WorkoutPlanResponseDto> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, coachId },
      relations: ['coach', 'trainee'],
    });

    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }

    // Update fields
    Object.assign(plan, updateDto);

    const updatedPlan = await this.workoutPlanRepository.save(plan);
    return this.transformToResponseDto(updatedPlan);
  }

  /**
   * Delete a workout plan
   */
  async deleteWorkoutPlan(planId: string, coachId: string): Promise<void> {
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: planId, coachId },
    });

    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }

    // Check if plan is currently assigned
    const activeAssignments = await this.workoutAssignmentRepository.count({
      where: { workoutPlanId: planId, isActive: true },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete a workout plan that is currently assigned to trainees',
      );
    }

    await this.workoutPlanRepository.remove(plan);
  }

  /**
   * Assign a workout plan to a trainee
   */
  async assignWorkoutPlan(
    coachId: string,
    assignDto: AssignWorkoutPlanDto,
  ): Promise<WorkoutPlanResponseDto> {
    // Verify plan exists and belongs to coach
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: assignDto.workoutPlanId, coachId },
      relations: ['coach'],
    });

    if (!plan) {
      throw new NotFoundException('Workout plan not found');
    }

    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: assignDto.traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Check if trainee already has an active assignment for this plan
    const existingAssignment = await this.workoutAssignmentRepository.findOne({
      where: {
        workoutPlanId: assignDto.workoutPlanId,
        traineeId: assignDto.traineeId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Trainee already has an active assignment for this workout plan',
      );
    }

    const startDate = new Date(assignDto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.durationWeeks * 7);

    // Create assignment
    await this.createAssignment(
      assignDto.workoutPlanId,
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
      await this.workoutPlanRepository.save(plan);
    }

    // Increment usage count
    plan.usageCount += 1;
    await this.workoutPlanRepository.save(plan);

    return this.transformToResponseDto(plan, plan.coach, trainee);
  }

  /**
   * Get workout plans assigned to a specific trainee
   */
  async getTraineeWorkoutPlans(
    traineeId: string,
    coachId?: string,
  ): Promise<WorkoutPlanListResponseDto> {
    const queryBuilder = this.workoutPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.coach', 'coach')
      .leftJoinAndSelect('plan.trainee', 'trainee')
      .innerJoin(
        'workout_assignments',
        'assignment',
        'assignment.workoutPlanId = plan.id',
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
   * Create assignment record
   */
  private async createAssignment(
    workoutPlanId: string,
    traineeId: string,
    coachId: string,
    startDate: Date,
    instructions?: string,
    priority: number = 1,
    customizations?: any,
  ): Promise<WorkoutAssignmentEntity> {
    const endDate = new Date(startDate);
    const plan = await this.workoutPlanRepository.findOne({
      where: { id: workoutPlanId },
    });

    if (plan) {
      endDate.setDate(startDate.getDate() + plan.durationWeeks * 7);
    }

    const assignment = this.workoutAssignmentRepository.create({
      workoutPlanId,
      traineeId,
      coachId,
      startDate,
      endDate,
      instructions,
      priority,
      customizations,
    });

    return this.workoutAssignmentRepository.save(assignment);
  }

  /**
   * Create base query builder for workout plans
   */
  private createWorkoutPlanQueryBuilder(
    coachId: string,
  ): SelectQueryBuilder<WorkoutPlanEntity> {
    return this.workoutPlanRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.coach', 'coach')
      .leftJoinAndSelect('plan.trainee', 'trainee')
      .where('plan.coachId = :coachId', { coachId });
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<WorkoutPlanEntity>,
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
    queryBuilder: SelectQueryBuilder<WorkoutPlanEntity>,
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
    plan: WorkoutPlanEntity,
    coach?: UserEntity,
    trainee?: UserEntity,
  ): WorkoutPlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      planType: plan.planType,
      durationWeeks: plan.durationWeeks,
      workoutsPerWeek: plan.workoutsPerWeek,
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
      goals: plan.goals,
      prerequisites: plan.prerequisites,
      equipment: plan.equipment,
      difficultyProgression: plan.difficultyProgression,
      isTemplate: plan.isTemplate,
      usageCount: plan.usageCount,
      averageRating: parseFloat(plan.averageRating.toString()),
      createdAt: plan.createdAt,
      startDate: plan.startDate,
      endDate: plan.endDate,
    };
  }
}
