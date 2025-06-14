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
  CoachSubscriptionEntity,
  CoachSubscriptionStatus,
  CoachSubscriptionPlan,
  BillingCycle,
  CoachPlanFeatures,
  CoachUsageTracking,
} from '../entities/coach-subscription.entity';
import {
  PaymentEntity,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export interface CreateCoachSubscriptionDto {
  plan: CoachSubscriptionPlan;
  billingCycle: BillingCycle;
  paymentMethod: PaymentMethod;
  trialDays?: number;
  autoRenew?: boolean;
  platformSubscriptionId?: string;
  metadata?: {
    signupSource?: string;
    referralCode?: string;
    campaignId?: string;
    coachingSpecialty?: string[];
    businessType?: 'individual' | 'gym' | 'studio' | 'corporate';
    teamSize?: number;
  };
}

export interface UpdateCoachSubscriptionDto {
  plan?: CoachSubscriptionPlan;
  billingCycle?: BillingCycle;
  autoRenew?: boolean;
  cancellationReason?: string;
}

export interface CoachSubscriptionResponseDto {
  id: string;
  coachId: string;
  plan: CoachSubscriptionPlan;
  status: CoachSubscriptionStatus;
  billingCycle: BillingCycle;
  price: number;
  currency: string;
  startDate: Date;
  endDate: Date | null;
  trialEndDate: Date | null;
  nextBillingDate: Date | null;
  autoRenew: boolean;
  isTrial: boolean;
  features: CoachPlanFeatures;
  currentUsage: CoachUsageTracking;
  usagePercentages: Record<string, number>;
  isNearLimits: boolean;
  isOverLimits: boolean;
  daysUntilExpiry: number;
  daysUntilNextBilling: number;
  monthlyValue: number;
  annualValue: number;
  createdAt: Date;
}

export interface CoachSubscriptionListResponseDto {
  subscriptions: CoachSubscriptionResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

@Injectable()
export class CoachSubscriptionService {
  private readonly logger = new Logger(CoachSubscriptionService.name);

  constructor(
    @InjectRepository(CoachSubscriptionEntity)
    private readonly coachSubscriptionRepository: Repository<CoachSubscriptionEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Get predefined coach plan configurations
   */
  getCoachPlanConfigurations(): Record<
    CoachSubscriptionPlan,
    { features: CoachPlanFeatures; pricing: Record<BillingCycle, number> }
  > {
    return {
      [CoachSubscriptionPlan.STARTER]: {
        features: {
          // Client Management
          maxActiveClients: 10,
          clientProgressTracking: true,
          groupCoaching: false,
          clientCommunicationTools: true,

          // Content Creation
          customWorkoutBuilder: true,
          nutritionPlanCreator: false,
          progressPhotoStorage: 1, // 1GB
          videoExerciseLibrary: true,
          brandedContentTemplates: false,

          // Business Tools
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: false,
          marketingAutomation: false,
          whiteLabelApp: false,

          // Communication Limits
          monthlyMessages: 100,
          videoCallMinutes: 300, // 5 hours
          groupChatRooms: 1,
          pushNotifications: true,
          emailIntegration: true,

          // Analytics & Reporting
          basicAnalytics: true,
          advancedBusinessMetrics: false,
          clientRetentionReports: false,
          revenueForecastingReports: false,
          dataExportCapabilities: false,

          // AI and Advanced Features
          aiPoweredRecommendations: false,
          wearableIntegrations: false,
          nutritionTrackingIntegrations: false,
          apiAccess: false,
          prioritySupport: false,
          dedicatedSuccessManager: false,

          // Storage and Performance
          storageGB: 5,
          bandwidthGB: 50,
          apiCallsPerMonth: 1000,
        },
        pricing: {
          [BillingCycle.MONTHLY]: 29,
          [BillingCycle.QUARTERLY]: 75, // ~14% discount
          [BillingCycle.YEARLY]: 280, // ~20% discount
        },
      },
      [CoachSubscriptionPlan.PROFESSIONAL]: {
        features: {
          // Client Management
          maxActiveClients: 50,
          clientProgressTracking: true,
          groupCoaching: true,
          clientCommunicationTools: true,

          // Content Creation
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: 10, // 10GB
          videoExerciseLibrary: true,
          brandedContentTemplates: true,

          // Business Tools
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          whiteLabelApp: false,

          // Communication Limits
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: 1200, // 20 hours
          groupChatRooms: 5,
          pushNotifications: true,
          emailIntegration: true,

          // Analytics & Reporting
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          revenueForecastingReports: false,
          dataExportCapabilities: true,

          // AI and Advanced Features
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          apiAccess: false,
          prioritySupport: false,
          dedicatedSuccessManager: false,

          // Storage and Performance
          storageGB: 50,
          bandwidthGB: 500,
          apiCallsPerMonth: 10000,
        },
        pricing: {
          [BillingCycle.MONTHLY]: 79,
          [BillingCycle.QUARTERLY]: 200, // ~15% discount
          [BillingCycle.YEARLY]: 760, // ~20% discount
        },
      },
      [CoachSubscriptionPlan.ELITE]: {
        features: {
          // Client Management
          maxActiveClients: -1, // Unlimited
          clientProgressTracking: true,
          groupCoaching: true,
          clientCommunicationTools: true,

          // Content Creation
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: 100, // 100GB
          videoExerciseLibrary: true,
          brandedContentTemplates: true,

          // Business Tools
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          whiteLabelApp: true,

          // Communication Limits
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: -1, // Unlimited
          groupChatRooms: -1, // Unlimited
          pushNotifications: true,
          emailIntegration: true,

          // Analytics & Reporting
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          revenueForecastingReports: true,
          dataExportCapabilities: true,

          // AI and Advanced Features
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          apiAccess: true,
          prioritySupport: true,
          dedicatedSuccessManager: false,

          // Storage and Performance
          storageGB: 500,
          bandwidthGB: 2000,
          apiCallsPerMonth: 100000,
        },
        pricing: {
          [BillingCycle.MONTHLY]: 159,
          [BillingCycle.QUARTERLY]: 400, // ~16% discount
          [BillingCycle.YEARLY]: 1520, // ~20% discount
        },
      },
      [CoachSubscriptionPlan.ENTERPRISE]: {
        features: {
          // Client Management
          maxActiveClients: -1, // Unlimited
          clientProgressTracking: true,
          groupCoaching: true,
          clientCommunicationTools: true,

          // Content Creation
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: -1, // Unlimited
          videoExerciseLibrary: true,
          brandedContentTemplates: true,

          // Business Tools
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          whiteLabelApp: true,

          // Communication Limits
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: -1, // Unlimited
          groupChatRooms: -1, // Unlimited
          pushNotifications: true,
          emailIntegration: true,

          // Analytics & Reporting
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          revenueForecastingReports: true,
          dataExportCapabilities: true,

          // AI and Advanced Features
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          apiAccess: true,
          prioritySupport: true,
          dedicatedSuccessManager: true,

          // Storage and Performance
          storageGB: -1, // Unlimited
          bandwidthGB: -1, // Unlimited
          apiCallsPerMonth: -1, // Unlimited
        },
        pricing: {
          [BillingCycle.MONTHLY]: 299,
          [BillingCycle.QUARTERLY]: 750, // ~16% discount
          [BillingCycle.YEARLY]: 2870, // ~20% discount
        },
      },
    };
  }

  /**
   * Create a new coach subscription
   */
  async createCoachSubscription(
    coachId: string,
    createSubscriptionDto: CreateCoachSubscriptionDto,
  ): Promise<CoachSubscriptionResponseDto> {
    // Validate coach exists
    const coach = await this.userRepository.findOne({ where: { id: coachId } });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Check if coach already has an active subscription
    const existingSubscription = await this.coachSubscriptionRepository.findOne(
      {
        where: {
          coachId,
          status: CoachSubscriptionStatus.ACTIVE,
        },
      },
    );

    if (existingSubscription) {
      throw new BadRequestException('Coach already has an active subscription');
    }

    // Get plan configuration
    const planConfigs = this.getCoachPlanConfigurations();
    const planConfig = planConfigs[createSubscriptionDto.plan];
    const price = planConfig.pricing[createSubscriptionDto.billingCycle];

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
    const subscription = new CoachSubscriptionEntity();
    subscription.coach = coach;
    subscription.coachId = coachId;
    subscription.plan = createSubscriptionDto.plan;
    subscription.status = trialEndDate
      ? CoachSubscriptionStatus.TRIAL
      : CoachSubscriptionStatus.PENDING;
    subscription.billingCycle = createSubscriptionDto.billingCycle;
    subscription.price = price;
    subscription.currency = 'USD';
    subscription.startDate = startDate;
    subscription.trialEndDate = trialEndDate;
    subscription.nextBillingDate = nextBillingDate;
    subscription.autoRenew = createSubscriptionDto.autoRenew ?? true;
    subscription.isTrial = !!trialEndDate;
    subscription.trialDays = trialDays;
    subscription.features = planConfig.features;
    subscription.currentUsage = this.createInitialUsageTracking();
    subscription.platformFee = 25.0; // 25% platform fee for coach subscriptions
    subscription.coachRevenueShare = 75.0; // 75% to platform (coach pays subscription fee)

    // Set platform-specific subscription IDs
    if (createSubscriptionDto.platformSubscriptionId) {
      switch (createSubscriptionDto.paymentMethod) {
        case PaymentMethod.APPLE_IAP:
          subscription.appleSubscriptionId =
            createSubscriptionDto.platformSubscriptionId;
          break;
        case PaymentMethod.GOOGLE_PLAY:
          subscription.googleSubscriptionId =
            createSubscriptionDto.platformSubscriptionId;
          break;
        case PaymentMethod.STRIPE:
          subscription.stripeSubscriptionId =
            createSubscriptionDto.platformSubscriptionId;
          break;
        case PaymentMethod.PAYPAL:
          subscription.paypalSubscriptionId =
            createSubscriptionDto.platformSubscriptionId;
          break;
      }
    }

    // Set metadata
    if (createSubscriptionDto.metadata) {
      subscription.metadata = {
        signupSource: createSubscriptionDto.metadata.signupSource || 'web',
        referralCode: createSubscriptionDto.metadata.referralCode,
        campaignId: createSubscriptionDto.metadata.campaignId,
        coachingSpecialty: createSubscriptionDto.metadata.coachingSpecialty,
        businessType: createSubscriptionDto.metadata.businessType,
        teamSize: createSubscriptionDto.metadata.teamSize,
      };
    } else {
      subscription.metadata = {
        signupSource: 'web',
      };
    }

    const savedSubscription =
      await this.coachSubscriptionRepository.save(subscription);

    this.logger.log(
      `Coach subscription created for coach ${coachId}: ${savedSubscription.id}`,
    );
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Get default trial days for a plan
   */
  private getDefaultTrialDays(plan: CoachSubscriptionPlan): number {
    switch (plan) {
      case CoachSubscriptionPlan.STARTER:
        return 7; // 7-day trial
      case CoachSubscriptionPlan.PROFESSIONAL:
        return 14; // 14-day trial
      case CoachSubscriptionPlan.ELITE:
        return 30; // 30-day trial
      case CoachSubscriptionPlan.ENTERPRISE:
        return 30; // 30-day trial
      default:
        return 7;
    }
  }

  /**
   * Create initial usage tracking
   */
  private createInitialUsageTracking(): CoachUsageTracking {
    return {
      activeClients: 0,
      messagesUsed: 0,
      videoMinutesUsed: 0,
      storageUsedGB: 0,
      apiCallsUsed: 0,
      lastResetDate: new Date(),
      monthlyRevenue: 0,
      totalClients: 0,
      clientRetentionRate: 100,
      averageSessionDuration: 0,
    };
  }

  /**
   * Update coach subscription
   */
  async updateCoachSubscription(
    subscriptionId: string,
    coachId: string,
    updateSubscriptionDto: UpdateCoachSubscriptionDto,
  ): Promise<CoachSubscriptionResponseDto> {
    const subscription = await this.coachSubscriptionRepository.findOne({
      where: { id: subscriptionId, coachId },
    });

    if (!subscription) {
      throw new NotFoundException('Coach subscription not found');
    }

    // Handle plan change
    if (
      updateSubscriptionDto.plan &&
      updateSubscriptionDto.plan !== subscription.plan
    ) {
      const planConfigs = this.getCoachPlanConfigurations();
      const newPlanConfig = planConfigs[updateSubscriptionDto.plan];
      const newPrice =
        newPlanConfig.pricing[
          updateSubscriptionDto.billingCycle || subscription.billingCycle
        ];

      // Update subscription details
      subscription.plan = updateSubscriptionDto.plan;
      subscription.price = newPrice;
      subscription.features = newPlanConfig.features;

      // Record upgrade/downgrade history
      if (!subscription.metadata) {
        subscription.metadata = { signupSource: 'web' };
      }
      if (!subscription.metadata.upgradeHistory) {
        subscription.metadata.upgradeHistory = [];
      }
      subscription.metadata.upgradeHistory.push({
        fromPlan: subscription.plan,
        toPlan: updateSubscriptionDto.plan,
        date: new Date(),
        reason: 'user_initiated',
      });
    }

    // Handle billing cycle change
    if (
      updateSubscriptionDto.billingCycle &&
      updateSubscriptionDto.billingCycle !== subscription.billingCycle
    ) {
      const planConfigs = this.getCoachPlanConfigurations();
      const planConfig = planConfigs[subscription.plan];
      const newPrice = planConfig.pricing[updateSubscriptionDto.billingCycle];

      subscription.billingCycle = updateSubscriptionDto.billingCycle;
      subscription.price = newPrice;
      subscription.nextBillingDate = this.calculateNextBillingDate(
        new Date(),
        updateSubscriptionDto.billingCycle,
      );
    }

    // Handle auto-renewal change
    if (updateSubscriptionDto.autoRenew !== undefined) {
      subscription.autoRenew = updateSubscriptionDto.autoRenew;
    }

    // Handle cancellation
    if (updateSubscriptionDto.cancellationReason) {
      subscription.status = CoachSubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      subscription.cancellationReason =
        updateSubscriptionDto.cancellationReason;
      subscription.autoRenew = false;
    }

    const savedSubscription =
      await this.coachSubscriptionRepository.save(subscription);

    this.logger.log(`Coach subscription updated: ${subscriptionId}`);
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Get coach subscriptions
   */
  async getCoachSubscriptions(
    coachId: string,
    filters: {
      status?: CoachSubscriptionStatus;
      plan?: CoachSubscriptionPlan;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<CoachSubscriptionListResponseDto> {
    const queryBuilder = this.coachSubscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.coachId = :coachId', { coachId });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('subscription.status = :status', {
        status: filters.status,
      });
    }

    if (filters.plan) {
      queryBuilder.andWhere('subscription.plan = :plan', {
        plan: filters.plan,
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

    const totalPages = Math.ceil(totalCount / limit);

    return {
      subscriptions: subscriptionDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Check if coach has feature access
   */
  async hasFeatureAccess(
    coachId: string,
    feature: keyof CoachPlanFeatures,
  ): Promise<boolean> {
    const activeSubscription = await this.coachSubscriptionRepository.findOne({
      where: {
        coachId,
        status: CoachSubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeSubscription) {
      return false;
    }

    const featureValue = activeSubscription.features[feature];
    return (
      featureValue === true ||
      (typeof featureValue === 'number' && featureValue > 0)
    );
  }

  /**
   * Check usage limits
   */
  async checkUsageLimit(
    coachId: string,
    usageType: keyof CoachUsageTracking,
  ): Promise<{ withinLimit: boolean; used: number; limit: number }> {
    const activeSubscription = await this.coachSubscriptionRepository.findOne({
      where: {
        coachId,
        status: CoachSubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeSubscription) {
      return { withinLimit: false, used: 0, limit: 0 };
    }

    const used = (activeSubscription.currentUsage[usageType] as number) || 0;

    // Map usage type to feature limit
    let limit = 0;
    switch (usageType) {
      case 'activeClients':
        limit = activeSubscription.features.maxActiveClients;
        break;
      case 'messagesUsed':
        limit = activeSubscription.features.monthlyMessages;
        break;
      case 'videoMinutesUsed':
        limit = activeSubscription.features.videoCallMinutes;
        break;
      case 'storageUsedGB':
        limit = activeSubscription.features.storageGB;
        break;
      case 'apiCallsUsed':
        limit = activeSubscription.features.apiCallsPerMonth;
        break;
      default:
        limit = Infinity;
    }

    return {
      withinLimit: limit === -1 || used < limit,
      used,
      limit: limit === -1 ? -1 : limit,
    };
  }

  /**
   * Update usage
   */
  async updateUsage(
    subscriptionId: string,
    usage: Partial<CoachUsageTracking>,
  ): Promise<void> {
    const subscription = await this.coachSubscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Coach subscription not found');
    }

    // Update usage
    Object.keys(usage).forEach((key) => {
      if (usage[key] !== undefined) {
        subscription.currentUsage[key] = usage[key];
      }
    });

    await this.coachSubscriptionRepository.save(subscription);
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
      case BillingCycle.YEARLY:
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
      case BillingCycle.QUARTERLY:
        nextBilling.setMonth(nextBilling.getMonth() + 3);
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
    subscription: CoachSubscriptionEntity,
  ): CoachSubscriptionResponseDto {
    return {
      id: subscription.id,
      coachId: subscription.coachId,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      price: Number(subscription.price),
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
      daysUntilExpiry: subscription.daysUntilExpiry,
      daysUntilNextBilling: subscription.daysUntilNextBilling,
      monthlyValue: subscription.monthlyValue,
      annualValue: subscription.annualValue,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Process subscription renewals (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processCoachSubscriptionRenewals(): Promise<void> {
    this.logger.log('Processing coach subscription renewals...');

    const now = new Date();
    const subscriptionsToRenew = await this.coachSubscriptionRepository.find({
      where: {
        status: CoachSubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: Between(new Date(now.getTime() - 60 * 60 * 1000), now),
      },
    });

    for (const subscription of subscriptionsToRenew) {
      try {
        await this.processSubscriptionRenewal(subscription);
      } catch (error) {
        this.logger.error(
          `Failed to renew coach subscription ${subscription.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Processed ${subscriptionsToRenew.length} coach subscription renewals`,
    );
  }

  /**
   * Process individual subscription renewal
   */
  private async processSubscriptionRenewal(
    subscription: CoachSubscriptionEntity,
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
    subscription.currentUsage.messagesUsed = 0;
    subscription.currentUsage.videoMinutesUsed = 0;
    subscription.currentUsage.apiCallsUsed = 0;
    subscription.currentUsage.lastResetDate = new Date();

    await this.coachSubscriptionRepository.save(subscription);

    this.logger.log(`Coach subscription renewal processed: ${subscription.id}`);
  }
}
