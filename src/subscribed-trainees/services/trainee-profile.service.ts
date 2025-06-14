import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../../client/entities/client-profile.entity';
import { PackageEntity } from '../../coach/entities/package.entity';
import {
  SubscriptionStatus,
  TraineeProgressEntity,
} from '../../dashboard/entities/trainee-progress.entity';
import {
  DailyProgressDto,
  GoalsAchievementDto,
  MonthlyTransformationDto,
  ProgressItemDto,
  SubscriptionPlanDto,
  TemplatePlanDto,
  TodayProgressDto,
  TraineeProfileDto,
  TransformationDto,
  UpdateTraineeProfileDto,
  WeeklyProgressSummaryDto,
  WeeklyReportDto,
} from '../dtos/trainee-profile.dto';

@Injectable()
export class TraineeProfileService {
  private readonly logger = new Logger(TraineeProfileService.name);

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
   * Get complete trainee profile from coach perspective
   */
  async getTraineeProfile(
    traineeId: string,
    coachId: string,
  ): Promise<TraineeProfileDto> {
    // Get trainee progress record to verify coach access
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
      relations: ['trainee', 'coach'],
    });

    if (!progress) {
      throw new NotFoundException(
        'Trainee not found or not subscribed to your coaching',
      );
    }

    // Get trainee profile
    const profile = await this.traineeProfileRepository.findOne({
      where: { userId: traineeId },
    });

    const user = progress.trainee;

    // Get subscription plan details
    const subscriptionPlan = await this.getSubscriptionPlan(progress);
    const templatePlan = await this.getTemplatePlan(profile);

    return {
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      profilePictureUrl: profile?.profilePictureUrl,
      age: profile?.age,
      gender: profile?.gender,
      height: profile?.height,
      weight: profile?.weight,
      targetWeight: progress.targetWeight,
      bodyShape: profile?.bodyShape,
      bodyFat: this.calculateBodyFat(profile),
      goal: profile?.fitnessGoal,
      fitnessLevel: profile?.fitnessLevel,
      mealsPerDay: profile?.mealsPerDay,
      dietPreferences: profile?.allergies, // Assuming allergies as diet preferences
      medicalConditions: profile?.healthConsiderations,
      allergies: profile?.allergies,
      exerciseFrequency: profile?.exerciseFrequency,
      sessionDuration: profile?.sessionDuration,
      gymAccess: profile?.gymAccess,
      coachingMode: profile?.coachingMode,
      budget: profile?.budget,
      preferredTime: profile?.preferredTime,
      templatePlan,
      subscriptionPlan,
      progressPercentage: Math.round(progress.workoutCompletionPercentage || 0),
      subscriptionStatus: progress.subscriptionStatus,
      subscriptionStartDate: progress.subscriptionStartDate,
      subscriptionEndDate: progress.subscriptionEndDate,
      lastActivityDate: progress.lastActivityDate,
      totalWorkoutsCompleted: progress.totalWorkoutsCompleted,
      joinDate: user.createdAt,
    };
  }

  /**
   * Get today's progress for a trainee
   */
  async getTodayProgress(
    traineeId: string,
    coachId: string,
  ): Promise<TodayProgressDto> {
    await this.verifyCoachAccess(traineeId, coachId);

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get progress data (this would typically come from workout/meal tracking modules)
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      throw new NotFoundException('Trainee progress not found');
    }

    // Extract today's progress from progressData
    const todayData = progress.progressData?.daily?.[todayStr] || {};

    const meals: ProgressItemDto = {
      completed: todayData.mealsLogged || 0,
      target: todayData.mealsTarget || 3,
      percentage: Math.round(
        ((todayData.mealsLogged || 0) / (todayData.mealsTarget || 3)) * 100,
      ),
      unit: 'meals',
      status: this.getProgressStatus(
        (todayData.mealsLogged || 0) / (todayData.mealsTarget || 3),
      ),
    };

    const gym: ProgressItemDto = {
      completed: todayData.workoutCompleted ? 1 : 0,
      target: 1,
      percentage: todayData.workoutCompleted ? 100 : 0,
      unit: 'workout',
      status: todayData.workoutCompleted ? 'completed' : 'not_started',
    };

    const cardio: ProgressItemDto = {
      completed: todayData.cardioMinutes || 0,
      target: todayData.cardioTarget || 30,
      percentage: Math.round(
        ((todayData.cardioMinutes || 0) / (todayData.cardioTarget || 30)) * 100,
      ),
      unit: 'minutes',
      status: this.getProgressStatus(
        (todayData.cardioMinutes || 0) / (todayData.cardioTarget || 30),
      ),
    };

    const hydration: ProgressItemDto = {
      completed: todayData.waterIntake || 0,
      target: todayData.waterTarget || 2.5,
      percentage: Math.round(
        ((todayData.waterIntake || 0) / (todayData.waterTarget || 2.5)) * 100,
      ),
      unit: 'liters',
      status: this.getProgressStatus(
        (todayData.waterIntake || 0) / (todayData.waterTarget || 2.5),
      ),
    };

    const overallProgress = Math.round(
      (meals.percentage +
        gym.percentage +
        cardio.percentage +
        hydration.percentage) /
        4,
    );

    return {
      date: todayStr,
      meals,
      gym,
      cardio,
      hydration,
      overallProgress,
    };
  }

  /**
   * Get trainee transformations by month
   */
  async getTraineeTransformations(
    traineeId: string,
    coachId: string,
    year: number,
    month: number,
  ): Promise<MonthlyTransformationDto> {
    await this.verifyCoachAccess(traineeId, coachId);

    // Get transformations from progress data
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      throw new NotFoundException('Trainee progress not found');
    }

    const transformations: TransformationDto[] = [];
    const measurements = progress.progressData?.measurements || [];

    // Filter measurements by month/year and transform to TransformationDto
    const monthlyMeasurements = measurements.filter((m: any) => {
      const date = new Date(m.date);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    });

    monthlyMeasurements.forEach((measurement: any, index: number) => {
      transformations.push({
        id: `${traineeId}-${measurement.date}-${index}`,
        date: new Date(measurement.date),
        weight: measurement.weight,
        measurements: {
          bodyFat: measurement.bodyFat,
          muscleMass: measurement.muscleMass,
        },
        photos: measurement.photos || [],
        notes: measurement.notes || '',
        milestone: measurement.milestone || '',
      });
    });

    // Calculate monthly summary
    const summary = {
      totalRecords: transformations.length,
      weightChange: this.calculateWeightChange(transformations),
      averageProgress: this.calculateAverageProgress(progress, year, month),
      milestonesAchieved: transformations.filter((t) => t.milestone).length,
    };

    return {
      year,
      month,
      transformations,
      summary,
    };
  }

  /**
   * Get weekly report for a trainee
   */
  async getWeeklyReport(
    traineeId: string,
    coachId: string,
    weekStart: Date,
  ): Promise<WeeklyReportDto> {
    await this.verifyCoachAccess(traineeId, coachId);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      throw new NotFoundException('Trainee progress not found');
    }

    // Generate daily breakdown for the week
    const dailyBreakdown: DailyProgressDto[] = [];
    const currentDate = new Date(weekStart);

    while (currentDate <= weekEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = progress.progressData?.daily?.[dateStr] || {};

      dailyBreakdown.push({
        date: new Date(currentDate),
        workoutCompleted: dayData.workoutCompleted || false,
        mealsLogged: dayData.mealsLogged || 0,
        cardioMinutes: dayData.cardioMinutes || 0,
        waterIntake: dayData.waterIntake || 0,
        progressPercentage: dayData.progressPercentage || 0,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate weekly summary
    const summary: WeeklyProgressSummaryDto = {
      workoutsCompleted: dailyBreakdown.filter((d) => d.workoutCompleted)
        .length,
      workoutsTarget: 3, // Default target
      mealTrackingCompliance: Math.round(
        (dailyBreakdown.reduce(
          (sum, d) => sum + (d.mealsLogged > 0 ? 1 : 0),
          0,
        ) /
          dailyBreakdown.length) *
          100,
      ),
      cardioMinutes: dailyBreakdown.reduce(
        (sum, d) => sum + d.cardioMinutes,
        0,
      ),
      averageHydration:
        Math.round(
          (dailyBreakdown.reduce((sum, d) => sum + d.waterIntake, 0) /
            dailyBreakdown.length) *
            100,
        ) / 100,
      weightChange: this.calculateWeeklyWeightChange(
        progress,
        weekStart,
        weekEnd,
      ),
      overallProgress: Math.round(
        dailyBreakdown.reduce((sum, d) => sum + d.progressPercentage, 0) /
          dailyBreakdown.length,
      ),
    };

    // Calculate goals achievement
    const goalsAchievement: GoalsAchievementDto = {
      weightGoal: progress.targetWeight
        ? {
            current: progress.currentWeight || 0,
            target: progress.targetWeight,
            progress: Math.round(
              ((progress.currentWeight || 0) / progress.targetWeight) * 100,
            ),
          }
        : undefined,
      milestonesAchieved:
        progress.progressData?.achievements?.map((a: any) => a.description) ||
        [],
      habitsFormed: this.getHabitsFormed(dailyBreakdown),
      areasForImprovement: this.getAreasForImprovement(summary),
    };

    return {
      weekStart,
      weekEnd,
      summary,
      dailyBreakdown,
      goalsAchievement,
      coachNotes: progress.notes,
    };
  }

  /**
   * Update trainee profile information
   */
  async updateTraineeProfile(
    traineeId: string,
    coachId: string,
    updateDto: UpdateTraineeProfileDto,
  ): Promise<TraineeProfileDto> {
    await this.verifyCoachAccess(traineeId, coachId);

    // Update trainee progress
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      throw new NotFoundException('Trainee progress not found');
    }

    // Update fields
    if (updateDto.targetWeight !== undefined) {
      progress.targetWeight = updateDto.targetWeight;
    }

    if (updateDto.currentWeight !== undefined) {
      progress.currentWeight = updateDto.currentWeight;
    }

    if (updateDto.coachNotes !== undefined) {
      progress.notes = updateDto.coachNotes;
    }

    // Update body fat in progress data
    if (updateDto.bodyFat !== undefined) {
      const currentDate = new Date().toISOString().split('T')[0];
      const measurements = progress.progressData?.measurements || [];

      // Add new measurement with updated body fat
      measurements.push({
        date: currentDate,
        weight: updateDto.currentWeight || progress.currentWeight || 0,
        bodyFat: updateDto.bodyFat,
      });

      progress.progressData = {
        ...progress.progressData,
        measurements,
      };
    }

    await this.traineeProgressRepository.save(progress);

    // Return updated profile
    return this.getTraineeProfile(traineeId, coachId);
  }

  /**
   * Verify coach has access to trainee
   */
  private async verifyCoachAccess(
    traineeId: string,
    coachId: string,
  ): Promise<void> {
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      throw new NotFoundException(
        'Trainee not found or not subscribed to your coaching',
      );
    }
  }

  /**
   * Get subscription plan details
   */
  private async getSubscriptionPlan(
    progress: TraineeProgressEntity,
  ): Promise<SubscriptionPlanDto | undefined> {
    // This would typically fetch from a subscription/package entity
    // For now, return a mock based on subscription status
    if (progress.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      return {
        id: 'premium-plan',
        title: 'Premium Coaching Plan',
        description:
          'Full access to personalized coaching and nutrition guidance',
        price: 99.99,
        durationMonths: 3,
      };
    }
    return undefined;
  }

  /**
   * Get template plan details
   */
  private async getTemplatePlan(
    profile: TraineeProfileEntity | null,
  ): Promise<TemplatePlanDto | undefined> {
    // This would typically fetch from a template/workout plan entity
    if (profile?.fitnessGoal) {
      return {
        id: `template-${profile.fitnessGoal}`,
        name: `${profile.fitnessGoal.replace('_', ' ').toUpperCase()} Template`,
        description: `Customized template for ${profile.fitnessGoal} goals`,
        category: profile.fitnessLevel || 'beginner',
      };
    }
    return undefined;
  }

  /**
   * Calculate body fat percentage (simplified)
   */
  private calculateBodyFat(
    profile: TraineeProfileEntity | null,
  ): number | undefined {
    // This is a simplified calculation
    // In a real app, you'd have actual body fat measurements
    if (profile?.weight && profile?.height && profile?.gender) {
      // Basic BMI-based estimation (not accurate, just for demo)
      const bmi = profile.weight / Math.pow(profile.height / 100, 2);
      const genderFactor = profile.gender === 'male' ? 1.0 : 1.2;
      return Math.round(bmi * genderFactor * 0.8 * 10) / 10;
    }
    return undefined;
  }

  /**
   * Get progress status based on percentage
   */
  private getProgressStatus(
    percentage: number,
  ): 'completed' | 'in_progress' | 'not_started' {
    if (percentage >= 1.0) return 'completed';
    if (percentage > 0) return 'in_progress';
    return 'not_started';
  }

  /**
   * Calculate weight change from transformations
   */
  private calculateWeightChange(
    transformations: TransformationDto[],
  ): number | undefined {
    if (transformations.length < 2) return undefined;

    const sortedTransformations = transformations
      .filter((t) => t.weight)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (sortedTransformations.length < 2) return undefined;

    const firstWeight = sortedTransformations[0].weight!;
    const lastWeight =
      sortedTransformations[sortedTransformations.length - 1].weight!;

    return Math.round((lastWeight - firstWeight) * 10) / 10;
  }

  /**
   * Calculate average progress for a month
   */
  private calculateAverageProgress(
    progress: TraineeProgressEntity,
    year: number,
    month: number,
  ): number {
    // This would calculate based on daily progress data for the month
    // For now, return workout completion percentage
    return Math.round(progress.workoutCompletionPercentage || 0);
  }

  /**
   * Calculate weekly weight change
   */
  private calculateWeeklyWeightChange(
    progress: TraineeProgressEntity,
    weekStart: Date,
    weekEnd: Date,
  ): number | undefined {
    const measurements = progress.progressData?.measurements || [];

    const weekMeasurements = measurements.filter((m: any) => {
      const date = new Date(m.date);
      return date >= weekStart && date <= weekEnd;
    });

    if (weekMeasurements.length < 2) return undefined;

    const sortedMeasurements = weekMeasurements.sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const firstWeight = sortedMeasurements[0].weight;
    const lastWeight = sortedMeasurements[sortedMeasurements.length - 1].weight;

    return Math.round((lastWeight - firstWeight) * 10) / 10;
  }

  /**
   * Get habits formed based on daily breakdown
   */
  private getHabitsFormed(dailyBreakdown: DailyProgressDto[]): string[] {
    const habits: string[] = [];

    const workoutConsistency = dailyBreakdown.filter(
      (d) => d.workoutCompleted,
    ).length;
    if (workoutConsistency >= 3) {
      habits.push('Regular workout routine');
    }

    const mealTrackingConsistency = dailyBreakdown.filter(
      (d) => d.mealsLogged > 0,
    ).length;
    if (mealTrackingConsistency >= 5) {
      habits.push('Consistent meal tracking');
    }

    const hydrationConsistency = dailyBreakdown.filter(
      (d) => d.waterIntake >= 2,
    ).length;
    if (hydrationConsistency >= 5) {
      habits.push('Good hydration habits');
    }

    return habits;
  }

  /**
   * Get areas for improvement based on weekly summary
   */
  private getAreasForImprovement(summary: WeeklyProgressSummaryDto): string[] {
    const areas: string[] = [];

    if (summary.workoutsCompleted < summary.workoutsTarget) {
      areas.push('Workout consistency');
    }

    if (summary.mealTrackingCompliance < 80) {
      areas.push('Meal tracking');
    }

    if (summary.cardioMinutes < 90) {
      // Less than 3 days of 30min cardio
      areas.push('Cardiovascular exercise');
    }

    if (summary.averageHydration < 2) {
      areas.push('Daily hydration');
    }

    return areas;
  }
}
