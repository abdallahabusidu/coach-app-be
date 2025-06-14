import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import {
  TemplateEntity,
  TemplateType,
  TemplateStatus,
  DifficultyLevel,
} from '../entities/template.entity';
import {
  TemplateAssignmentEntity,
  AssignmentStatus,
} from '../entities/template-assignment.entity';
import { TemplateRecommendationEntity } from '../entities/template-recommendation.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { WorkoutEntity } from '../../workout/entities/workout.entity';
import { MealEntity } from '../../meal/entities/meal.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateResponseDto,
  TemplateListResponseDto,
} from '../dtos/template.dto';
import {
  AssignTemplateDto,
  UpdateTemplateAssignmentDto,
  UpdateAssignmentProgressDto,
  TemplateAssignmentResponseDto,
  TemplateAssignmentListResponseDto,
  TemplateRecommendationResponseDto,
  TemplateRecommendationListResponseDto,
} from '../dtos/template-assignment.dto';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,

    @InjectRepository(TemplateAssignmentEntity)
    private readonly assignmentRepository: Repository<TemplateAssignmentEntity>,

    @InjectRepository(TemplateRecommendationEntity)
    private readonly recommendationRepository: Repository<TemplateRecommendationEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,

    @InjectRepository(MealEntity)
    private readonly mealRepository: Repository<MealEntity>,
  ) {}

  /**
   * Create a new template
   */
  async createTemplate(
    coachId: string,
    createDto: CreateTemplateDto,
  ): Promise<TemplateResponseDto> {
    // Verify coach exists
    const coach = await this.userRepository.findOne({
      where: { id: coachId, role: UserRole.COACH },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Validate workouts and meals exist
    await this.validateScheduleItems(createDto.schedule);

    // Calculate estimated weekly cost
    const estimatedWeeklyCost = await this.calculateEstimatedCost(
      createDto.schedule,
    );

    const template = this.templateRepository.create({
      name: createDto.name,
      description: createDto.description,
      templateType: createDto.templateType,
      coachId,
      durationWeeks: createDto.durationWeeks,
      difficulty: createDto.difficulty,
      schedule: createDto.schedule,
      targetCriteria: createDto.targetCriteria,
      nutritionTargets: createDto.nutritionTargets,
      fitnessTargets: createDto.fitnessTargets,
      equipmentRequired: createDto.equipmentRequired,
      prerequisites: createDto.prerequisites,
      tags: createDto.tags,
      isPublic: createDto.isPublic || false,
      estimatedWeeklyCost,
    });

    const savedTemplate = await this.templateRepository.save(template);
    return this.transformToResponseDto(savedTemplate, coach);
  }

  /**
   * Get templates with filtering and pagination
   */
  async getTemplates(
    coachId: string,
    filters: {
      templateType?: TemplateType;
      status?: TemplateStatus;
      difficulty?: DifficultyLevel;
      isPublic?: boolean;
      tags?: string[];
      minRating?: number;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<TemplateListResponseDto> {
    const queryBuilder = this.createTemplateQueryBuilder(
      coachId,
      filters.isPublic,
    );

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
    const templates = await queryBuilder.getMany();

    // Transform to response DTOs
    const templateDtos = await Promise.all(
      templates.map((template) => this.transformToResponseDto(template)),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      templates: templateDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get a single template by ID
   */
  async getTemplateById(
    templateId: string,
    coachId: string,
  ): Promise<TemplateResponseDto> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, coachId },
      relations: ['coach'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.transformToResponseDto(template);
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    coachId: string,
    updateDto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, coachId },
      relations: ['coach'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if template is currently assigned
    if (updateDto.status === TemplateStatus.ARCHIVED) {
      const activeAssignments = await this.assignmentRepository.count({
        where: {
          templateId,
          status: AssignmentStatus.ACTIVE,
        },
      });

      if (activeAssignments > 0) {
        throw new BadRequestException(
          'Cannot archive a template that has active assignments',
        );
      }
    }

    // Validate schedule if updated
    if (updateDto.schedule) {
      await this.validateScheduleItems(updateDto.schedule);
      updateDto['estimatedWeeklyCost'] = await this.calculateEstimatedCost(
        updateDto.schedule,
      );
    }

    // Update fields
    Object.assign(template, updateDto);

    const updatedTemplate = await this.templateRepository.save(template);
    return this.transformToResponseDto(updatedTemplate);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string, coachId: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId, coachId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Check if template has any assignments
    const assignmentCount = await this.assignmentRepository.count({
      where: { templateId },
    });

    if (assignmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete a template that has been assigned to trainees',
      );
    }

    await this.templateRepository.remove(template);
  }

  /**
   * Assign a template to a trainee
   */
  async assignTemplate(
    coachId: string,
    assignDto: AssignTemplateDto,
  ): Promise<TemplateAssignmentResponseDto> {
    // Verify template exists and belongs to coach
    const template = await this.templateRepository.findOne({
      where: { id: assignDto.templateId, coachId },
      relations: ['coach'],
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: assignDto.traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Check if trainee already has an active assignment for this template
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        templateId: assignDto.templateId,
        traineeId: assignDto.traineeId,
        status: AssignmentStatus.ACTIVE,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(
        'Trainee already has an active assignment for this template',
      );
    }

    const startDate = new Date(assignDto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + template.durationWeeks * 7);

    const assignment = this.assignmentRepository.create({
      templateId: assignDto.templateId,
      traineeId: assignDto.traineeId,
      coachId,
      startDate,
      endDate,
      instructions: assignDto.instructions,
      priority: assignDto.priority || 1,
      customizations: assignDto.customizations,
      status: AssignmentStatus.SCHEDULED,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Increment template usage count
    template.usageCount += 1;
    await this.templateRepository.save(template);

    return this.transformAssignmentToResponseDto(
      savedAssignment,
      template,
      trainee,
      template.coach,
    );
  }

  /**
   * Get template assignments
   */
  async getTemplateAssignments(
    coachId: string,
    filters: {
      templateId?: string;
      traineeId?: string;
      status?: AssignmentStatus;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<TemplateAssignmentListResponseDto> {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.template', 'template')
      .leftJoinAndSelect('assignment.trainee', 'trainee')
      .leftJoinAndSelect('assignment.coach', 'coach')
      .where('assignment.coachId = :coachId', { coachId });

    // Apply filters
    if (filters.templateId) {
      queryBuilder.andWhere('assignment.templateId = :templateId', {
        templateId: filters.templateId,
      });
    }

    if (filters.traineeId) {
      queryBuilder.andWhere('assignment.traineeId = :traineeId', {
        traineeId: filters.traineeId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('assignment.status = :status', {
        status: filters.status,
      });
    }

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Apply sorting
    queryBuilder.orderBy('assignment.createdAt', 'DESC');

    // Execute query
    const assignments = await queryBuilder.getMany();

    // Transform to response DTOs
    const assignmentDtos = assignments.map((assignment) =>
      this.transformAssignmentToResponseDto(assignment),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      assignments: assignmentDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Update assignment progress
   */
  async updateAssignmentProgress(
    coachId: string,
    progressDto: UpdateAssignmentProgressDto,
  ): Promise<TemplateAssignmentResponseDto> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: progressDto.assignmentId, coachId },
      relations: ['template', 'trainee', 'coach'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Update progress
    const currentProgress = assignment.progress || {
      currentWeek: 1,
      currentDay: 1,
      completedWorkouts: 0,
      missedWorkouts: 0,
      completedMeals: 0,
      missedMeals: 0,
      adherencePercentage: 0,
      weeklyProgress: [],
      lastUpdated: new Date(),
    };

    // Update progress fields
    Object.assign(currentProgress, {
      currentWeek: progressDto.currentWeek,
      currentDay: progressDto.currentDay,
      completedWorkouts:
        progressDto.completedWorkouts ?? currentProgress.completedWorkouts,
      missedWorkouts:
        progressDto.missedWorkouts ?? currentProgress.missedWorkouts,
      completedMeals:
        progressDto.completedMeals ?? currentProgress.completedMeals,
      missedMeals: progressDto.missedMeals ?? currentProgress.missedMeals,
      adherencePercentage:
        progressDto.adherencePercentage ?? currentProgress.adherencePercentage,
      overallRating: progressDto.overallRating ?? currentProgress.overallRating,
      feedback: progressDto.feedback ?? currentProgress.feedback,
      lastUpdated: new Date(),
    });

    // Add weekly progress entry if provided
    if (
      progressDto.weightChange !== undefined ||
      progressDto.energyLevel !== undefined ||
      progressDto.satisfaction !== undefined ||
      progressDto.notes
    ) {
      const weeklyEntry = {
        week: progressDto.currentWeek,
        workoutAdherence: this.calculateWeeklyWorkoutAdherence(
          currentProgress,
          progressDto.currentWeek,
        ),
        nutritionAdherence: this.calculateWeeklyNutritionAdherence(
          currentProgress,
          progressDto.currentWeek,
        ),
        weightChange: progressDto.weightChange,
        energyLevel: progressDto.energyLevel,
        satisfaction: progressDto.satisfaction,
        notes: progressDto.notes,
      };

      // Replace existing weekly entry or add new one
      const existingIndex = currentProgress.weeklyProgress.findIndex(
        (w) => w.week === progressDto.currentWeek,
      );
      if (existingIndex >= 0) {
        currentProgress.weeklyProgress[existingIndex] = weeklyEntry;
      } else {
        currentProgress.weeklyProgress.push(weeklyEntry);
      }
    }

    assignment.progress = currentProgress;

    // Auto-complete assignment if all weeks are done
    if (
      progressDto.currentWeek >= assignment.template.durationWeeks &&
      assignment.status === AssignmentStatus.ACTIVE
    ) {
      assignment.status = AssignmentStatus.COMPLETED;
      assignment.completedAt = new Date();
    }

    const updatedAssignment = await this.assignmentRepository.save(assignment);
    return this.transformAssignmentToResponseDto(updatedAssignment);
  }

  /**
   * Get template recommendations for a trainee
   */
  async getTemplateRecommendations(
    coachId: string,
    traineeId: string,
    limit: number = 10,
  ): Promise<TemplateRecommendationListResponseDto> {
    // Get trainee details
    const trainee = await this.userRepository.findOne({
      where: { id: traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Generate recommendations
    await this.generateRecommendationsForTrainee(coachId, traineeId);

    // Get existing recommendations
    const recommendations = await this.recommendationRepository.find({
      where: { coachId, traineeId, dismissed: false },
      relations: ['template', 'template.coach', 'trainee'],
      order: { score: 'DESC' },
      take: limit,
    });

    const recommendationDtos = recommendations.map((rec) =>
      this.transformRecommendationToResponseDto(rec),
    );

    return {
      recommendations: recommendationDtos,
      total: recommendations.length,
      page: 1,
      limit,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }

  /**
   * Validate that all workouts and meals in schedule exist
   */
  private async validateScheduleItems(schedule: any): Promise<void> {
    const workoutIds = new Set<string>();
    const mealIds = new Set<string>();

    // Extract all workout and meal IDs from schedule
    Object.values(schedule).forEach((week: any) => {
      Object.values(week).forEach((day: any) => {
        if (day.workouts) {
          day.workouts.forEach((workout: any) =>
            workoutIds.add(workout.workoutId),
          );
        }
        if (day.meals) {
          day.meals.forEach((meal: any) => mealIds.add(meal.mealId));
        }
      });
    });

    // Validate workouts exist
    if (workoutIds.size > 0) {
      const existingWorkouts = await this.workoutRepository.find({
        where: { id: In(Array.from(workoutIds)) },
        select: ['id'],
      });

      const existingWorkoutIds = new Set(existingWorkouts.map((w) => w.id));
      const missingWorkouts = Array.from(workoutIds).filter(
        (id) => !existingWorkoutIds.has(id),
      );

      if (missingWorkouts.length > 0) {
        throw new BadRequestException(
          `Workouts not found: ${missingWorkouts.join(', ')}`,
        );
      }
    }

    // Validate meals exist
    if (mealIds.size > 0) {
      const existingMeals = await this.mealRepository.find({
        where: { id: In(Array.from(mealIds)) },
        select: ['id'],
      });

      const existingMealIds = new Set(existingMeals.map((m) => m.id));
      const missingMeals = Array.from(mealIds).filter(
        (id) => !existingMealIds.has(id),
      );

      if (missingMeals.length > 0) {
        throw new BadRequestException(
          `Meals not found: ${missingMeals.join(', ')}`,
        );
      }
    }
  }

  /**
   * Calculate estimated weekly cost for a template
   */
  private async calculateEstimatedCost(schedule: any): Promise<number> {
    // This is a simplified calculation
    // In a real app, you'd calculate based on meal ingredients and their costs
    let totalMeals = 0;

    Object.values(schedule).forEach((week: any) => {
      Object.values(week).forEach((day: any) => {
        if (day.meals) {
          totalMeals += day.meals.length;
        }
      });
    });

    const weekCount = Object.keys(schedule).length;
    // Estimate $15 per meal on average
    return Math.round((totalMeals * 15) / weekCount);
  }

  /**
   * Generate template recommendations for a trainee
   */
  private async generateRecommendationsForTrainee(
    coachId: string,
    traineeId: string,
  ): Promise<void> {
    // Get trainee profile data (this would come from a trainee profile entity)
    // For now, we'll use mock data
    const traineeProfile = {
      age: 25,
      gender: 'male',
      fitnessLevel: 'intermediate',
      goals: ['muscle_gain', 'strength_building'],
      weight: 75,
      height: 180,
      equipment: ['dumbbells', 'barbell', 'bench'],
      dietaryRestrictions: [],
      timeAvailability: {
        minutesPerDay: 90,
        daysPerWeek: 5,
      },
    };

    // Get all coach's templates
    const templates = await this.templateRepository.find({
      where: { coachId, status: TemplateStatus.ACTIVE },
    });

    // Clear existing recommendations
    await this.recommendationRepository.delete({ coachId, traineeId });

    // Score each template
    for (const template of templates) {
      const score = this.calculateTemplateScore(template, traineeProfile);

      if (score.overallScore > 60) {
        // Only recommend templates with >60% match
        const recommendation = this.recommendationRepository.create({
          templateId: template.id,
          traineeId,
          coachId,
          score: score.overallScore,
          confidence: score.confidence,
          reason: score.reason,
          matchingDetails: score.details,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        await this.recommendationRepository.save(recommendation);
      }
    }
  }

  /**
   * Calculate how well a template matches a trainee profile
   */
  private calculateTemplateScore(
    template: TemplateEntity,
    traineeProfile: any,
  ) {
    let totalScore = 0;
    let maxScore = 0;
    const details: any = { criteriaMatches: {} };

    // Age matching (weight: 15%)
    const ageMatch = this.scoreAgeMatch(
      template.targetCriteria.ageRange,
      traineeProfile.age,
    );
    details.criteriaMatches.age = ageMatch;
    totalScore += ageMatch.score * 0.15;
    maxScore += 100 * 0.15;

    // Goals matching (weight: 30%)
    const goalsMatch = this.scoreGoalsMatch(
      template.targetCriteria.goals,
      traineeProfile.goals,
    );
    details.criteriaMatches.goals = goalsMatch;
    totalScore += goalsMatch.score * 0.3;
    maxScore += 100 * 0.3;

    // Fitness level matching (weight: 20%)
    const fitnessMatch = this.scoreFitnessMatch(
      template.targetCriteria.fitnessLevel,
      traineeProfile.fitnessLevel,
    );
    details.criteriaMatches.fitnessLevel = fitnessMatch;
    totalScore += fitnessMatch.score * 0.2;
    maxScore += 100 * 0.2;

    // Equipment matching (weight: 25%)
    const equipmentMatch = this.scoreEquipmentMatch(
      template.equipmentRequired,
      traineeProfile.equipment,
    );
    details.criteriaMatches.equipmentAvailability = equipmentMatch;
    totalScore += equipmentMatch.score * 0.25;
    maxScore += 100 * 0.25;

    // Time availability (weight: 10%)
    const timeMatch = this.scoreTimeMatch(
      template.targetCriteria.timeAvailability,
      traineeProfile.timeAvailability,
    );
    details.criteriaMatches.timeAvailability = timeMatch;
    totalScore += timeMatch.score * 0.1;
    maxScore += 100 * 0.1;

    const overallScore = Math.round((totalScore / maxScore) * 100);
    const confidence = Math.min(95, overallScore + template.usageCount * 2); // Higher usage = higher confidence

    details.overallMatchScore = overallScore;
    details.successProbability = Math.min(
      90,
      template.successRate + overallScore * 0.5,
    );
    details.recommendationReason = this.generateRecommendationReason(
      details.criteriaMatches,
      overallScore,
    );

    return {
      overallScore,
      confidence,
      reason: details.recommendationReason,
      details,
    };
  }

  private scoreAgeMatch(
    templateRange: { min: number; max: number },
    traineeAge: number,
  ) {
    const matched =
      traineeAge >= templateRange.min && traineeAge <= templateRange.max;
    const score = matched
      ? 100
      : Math.max(
          0,
          100 -
            Math.abs(traineeAge - (templateRange.min + templateRange.max) / 2) *
              5,
        );

    return {
      matched,
      score: Math.round(score),
      traineeValue: traineeAge,
      templateRange,
    };
  }

  private scoreGoalsMatch(
    templateGoals: TemplateType[],
    traineeGoals: string[],
  ) {
    const overlap = templateGoals.filter((goal) => traineeGoals.includes(goal));
    const matched = overlap.length > 0;
    const score = matched ? (overlap.length / traineeGoals.length) * 100 : 0;

    return {
      matched,
      score: Math.round(score),
      traineeGoals,
      templateGoals,
      overlap,
    };
  }

  private scoreFitnessMatch(
    templateLevels: DifficultyLevel[],
    traineeFitnessLevel: string,
  ) {
    const matched = templateLevels.includes(
      traineeFitnessLevel as DifficultyLevel,
    );
    let score = 0;

    if (matched) {
      score = 100;
    } else {
      // Calculate proximity score
      const levelMap = { beginner: 1, intermediate: 2, advanced: 3 };
      const traineeLevel =
        levelMap[traineeFitnessLevel as keyof typeof levelMap] || 2;
      const templateLevelValues = templateLevels.map((l) => levelMap[l]);
      const closestLevel = templateLevelValues.reduce((prev, curr) =>
        Math.abs(curr - traineeLevel) < Math.abs(prev - traineeLevel)
          ? curr
          : prev,
      );
      score = Math.max(0, 100 - Math.abs(traineeLevel - closestLevel) * 30);
    }

    return {
      matched,
      score: Math.round(score),
      traineeValue: traineeFitnessLevel,
      templateValues: templateLevels,
    };
  }

  private scoreEquipmentMatch(
    requiredEquipment: string[],
    traineeEquipment: string[],
  ) {
    const missingEquipment = requiredEquipment.filter(
      (eq) => !traineeEquipment.includes(eq),
    );
    const matched = missingEquipment.length === 0;
    const score =
      requiredEquipment.length > 0
        ? ((requiredEquipment.length - missingEquipment.length) /
            requiredEquipment.length) *
          100
        : 100;

    return {
      matched,
      score: Math.round(score),
      traineeEquipment,
      requiredEquipment,
      missingEquipment,
    };
  }

  private scoreTimeMatch(templateTime: any, traineeTime: any) {
    if (!templateTime || !traineeTime) {
      return {
        matched: true,
        score: 100,
        traineeAvailability: traineeTime,
        templateRequirement: templateTime,
      };
    }

    const timeMatched =
      traineeTime.minutesPerDay >= templateTime.minMinutesPerDay &&
      traineeTime.minutesPerDay <= templateTime.maxMinutesPerDay &&
      traineeTime.daysPerWeek >= templateTime.daysPerWeek;

    const score = timeMatched ? 100 : 50; // Partial credit if close

    return {
      matched: timeMatched,
      score,
      traineeAvailability: traineeTime,
      templateRequirement: templateTime,
    };
  }

  private generateRecommendationReason(
    criteriaMatches: any,
    overallScore: number,
  ): string {
    const reasons = [];

    if (criteriaMatches.goals?.matched) {
      reasons.push(
        `Aligns with your ${criteriaMatches.goals.overlap.join(', ')} goals`,
      );
    }

    if (criteriaMatches.fitnessLevel?.matched) {
      reasons.push(
        `Matches your ${criteriaMatches.fitnessLevel.traineeValue} fitness level`,
      );
    }

    if (criteriaMatches.equipmentAvailability?.matched) {
      reasons.push('You have all required equipment');
    }

    if (criteriaMatches.age?.matched) {
      reasons.push('Age-appropriate program');
    }

    if (overallScore >= 90) {
      return `Excellent match! ${reasons.join(', ')}.`;
    } else if (overallScore >= 75) {
      return `Great fit! ${reasons.join(', ')}.`;
    } else {
      return `Good option. ${reasons.join(', ')}.`;
    }
  }

  private calculateWeeklyWorkoutAdherence(progress: any, week: number): number {
    // This would calculate based on completed vs planned workouts for the week
    return Math.round((progress.completedWorkouts / (week * 5)) * 100); // Assuming 5 workouts per week
  }

  private calculateWeeklyNutritionAdherence(
    progress: any,
    week: number,
  ): number {
    // This would calculate based on completed vs planned meals for the week
    return Math.round((progress.completedMeals / (week * 21)) * 100); // Assuming 3 meals per day
  }

  /**
   * Create base query builder for templates
   */
  private createTemplateQueryBuilder(
    coachId: string,
    includePublic?: boolean,
  ): SelectQueryBuilder<TemplateEntity> {
    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.coach', 'coach');

    if (includePublic) {
      queryBuilder.where(
        '(template.coachId = :coachId OR template.isPublic = true)',
        { coachId },
      );
    } else {
      queryBuilder.where('template.coachId = :coachId', { coachId });
    }

    return queryBuilder;
  }

  /**
   * Apply filters to template query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<TemplateEntity>,
    filters: any,
  ): void {
    if (filters.templateType) {
      queryBuilder.andWhere('template.templateType = :templateType', {
        templateType: filters.templateType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('template.status = :status', {
        status: filters.status,
      });
    }

    if (filters.difficulty) {
      queryBuilder.andWhere('template.difficulty = :difficulty', {
        difficulty: filters.difficulty,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('template.tags && :tags', {
        tags: filters.tags,
      });
    }

    if (filters.minRating) {
      queryBuilder.andWhere('template.averageRating >= :minRating', {
        minRating: filters.minRating,
      });
    }
  }

  /**
   * Apply sorting to template query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<TemplateEntity>,
    filters: any,
  ): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'name':
        queryBuilder.orderBy('template.name', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('template.createdAt', sortOrder);
        break;
      case 'usageCount':
        queryBuilder.orderBy('template.usageCount', sortOrder);
        break;
      case 'averageRating':
        queryBuilder.orderBy('template.averageRating', sortOrder);
        break;
      case 'successRate':
        queryBuilder.orderBy('template.successRate', sortOrder);
        break;
      default:
        queryBuilder.orderBy('template.createdAt', sortOrder);
    }
  }

  /**
   * Transform template entity to response DTO
   */
  private transformToResponseDto(
    template: TemplateEntity,
    coach?: UserEntity,
  ): TemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      templateType: template.templateType,
      coach:
        coach || template.coach
          ? {
              id: (coach || template.coach).id,
              name: `${(coach || template.coach).firstName} ${(coach || template.coach).lastName}`,
            }
          : { id: template.coachId, name: 'Unknown Coach' },
      status: template.status,
      durationWeeks: template.durationWeeks,
      difficulty: template.difficulty,
      schedule: template.schedule,
      targetCriteria: template.targetCriteria,
      nutritionTargets: template.nutritionTargets,
      fitnessTargets: template.fitnessTargets,
      equipmentRequired: template.equipmentRequired,
      prerequisites: template.prerequisites,
      tags: template.tags,
      isPublic: template.isPublic,
      usageCount: template.usageCount,
      averageRating: parseFloat(template.averageRating.toString()),
      successRate: parseFloat(template.successRate.toString()),
      estimatedWeeklyCost: template.estimatedWeeklyCost
        ? parseFloat(template.estimatedWeeklyCost.toString())
        : undefined,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      publishedAt: template.publishedAt,
    };
  }

  /**
   * Transform assignment entity to response DTO
   */
  private transformAssignmentToResponseDto(
    assignment: TemplateAssignmentEntity,
    template?: TemplateEntity,
    trainee?: UserEntity,
    coach?: UserEntity,
  ): TemplateAssignmentResponseDto {
    return {
      id: assignment.id,
      template:
        template || assignment.template
          ? {
              id: (template || assignment.template).id,
              name: (template || assignment.template).name,
              templateType: (template || assignment.template).templateType,
              durationWeeks: (template || assignment.template).durationWeeks,
              difficulty: (template || assignment.template).difficulty,
            }
          : {
              id: assignment.templateId,
              name: 'Unknown Template',
              templateType: 'unknown',
              durationWeeks: 0,
              difficulty: 'beginner',
            },
      trainee:
        trainee || assignment.trainee
          ? {
              id: (trainee || assignment.trainee).id,
              name: `${(trainee || assignment.trainee).firstName} ${(trainee || assignment.trainee).lastName}`,
            }
          : { id: assignment.traineeId, name: 'Unknown Trainee' },
      coach:
        coach || assignment.coach
          ? {
              id: (coach || assignment.coach).id,
              name: `${(coach || assignment.coach).firstName} ${(coach || assignment.coach).lastName}`,
            }
          : { id: assignment.coachId, name: 'Unknown Coach' },
      status: assignment.status,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
      customizations: assignment.customizations,
      instructions: assignment.instructions,
      priority: assignment.priority,
      progress: assignment.progress,
      autoAdjustments: assignment.autoAdjustments,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      actualStartDate: assignment.actualStartDate,
      completedAt: assignment.completedAt,
    };
  }

  /**
   * Transform recommendation entity to response DTO
   */
  private transformRecommendationToResponseDto(
    recommendation: TemplateRecommendationEntity,
  ): TemplateRecommendationResponseDto {
    return {
      id: recommendation.id,
      template: {
        id: recommendation.template.id,
        name: recommendation.template.name,
        templateType: recommendation.template.templateType,
        durationWeeks: recommendation.template.durationWeeks,
        difficulty: recommendation.template.difficulty,
        averageRating: parseFloat(
          recommendation.template.averageRating.toString(),
        ),
        usageCount: recommendation.template.usageCount,
      },
      trainee: {
        id: recommendation.trainee.id,
        name: `${recommendation.trainee.firstName} ${recommendation.trainee.lastName}`,
      },
      coach: {
        id: recommendation.coach.id,
        name: `${recommendation.coach.firstName} ${recommendation.coach.lastName}`,
      },
      score: parseFloat(recommendation.score.toString()),
      confidence: parseFloat(recommendation.confidence.toString()),
      reason: recommendation.reason,
      matchingDetails: recommendation.matchingDetails,
      viewed: recommendation.viewed,
      accepted: recommendation.accepted,
      dismissed: recommendation.dismissed,
      coachFeedback: recommendation.coachFeedback,
      isAutoGenerated: recommendation.isAutoGenerated,
      expiresAt: recommendation.expiresAt,
      createdAt: recommendation.createdAt,
      viewedAt: recommendation.viewedAt,
      acceptedAt: recommendation.acceptedAt,
      dismissedAt: recommendation.dismissedAt,
    };
  }
}
