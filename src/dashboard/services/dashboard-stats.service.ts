import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TraineeProgressEntity,
  SubscriptionStatus,
} from '../entities/trainee-progress.entity';
import { MessageEntity, MessageStatus } from '../entities/message.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';

export interface DashboardStats {
  subscribedTrainees: number;
  unreadMessages: number;
  newTraineeRequests: number;
  totalActiveTrainees: number;
  totalRevenue: number;
  weeklyStats: {
    newSubscriptions: number;
    completedWorkouts: number;
    messagesExchanged: number;
  };
  monthlyGrowth: {
    subscribersGrowth: number;
    revenueGrowth: number;
  };
}

@Injectable()
export class DashboardStatsService {
  private readonly logger = new Logger(DashboardStatsService.name);

  constructor(
    @InjectRepository(TraineeProgressEntity)
    private readonly traineeProgressRepository: Repository<TraineeProgressEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Get comprehensive dashboard statistics for a coach
   */
  async getDashboardStats(coachId: string): Promise<DashboardStats> {
    try {
      const [
        subscribedTrainees,
        unreadMessages,
        newTraineeRequests,
        totalActiveTrainees,
        weeklyStats,
        monthlyGrowth,
      ] = await Promise.all([
        this.getSubscribedTraineesCount(coachId),
        this.getUnreadMessagesCount(coachId),
        this.getNewTraineeRequestsCount(coachId),
        this.getTotalActiveTraineesCount(coachId),
        this.getWeeklyStats(coachId),
        this.getMonthlyGrowth(coachId),
      ]);

      // Calculate total revenue (simplified calculation)
      const totalRevenue = await this.calculateTotalRevenue(coachId);

      const stats: DashboardStats = {
        subscribedTrainees,
        unreadMessages,
        newTraineeRequests,
        totalActiveTrainees,
        totalRevenue,
        weeklyStats,
        monthlyGrowth,
      };

      this.logger.log(`Generated dashboard stats for coach ${coachId}`);
      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to generate dashboard stats for coach ${coachId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get count of subscribed trainees
   */
  private async getSubscribedTraineesCount(coachId: string): Promise<number> {
    return await this.traineeProgressRepository.count({
      where: {
        coachId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Get count of unread messages
   */
  private async getUnreadMessagesCount(coachId: string): Promise<number> {
    return await this.messageRepository.count({
      where: {
        receiverId: coachId,
        status: MessageStatus.SENT,
        isArchived: false,
      },
    });
  }

  /**
   * Get count of new trainee requests (pending subscriptions)
   */
  private async getNewTraineeRequestsCount(coachId: string): Promise<number> {
    return await this.traineeProgressRepository.count({
      where: {
        coachId,
        subscriptionStatus: SubscriptionStatus.PENDING,
      },
    });
  }

  /**
   * Get total active trainees count
   */
  private async getTotalActiveTraineesCount(coachId: string): Promise<number> {
    return await this.traineeProgressRepository.count({
      where: {
        coachId,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Calculate total revenue (simplified)
   */
  private async calculateTotalRevenue(coachId: string): Promise<number> {
    // This is a simplified calculation
    // In a real app, you'd have a more complex billing/payment system
    const activeSubscriptions = await this.getSubscribedTraineesCount(coachId);

    // Assume average monthly rate of $100 per trainee
    const averageMonthlyRate = 100;
    return activeSubscriptions * averageMonthlyRate;
  }

  /**
   * Get weekly statistics
   */
  private async getWeeklyStats(coachId: string): Promise<{
    newSubscriptions: number;
    completedWorkouts: number;
    messagesExchanged: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [newSubscriptions, messagesExchanged] = await Promise.all([
      this.traineeProgressRepository.count({
        where: {
          coachId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: oneWeekAgo,
        },
      }),
      this.messageRepository.count({
        where: [
          { senderId: coachId, createdAt: oneWeekAgo },
          { receiverId: coachId, createdAt: oneWeekAgo },
        ],
      }),
    ]);

    // Get completed workouts from progress data
    const trainees = await this.traineeProgressRepository.find({
      where: { coachId, subscriptionStatus: SubscriptionStatus.ACTIVE },
    });

    let completedWorkouts = 0;
    trainees.forEach((trainee) => {
      if (trainee.progressData?.weeklyGoals?.achieved) {
        completedWorkouts += trainee.progressData.weeklyGoals.achieved;
      }
    });

    return {
      newSubscriptions,
      completedWorkouts,
      messagesExchanged,
    };
  }

  /**
   * Get monthly growth statistics
   */
  private async getMonthlyGrowth(coachId: string): Promise<{
    subscribersGrowth: number;
    revenueGrowth: number;
  }> {
    const currentMonth = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthStart = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    );
    const lastMonthEnd = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      0,
    );

    const [currentMonthSubscribers, lastMonthSubscribers] = await Promise.all([
      this.traineeProgressRepository.count({
        where: {
          coachId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: currentMonthStart,
        },
      }),
      this.traineeProgressRepository.count({
        where: {
          coachId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          subscriptionStartDate: lastMonthStart,
        },
      }),
    ]);

    const subscribersGrowth =
      lastMonthSubscribers === 0
        ? currentMonthSubscribers > 0
          ? 100
          : 0
        : ((currentMonthSubscribers - lastMonthSubscribers) /
            lastMonthSubscribers) *
          100;

    // Simplified revenue growth calculation
    const revenueGrowth = subscribersGrowth; // Assuming linear relationship

    return {
      subscribersGrowth: Math.round(subscribersGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    };
  }

  /**
   * Get trainee list with progress
   */
  async getTraineesWithProgress(
    coachId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<{
    trainees: TraineeProgressEntity[];
    total: number;
  }> {
    const [trainees, total] = await this.traineeProgressRepository.findAndCount(
      {
        where: {
          coachId,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
        },
        relations: ['trainee'],
        order: { lastActivityDate: 'DESC' },
        take: limit,
        skip: offset,
      },
    );

    return { trainees, total };
  }

  /**
   * Get recent activity for a specific trainee
   */
  async getTraineeRecentActivity(
    traineeId: string,
    limit: number = 10,
  ): Promise<{
    workoutsCompleted: number;
    lastActivity: Date;
    weeklyGoalProgress: number;
    achievements: any[];
  }> {
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId },
      relations: ['trainee'],
    });

    if (!progress) {
      return {
        workoutsCompleted: 0,
        lastActivity: new Date(),
        weeklyGoalProgress: 0,
        achievements: [],
      };
    }

    const weeklyGoalProgress = progress.progressData?.weeklyGoals
      ? (progress.progressData.weeklyGoals.achieved /
          progress.progressData.weeklyGoals.workouts) *
        100
      : 0;

    return {
      workoutsCompleted: progress.totalWorkoutsCompleted,
      lastActivity: progress.lastActivityDate || progress.updatedAt,
      weeklyGoalProgress: Math.round(weeklyGoalProgress),
      achievements: progress.progressData?.achievements || [],
    };
  }

  /**
   * Update trainee progress
   */
  async updateTraineeProgress(
    traineeId: string,
    coachId: string,
    progressUpdate: Partial<TraineeProgressEntity>,
  ): Promise<TraineeProgressEntity> {
    const progress = await this.traineeProgressRepository.findOne({
      where: { traineeId, coachId },
    });

    if (!progress) {
      // Create new progress record
      const newProgress = this.traineeProgressRepository.create({
        traineeId,
        coachId,
        ...progressUpdate,
      });
      return await this.traineeProgressRepository.save(newProgress);
    }

    // Update existing progress
    Object.assign(progress, progressUpdate);
    return await this.traineeProgressRepository.save(progress);
  }
}
