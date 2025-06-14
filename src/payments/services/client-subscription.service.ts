import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ClientSubscriptionEntity,
  ClientSubscriptionStatus,
  ClientSubscriptionPlan,
  BillingCycle,
  ClientPlanFeatures,
  ClientUsageTracking,
} from '../entities/client-subscription.entity';
import {
  PaymentEntity,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export interface CreateClientSubscriptionDto {
  coachId: string;
  plan: ClientSubscriptionPlan | 'custom';
  billingCycle: BillingCycle;
  clientPrice: number;
  paymentMethod: PaymentMethod;
  trialDays?: number;
  autoRenew?: boolean;
  platformCommissionRate?: number;
  customFeatures?: Partial<ClientPlanFeatures>;
  metadata?: {
    coachingGoals?: string[];
    fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
    preferredCommunication?: 'text' | 'voice' | 'video' | 'mixed';
    timeZone?: string;
    signupSource?: string;
    referralCode?: string;
    specialRequirements?: string[];
  };
}

export interface UpdateClientSubscriptionDto {
  plan?: ClientSubscriptionPlan | 'custom';
  billingCycle?: BillingCycle;
  clientPrice?: number;
  autoRenew?: boolean;
  cancellationReason?: string;
  cancelledBy?: 'client' | 'coach' | 'admin';
  customFeatures?: Partial<ClientPlanFeatures>;
}

export interface ClientSubscriptionResponseDto {
  id: string;
  clientId: string;
  coachId: string;
  plan: ClientSubscriptionPlan;
  status: ClientSubscriptionStatus;
  billingCycle: BillingCycle;
  clientPrice: number;
  coachEarnings: number;
  platformCommission: number;
  platformCommissionRate: number;
  currency: string;
  startDate: Date;
  endDate: Date | null;
  trialEndDate: Date | null;
  nextBillingDate: Date | null;
  autoRenew: boolean;
  isTrial: boolean;
  features: ClientPlanFeatures;
  currentUsage: ClientUsageTracking;
  usagePercentages: Record<string, number>;
  isNearLimits: boolean;
  isOverLimits: boolean;
  engagementLevel: 'low' | 'medium' | 'high';
  daysUntilExpiry: number;
  daysUntilNextBilling: number;
  monthlyValue: number;
  coachMonthlyEarnings: number;
  platformMonthlyCommission: number;
  createdAt: Date;
}

export interface CoachEarningsResponseDto {
  coachId: string;
  totalActiveClients: number;
  monthlyRecurringRevenue: number;
  platformCommission: number;
  netEarnings: number;
  averageClientValue: number;
  clientRetentionRate: number;
  engagementScore: number;
  topPerformingPlan: ClientSubscriptionPlan;
  recentSubscriptions: ClientSubscriptionResponseDto[];
  upcomingPayments: Array<{
    clientId: string;
    amount: number;
    dueDate: Date;
  }>;
}

export interface PlatformRevenueAnalyticsDto {
  totalActiveSubscriptions: number;
  totalMonthlyRecurringRevenue: number;
  totalPlatformCommission: number;
  averageCommissionRate: number;
  topPerformingCoaches: Array<{
    coachId: string;
    coachName: string;
    clientCount: number;
    monthlyRevenue: number;
    commissionGenerated: number;
  }>;
  planDistribution: Record<ClientSubscriptionPlan, number>;
  billingCycleDistribution: Record<BillingCycle, number>;
  churnRate: number;
  averageClientLifetime: number;
  revenueGrowth: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

@Injectable()
export class ClientSubscriptionService {
  private readonly logger = new Logger(ClientSubscriptionService.name);

  constructor(
    @InjectRepository(ClientSubscriptionEntity)
    private readonly clientSubscriptionRepository: Repository<ClientSubscriptionEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Get predefined client plan configurations
   */
  getClientPlanConfigurations(): Record<
    ClientSubscriptionPlan,
    {
      features: ClientPlanFeatures;
      defaultPricing: Record<BillingCycle, number>;
    }
  > {
    return {
      [ClientSubscriptionPlan.BASIC_COACHING]: {
        features: {
          // Communication
          monthlyMessages: 50,
          videoCallMinutes: 60, // 1 hour per month
          voiceCallMinutes: 120, // 2 hours per month
          groupSessionAccess: false,
          prioritySupport: false,

          // Workout & Training
          customWorkoutPlans: true,
          workoutPlanUpdates: 2, // 2 updates per month
          exerciseVideoLibrary: true,
          formCheckVideos: 2, // 2 form checks per month
          liveWorkoutSessions: 0,

          // Nutrition
          nutritionPlanning: false,
          mealPlanUpdates: 0,
          nutritionTracking: false,
          supplementGuidance: false,

          // Progress Tracking
          progressPhotoReviews: 2, // 2 reviews per month
          bodyCompositionTracking: true,
          performanceMetrics: true,
          goalSetting: true,

          // Additional Services
          habitCoaching: false,
          mindsetCoaching: false,
          lifestyleEducation: false,
          injuryPrevention: false,

          // Platform Features
          mobileAppAccess: true,
          webAppAccess: true,
          offlineContentAccess: false,
          dataExport: false,
        },
        defaultPricing: {
          [BillingCycle.WEEKLY]: 25,
          [BillingCycle.MONTHLY]: 89,
          [BillingCycle.QUARTERLY]: 240, // ~10% discount
          [BillingCycle.YEARLY]: 890, // ~17% discount
        },
      },
      [ClientSubscriptionPlan.PREMIUM_COACHING]: {
        features: {
          // Communication
          monthlyMessages: 150,
          videoCallMinutes: 180, // 3 hours per month
          voiceCallMinutes: 240, // 4 hours per month
          groupSessionAccess: true,
          prioritySupport: false,

          // Workout & Training
          customWorkoutPlans: true,
          workoutPlanUpdates: 4, // 4 updates per month
          exerciseVideoLibrary: true,
          formCheckVideos: 6, // 6 form checks per month
          liveWorkoutSessions: 2, // 2 live sessions per month

          // Nutrition
          nutritionPlanning: true,
          mealPlanUpdates: 2, // 2 meal plan updates per month
          nutritionTracking: true,
          supplementGuidance: true,

          // Progress Tracking
          progressPhotoReviews: 6, // 6 reviews per month
          bodyCompositionTracking: true,
          performanceMetrics: true,
          goalSetting: true,

          // Additional Services
          habitCoaching: true,
          mindsetCoaching: false,
          lifestyleEducation: true,
          injuryPrevention: true,

          // Platform Features
          mobileAppAccess: true,
          webAppAccess: true,
          offlineContentAccess: true,
          dataExport: true,
        },
        defaultPricing: {
          [BillingCycle.WEEKLY]: 45,
          [BillingCycle.MONTHLY]: 159,
          [BillingCycle.QUARTERLY]: 430, // ~10% discount
          [BillingCycle.YEARLY]: 1590, // ~17% discount
        },
      },
      [ClientSubscriptionPlan.ELITE_COACHING]: {
        features: {
          // Communication
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: 360, // 6 hours per month
          voiceCallMinutes: 480, // 8 hours per month
          groupSessionAccess: true,
          prioritySupport: true,

          // Workout & Training
          customWorkoutPlans: true,
          workoutPlanUpdates: -1, // Unlimited
          exerciseVideoLibrary: true,
          formCheckVideos: -1, // Unlimited
          liveWorkoutSessions: 4, // 4 live sessions per month

          // Nutrition
          nutritionPlanning: true,
          mealPlanUpdates: -1, // Unlimited
          nutritionTracking: true,
          supplementGuidance: true,

          // Progress Tracking
          progressPhotoReviews: -1, // Unlimited
          bodyCompositionTracking: true,
          performanceMetrics: true,
          goalSetting: true,

          // Additional Services
          habitCoaching: true,
          mindsetCoaching: true,
          lifestyleEducation: true,
          injuryPrevention: true,

          // Platform Features
          mobileAppAccess: true,
          webAppAccess: true,
          offlineContentAccess: true,
          dataExport: true,
        },
        defaultPricing: {
          [BillingCycle.WEEKLY]: 75,
          [BillingCycle.MONTHLY]: 279,
          [BillingCycle.QUARTERLY]: 750, // ~10% discount
          [BillingCycle.YEARLY]: 2790, // ~17% discount
        },
      },
      [ClientSubscriptionPlan.CUSTOM_PLAN]: {
        features: {
          // Default custom plan features - will be overridden
          monthlyMessages: 100,
          videoCallMinutes: 120,
          voiceCallMinutes: 180,
          groupSessionAccess: false,
          prioritySupport: false,
          customWorkoutPlans: true,
          workoutPlanUpdates: 2,
          exerciseVideoLibrary: true,
          formCheckVideos: 2,
          liveWorkoutSessions: 1,
          nutritionPlanning: true,
          mealPlanUpdates: 1,
          nutritionTracking: true,
          supplementGuidance: false,
          progressPhotoReviews: 4,
          bodyCompositionTracking: true,
          performanceMetrics: true,
          goalSetting: true,
          habitCoaching: false,
          mindsetCoaching: false,
          lifestyleEducation: false,
          injuryPrevention: false,
          mobileAppAccess: true,
          webAppAccess: true,
          offlineContentAccess: false,
          dataExport: false,
        },
        defaultPricing: {
          [BillingCycle.WEEKLY]: 50,
          [BillingCycle.MONTHLY]: 199,
          [BillingCycle.QUARTERLY]: 540,
          [BillingCycle.YEARLY]: 2000,
        },
      },
    };
  }

  /**
   * Create a new client subscription
   */
  async createClientSubscription(
    clientId: string,
    createSubscriptionDto: CreateClientSubscriptionDto,
  ): Promise<ClientSubscriptionResponseDto> {
    // Validate client and coach exist
    const client = await this.userRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    const coach = await this.userRepository.findOne({
      where: { id: createSubscriptionDto.coachId },
    });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Check if client already has an active subscription with this coach
    const existingSubscription =
      await this.clientSubscriptionRepository.findOne({
        where: {
          clientId,
          coachId: createSubscriptionDto.coachId,
          status: ClientSubscriptionStatus.ACTIVE,
        },
      });

    if (existingSubscription) {
      throw new BadRequestException(
        'Client already has an active subscription with this coach',
      );
    }

    // Get plan configuration or use custom
    let planFeatures: ClientPlanFeatures;
    let defaultPrice: number;

    if (createSubscriptionDto.plan === 'custom') {
      const customConfig =
        this.getClientPlanConfigurations()[ClientSubscriptionPlan.CUSTOM_PLAN];
      planFeatures = {
        ...customConfig.features,
        ...createSubscriptionDto.customFeatures,
      };
      defaultPrice =
        customConfig.defaultPricing[createSubscriptionDto.billingCycle];
    } else {
      const planConfig =
        this.getClientPlanConfigurations()[createSubscriptionDto.plan];
      planFeatures = planConfig.features;
      defaultPrice =
        planConfig.defaultPricing[createSubscriptionDto.billingCycle];
    }

    // Calculate pricing and commission
    const clientPrice = createSubscriptionDto.clientPrice || defaultPrice;
    const commissionRate =
      createSubscriptionDto.platformCommissionRate ||
      this.getDefaultCommissionRate();
    const platformCommission = clientPrice * (commissionRate / 100);
    const coachEarnings = clientPrice - platformCommission;

    // Calculate dates
    const startDate = new Date();
    const trialDays =
      createSubscriptionDto.trialDays ||
      this.getDefaultTrialDays(createSubscriptionDto.plan);
    const trialEndDate =
      trialDays > 0
        ? new Date(startDate.getTime() + trialDays * 24 * 60 * 60 * 1000)
        : null;

    const nextBillingDate =
      trialEndDate ||
      this.calculateNextBillingDate(
        startDate,
        createSubscriptionDto.billingCycle,
      );

    // Create subscription
    const subscription = new ClientSubscriptionEntity();
    subscription.client = client;
    subscription.clientId = clientId;
    subscription.coach = coach;
    subscription.coachId = createSubscriptionDto.coachId;
    subscription.plan =
      createSubscriptionDto.plan === 'custom'
        ? ClientSubscriptionPlan.CUSTOM_PLAN
        : createSubscriptionDto.plan;
    subscription.status = trialEndDate
      ? ClientSubscriptionStatus.TRIAL
      : ClientSubscriptionStatus.PENDING;
    subscription.billingCycle = createSubscriptionDto.billingCycle;
    subscription.clientPrice = clientPrice;
    subscription.coachEarnings = coachEarnings;
    subscription.platformCommission = platformCommission;
    subscription.platformCommissionRate = commissionRate;
    subscription.currency = 'USD';
    subscription.startDate = startDate;
    subscription.trialEndDate = trialEndDate;
    subscription.nextBillingDate = nextBillingDate;
    subscription.autoRenew = createSubscriptionDto.autoRenew ?? true;
    subscription.isTrial = !!trialEndDate;
    subscription.trialDays = trialDays;
    subscription.features = planFeatures;
    subscription.currentUsage = this.createInitialUsageTracking();

    // Set metadata
    if (createSubscriptionDto.metadata) {
      subscription.metadata = {
        coachingGoals: createSubscriptionDto.metadata.coachingGoals || [],
        fitnessLevel: createSubscriptionDto.metadata.fitnessLevel || 'beginner',
        preferredCommunication:
          createSubscriptionDto.metadata.preferredCommunication || 'mixed',
        timeZone: createSubscriptionDto.metadata.timeZone || 'UTC',
        signupSource: createSubscriptionDto.metadata.signupSource || 'web',
        referralCode: createSubscriptionDto.metadata.referralCode,
        specialRequirements: createSubscriptionDto.metadata.specialRequirements,
      };
    }

    const savedSubscription =
      await this.clientSubscriptionRepository.save(subscription);

    this.logger.log(
      `Client subscription created: ${savedSubscription.id} (Client: ${clientId}, Coach: ${createSubscriptionDto.coachId})`,
    );
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Get default commission rate based on various factors
   */
  private getDefaultCommissionRate(): number {
    // Base commission rate - can be adjusted based on:
    // - Coach performance
    // - Volume discounts
    // - Platform promotion periods
    return 20.0; // 20% platform commission, 80% to coach
  }

  /**
   * Get default trial days
   */
  private getDefaultTrialDays(plan: ClientSubscriptionPlan | 'custom'): number {
    switch (plan) {
      case ClientSubscriptionPlan.BASIC_COACHING:
      case 'custom':
        return 7; // 7-day trial
      case ClientSubscriptionPlan.PREMIUM_COACHING:
        return 14; // 14-day trial
      case ClientSubscriptionPlan.ELITE_COACHING:
        return 21; // 21-day trial
      default:
        return 7;
    }
  }

  /**
   * Create initial usage tracking
   */
  private createInitialUsageTracking(): ClientUsageTracking {
    return {
      messagesReceived: 0,
      videoMinutesUsed: 0,
      voiceMinutesUsed: 0,
      workoutPlansReceived: 0,
      formChecksReceived: 0,
      progressPhotosSubmitted: 0,
      lastActivityDate: new Date(),
      loginFrequency: 0,
      workoutCompletionRate: 0,
      responseRate: 100,
      overallEngagement: 50, // Start with medium engagement
    };
  }

  /**
   * Get client subscriptions
   */
  async getClientSubscriptions(
    clientId: string,
    filters: {
      status?: ClientSubscriptionStatus;
      coachId?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    subscriptions: ClientSubscriptionResponseDto[];
    total: number;
  }> {
    const queryBuilder = this.clientSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.coach', 'coach')
      .where('subscription.clientId = :clientId', { clientId });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('subscription.status = :status', {
        status: filters.status,
      });
    }

    if (filters.coachId) {
      queryBuilder.andWhere('subscription.coachId = :coachId', {
        coachId: filters.coachId,
      });
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('subscription.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const subscriptions = await queryBuilder.getMany();
    const subscriptionDtos = subscriptions.map((sub) =>
      this.transformSubscriptionToDto(sub),
    );

    return {
      subscriptions: subscriptionDtos,
      total: totalCount,
    };
  }

  /**
   * Get coach earnings and analytics
   */
  async getCoachEarnings(coachId: string): Promise<CoachEarningsResponseDto> {
    // Get all active subscriptions for this coach
    const activeSubscriptions = await this.clientSubscriptionRepository.find({
      where: {
        coachId,
        status: ClientSubscriptionStatus.ACTIVE,
      },
      relations: ['client'],
      order: { createdAt: 'DESC' },
    });

    const totalActiveClients = activeSubscriptions.length;
    const monthlyRecurringRevenue = activeSubscriptions.reduce(
      (sum, sub) => sum + sub.monthlyValue,
      0,
    );
    const platformCommission = activeSubscriptions.reduce(
      (sum, sub) => sum + sub.platformMonthlyCommission,
      0,
    );
    const netEarnings = monthlyRecurringRevenue - platformCommission;
    const averageClientValue =
      totalActiveClients > 0 ? monthlyRecurringRevenue / totalActiveClients : 0;

    // Calculate retention rate (simplified)
    const clientRetentionRate = 85; // This would be calculated based on historical data

    // Calculate engagement score
    const totalEngagement = activeSubscriptions.reduce(
      (sum, sub) => sum + sub.currentUsage.overallEngagement,
      0,
    );
    const engagementScore =
      totalActiveClients > 0 ? totalEngagement / totalActiveClients : 0;

    // Find top performing plan
    const planCounts = activeSubscriptions.reduce(
      (acc, sub) => {
        acc[sub.plan] = (acc[sub.plan] || 0) + 1;
        return acc;
      },
      {} as Record<ClientSubscriptionPlan, number>,
    );

    const topPerformingPlan = Object.entries(planCounts).reduce(
      (top, [plan, count]) =>
        count > (planCounts[top] || 0) ? (plan as ClientSubscriptionPlan) : top,
      ClientSubscriptionPlan.BASIC_COACHING,
    );

    // Get recent subscriptions (last 5)
    const recentSubscriptions = activeSubscriptions
      .slice(0, 5)
      .map((sub) => this.transformSubscriptionToDto(sub));

    // Get upcoming payments
    const upcomingPayments = activeSubscriptions
      .filter((sub) => sub.nextBillingDate && sub.nextBillingDate > new Date())
      .map((sub) => ({
        clientId: sub.clientId,
        amount: sub.clientPrice,
        dueDate: sub.nextBillingDate!,
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      .slice(0, 10);

    return {
      coachId,
      totalActiveClients,
      monthlyRecurringRevenue,
      platformCommission,
      netEarnings,
      averageClientValue,
      clientRetentionRate,
      engagementScore,
      topPerformingPlan,
      recentSubscriptions,
      upcomingPayments,
    };
  }

  /**
   * Get platform revenue analytics
   */
  async getPlatformRevenueAnalytics(): Promise<PlatformRevenueAnalyticsDto> {
    // This would involve complex queries for real implementation
    // For now, returning a structure that shows the data model
    return {
      totalActiveSubscriptions: 0,
      totalMonthlyRecurringRevenue: 0,
      totalPlatformCommission: 0,
      averageCommissionRate: 20.0,
      topPerformingCoaches: [],
      planDistribution: {
        [ClientSubscriptionPlan.BASIC_COACHING]: 0,
        [ClientSubscriptionPlan.PREMIUM_COACHING]: 0,
        [ClientSubscriptionPlan.ELITE_COACHING]: 0,
        [ClientSubscriptionPlan.CUSTOM_PLAN]: 0,
      },
      billingCycleDistribution: {
        [BillingCycle.WEEKLY]: 0,
        [BillingCycle.MONTHLY]: 0,
        [BillingCycle.QUARTERLY]: 0,
        [BillingCycle.YEARLY]: 0,
      },
      churnRate: 0,
      averageClientLifetime: 0,
      revenueGrowth: {
        monthOverMonth: 0,
        yearOverYear: 0,
      },
    };
  }

  /**
   * Calculate next billing date
   */
  private calculateNextBillingDate(
    currentDate: Date,
    billingCycle: BillingCycle,
  ): Date {
    const nextBilling = new Date(currentDate);

    switch (billingCycle) {
      case BillingCycle.WEEKLY:
        nextBilling.setDate(nextBilling.getDate() + 7);
        break;
      case BillingCycle.QUARTERLY:
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
      case BillingCycle.MONTHLY:
      default:
        nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    return nextBilling;
  }

  /**
   * Transform subscription entity to DTO
   */
  private transformSubscriptionToDto(
    subscription: ClientSubscriptionEntity,
  ): ClientSubscriptionResponseDto {
    return {
      id: subscription.id,
      clientId: subscription.clientId,
      coachId: subscription.coachId,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      clientPrice: Number(subscription.clientPrice),
      coachEarnings: Number(subscription.coachEarnings),
      platformCommission: Number(subscription.platformCommission),
      platformCommissionRate: Number(subscription.platformCommissionRate),
      currency: subscription.currency,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      trialEndDate: subscription.trialEndDate,
      nextBillingDate: subscription.nextBillingDate,
      autoRenew: subscription.autoRenew,
      isTrial: subscription.isTrial,
      features: subscription.features,
      currentUsage: subscription.currentUsage,
      usagePercentages: subscription.usagePercentages,
      isNearLimits: subscription.isNearLimits,
      isOverLimits: subscription.isOverLimits,
      engagementLevel: subscription.engagementLevel,
      daysUntilExpiry: subscription.daysUntilExpiry,
      daysUntilNextBilling: subscription.daysUntilNextBilling,
      monthlyValue: subscription.monthlyValue,
      coachMonthlyEarnings: subscription.coachMonthlyEarnings,
      platformMonthlyCommission: subscription.platformMonthlyCommission,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Process subscription renewals (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processClientSubscriptionRenewals(): Promise<void> {
    this.logger.log('Processing client subscription renewals...');

    const now = new Date();
    const subscriptionsToRenew = await this.clientSubscriptionRepository.find({
      where: {
        status: ClientSubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: Between(new Date(now.getTime() - 60 * 60 * 1000), now),
      },
    });

    for (const subscription of subscriptionsToRenew) {
      try {
        await this.processSubscriptionRenewal(subscription);
      } catch (error) {
        this.logger.error(
          `Failed to renew client subscription ${subscription.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Processed ${subscriptionsToRenew.length} client subscription renewals`,
    );
  }

  /**
   * Process individual subscription renewal
   */
  private async processSubscriptionRenewal(
    subscription: ClientSubscriptionEntity,
  ): Promise<void> {
    // Update subscription billing dates
    subscription.lastBillingDate = new Date();
    subscription.nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      subscription.billingCycle,
    );
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = subscription.nextBillingDate;

    // Reset monthly usage counters
    subscription.currentUsage.messagesReceived = 0;
    subscription.currentUsage.videoMinutesUsed = 0;
    subscription.currentUsage.voiceMinutesUsed = 0;
    subscription.currentUsage.workoutPlansReceived = 0;
    subscription.currentUsage.formChecksReceived = 0;
    subscription.currentUsage.progressPhotosSubmitted = 0;

    await this.clientSubscriptionRepository.save(subscription);

    this.logger.log(
      `Client subscription renewal processed: ${subscription.id}`,
    );
  }
}
