import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../../client/entities/client-profile.entity';
import {
  TraineeProgressEntity,
  SubscriptionStatus,
} from '../../dashboard/entities/trainee-progress.entity';
import { PackageEntity } from '../../coach/entities/package.entity';
import {
  TraineeFilterDto,
  TraineeResponseDto,
  TraineeListResponseDto,
} from '../dtos/subscribed-trainees.dto';

@Injectable()
export class SubscribedTraineesService {
  private readonly logger = new Logger(SubscribedTraineesService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(TraineeProfileEntity)
    private readonly traineeProfileRepository: Repository<TraineeProfileEntity>,

    @InjectRepository(TraineeProgressEntity)
    private readonly traineeProgressRepository: Repository<TraineeProgressEntity>,

    @InjectRepository(PackageEntity)
    private readonly packageRepository: Repository<PackageEntity>,
  ) {}

  /**
   * Get filtered list of subscribed trainees for a coach
   */
  async getSubscribedTrainees(
    coachId: string,
    filters: TraineeFilterDto,
  ): Promise<TraineeListResponseDto> {
    const queryBuilder = this.createTraineeQueryBuilder(coachId);

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, filters);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const offset = (filters.page - 1) * filters.limit;
    queryBuilder.skip(offset).take(filters.limit);

    // Execute query
    const traineeProgress = await queryBuilder.getMany();

    // Transform to response DTOs
    const trainees = await Promise.all(
      traineeProgress.map((progress) => this.transformToResponseDto(progress)),
    );

    const totalPages = Math.ceil(totalCount / filters.limit);

    return {
      trainees,
      total: totalCount,
      page: filters.page,
      limit: filters.limit,
      totalPages,
      hasNext: filters.page < totalPages,
      hasPrevious: filters.page > 1,
    };
  }

  /**
   * Get a single trainee's detailed information
   */
  async getTraineeById(
    traineeId: string,
    coachId: string,
  ): Promise<TraineeResponseDto> {
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
      relations: ['trainee', 'coach'],
    });

    if (!progress) {
      throw new BadRequestException(
        'Trainee not found or not subscribed to your coaching',
      );
    }

    return this.transformToResponseDto(progress);
  }

  /**
   * Get available fitness goals for filter dropdown
   */
  async getAvailableGoals(): Promise<string[]> {
    const profiles = await this.traineeProfileRepository
      .createQueryBuilder('profile')
      .select('DISTINCT profile.fitnessGoal', 'goal')
      .where('profile.fitnessGoal IS NOT NULL')
      .getRawMany();

    return profiles.map((p) => p.goal).filter(Boolean);
  }

  /**
   * Get available plans for filter dropdown
   */
  async getAvailablePlans(): Promise<Array<{ id: string; title: string }>> {
    const plans = await this.packageRepository.find({
      select: ['id', 'title'],
    });

    return plans;
  }

  /**
   * Calculate daily progress based on recent activity
   */
  private calculateDailyProgress(progress: TraineeProgressEntity): number {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // If last activity was today, consider good progress
    if (progress.lastActivityDate && progress.lastActivityDate >= startOfDay) {
      return Math.min(100, progress.workoutCompletionPercentage + 20);
    }

    // If no recent activity, return current workout completion percentage
    return progress.workoutCompletionPercentage || 0;
  }

  /**
   * Create base query builder for trainee data
   */
  private createTraineeQueryBuilder(
    coachId: string,
  ): SelectQueryBuilder<TraineeProgressEntity> {
    return this.traineeProgressRepository
      .createQueryBuilder('progress')
      .leftJoinAndSelect('progress.trainee', 'user')
      .leftJoinAndSelect('user.clientProfile', 'profile')
      .leftJoinAndSelect('progress.coach', 'coach')
      .where('progress.coachId = :coachId', { coachId })
      .andWhere('progress.subscriptionStatus IN (:...statuses)', {
        statuses: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING],
      });
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<TraineeProgressEntity>,
    filters: TraineeFilterDto,
  ): void {
    // Name filter
    if (filters.name) {
      queryBuilder.andWhere(
        "LOWER(CONCAT(user.firstName, ' ', user.lastName)) LIKE LOWER(:name)",
        { name: `%${filters.name}%` },
      );
    }

    // Progress range filter
    if (filters.progressMin !== undefined) {
      queryBuilder.andWhere(
        'progress.workoutCompletionPercentage >= :progressMin',
        {
          progressMin: filters.progressMin,
        },
      );
    }
    if (filters.progressMax !== undefined) {
      queryBuilder.andWhere(
        'progress.workoutCompletionPercentage <= :progressMax',
        {
          progressMax: filters.progressMax,
        },
      );
    }

    // Height range filter
    if (filters.heightMin !== undefined) {
      queryBuilder.andWhere('profile.height >= :heightMin', {
        heightMin: filters.heightMin,
      });
    }
    if (filters.heightMax !== undefined) {
      queryBuilder.andWhere('profile.height <= :heightMax', {
        heightMax: filters.heightMax,
      });
    }

    // Weight range filter
    if (filters.weightMin !== undefined) {
      queryBuilder.andWhere('profile.weight >= :weightMin', {
        weightMin: filters.weightMin,
      });
    }
    if (filters.weightMax !== undefined) {
      queryBuilder.andWhere('profile.weight <= :weightMax', {
        weightMax: filters.weightMax,
      });
    }

    // Goals filter (multi-select)
    if (filters.goals && filters.goals.length > 0) {
      queryBuilder.andWhere('profile.fitnessGoal IN (:...goals)', {
        goals: filters.goals,
      });
    }

    // Plans filter (multi-select) - This would require a subscription/package relationship
    // For now, we'll add a placeholder that can be extended when package subscriptions are implemented
    if (filters.plans && filters.plans.length > 0) {
      // TODO: Implement when package subscription relationship is added
      this.logger.warn(
        'Plan filtering not yet implemented - requires package subscription relationship',
      );
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<TraineeProgressEntity>,
    filters: TraineeFilterDto,
  ): void {
    switch (filters.sortBy) {
      case 'name':
        queryBuilder
          .orderBy('user.firstName', filters.sortOrder)
          .addOrderBy('user.lastName', filters.sortOrder);
        break;
      case 'progress':
        queryBuilder.orderBy(
          'progress.workoutCompletionPercentage',
          filters.sortOrder,
        );
        break;
      case 'height':
        queryBuilder.orderBy('profile.height', filters.sortOrder);
        break;
      case 'weight':
        queryBuilder.orderBy('profile.weight', filters.sortOrder);
        break;
      case 'subscriptionDate':
        queryBuilder.orderBy(
          'progress.subscriptionStartDate',
          filters.sortOrder,
        );
        break;
      default:
        queryBuilder.orderBy('user.firstName', 'ASC');
    }
  }

  /**
   * Transform TraineeProgressEntity to TraineeResponseDto
   */
  private async transformToResponseDto(
    progress: TraineeProgressEntity,
  ): Promise<TraineeResponseDto> {
    // Get trainee profile if not already loaded
    let profile: TraineeProfileEntity | null = null;
    if (progress.trainee && (progress.trainee as any).traineeProfile) {
      profile = (progress.trainee as any).traineeProfile;
    } else {
      profile = await this.traineeProfileRepository.findOne({
        where: { userId: progress.traineeId },
      });
    }

    const user = progress.trainee;
    const dailyProgress = this.calculateDailyProgress(progress);

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      height: profile?.height,
      weight: profile?.weight,
      targetWeight: progress.targetWeight,
      goal: profile?.fitnessGoal,
      planSubscribed: 'N/A', // TODO: Implement when package relationships are added
      planDescription: 'N/A', // TODO: Implement when package relationships are added
      progressOnDay: Math.round(dailyProgress),
      workoutCompletionPercentage: Math.round(
        progress.workoutCompletionPercentage || 0,
      ),
      totalWorkoutsCompleted: progress.totalWorkoutsCompleted,
      subscriptionStatus: progress.subscriptionStatus,
      subscriptionStartDate: progress.subscriptionStartDate,
      subscriptionEndDate: progress.subscriptionEndDate,
      lastActivityDate: progress.lastActivityDate,
      profilePictureUrl: profile?.profilePictureUrl,
      age: profile?.age,
      gender: profile?.gender,
      fitnessLevel: profile?.fitnessLevel,
    };
  }
}
