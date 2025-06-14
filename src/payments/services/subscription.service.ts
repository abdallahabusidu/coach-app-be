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
  SubscriptionEntity,
  SubscriptionStatus,
  SubscriptionPlan,
  BillingCycle,
} from '../entities/subscription.entity';
import {
  PaymentEntity,
  PaymentMethod,
  PaymentStatus,
} from '../entities/payment.entity';
import { ProductEntity } from '../entities/product.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionListResponseDto,
} from '../dtos/payment.dto';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new subscription
   */
  async createSubscription(
    userId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has an active subscription for this plan
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        plan: createSubscriptionDto.plan,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (existingSubscription) {
      throw new BadRequestException(
        'User already has an active subscription for this plan',
      );
    }

    // Find product for this subscription plan
    const product = await this.productRepository.findOne({
      where: {
        subscriptionPlan: createSubscriptionDto.plan,
        billingCycle: createSubscriptionDto.billingCycle,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found for subscription plan');
    }

    // Calculate dates
    const startDate = new Date();
    const trialEndDate = createSubscriptionDto.trialDays
      ? new Date(
          startDate.getTime() +
            createSubscriptionDto.trialDays * 24 * 60 * 60 * 1000,
        )
      : null;

    const nextBillingDate = this.calculateNextBillingDate(
      startDate,
      createSubscriptionDto.billingCycle,
    );

    // Create subscription
    const subscription = new SubscriptionEntity();
    subscription.user = user;
    subscription.userId = userId;
    subscription.coachId = createSubscriptionDto.coachId;
    subscription.plan = createSubscriptionDto.plan;
    subscription.status = trialEndDate
      ? SubscriptionStatus.TRIAL
      : SubscriptionStatus.PENDING;
    subscription.billingCycle = createSubscriptionDto.billingCycle;
    subscription.price = product.currentPrice;
    subscription.currency = product.currency;
    subscription.startDate = startDate;
    subscription.trialEndDate = trialEndDate;
    subscription.nextBillingDate = trialEndDate || nextBillingDate;
    subscription.autoRenew = createSubscriptionDto.autoRenew ?? true;
    subscription.isTrial = !!trialEndDate;
    subscription.trialDays = createSubscriptionDto.trialDays;
    subscription.coachRevenueShare = product.coachRevenueShare;
    subscription.platformFee = product.platformFee;
    subscription.features = product.features as any;
    subscription.usageLimits = product.limitations as any;
    subscription.currentUsage = {
      messagesUsed: 0,
      workoutsUsed: 0,
      storageUsed: 0,
      videoMinutesUsed: 0,
      apiCallsUsed: 0,
      lastResetDate: new Date(),
    };

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

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    this.logger.log(
      `Subscription created for user ${userId}: ${savedSubscription.id}`,
    );
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    subscriptionId: string,
    userId: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Handle plan change
    if (
      updateSubscriptionDto.plan &&
      updateSubscriptionDto.plan !== subscription.plan
    ) {
      const newProduct = await this.productRepository.findOne({
        where: {
          subscriptionPlan: updateSubscriptionDto.plan,
          billingCycle:
            updateSubscriptionDto.billingCycle || subscription.billingCycle,
        },
      });

      if (!newProduct) {
        throw new NotFoundException(
          'Product not found for new subscription plan',
        );
      }

      // Update subscription details
      subscription.plan = updateSubscriptionDto.plan;
      subscription.price = newProduct.currentPrice;
      subscription.features = newProduct.features as any;
      subscription.usageLimits = newProduct.limitations as any;

      // Record upgrade/downgrade history
      if (!subscription.metadata) {
        subscription.metadata = {
          signupSource: 'web',
        };
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
      subscription.billingCycle = updateSubscriptionDto.billingCycle;
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
      subscription.status = SubscriptionStatus.CANCELLED;
      subscription.cancelledAt = new Date();
      subscription.cancellationReason =
        updateSubscriptionDto.cancellationReason;
      subscription.autoRenew = false;
    }

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    this.logger.log(`Subscription updated: ${subscriptionId}`);
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason?: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'User cancelled';
    subscription.autoRenew = false;

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivateSubscription(
    subscriptionId: string,
    userId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException(
        'Only cancelled subscriptions can be reactivated',
      );
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;
    subscription.autoRenew = true;

    // Update next billing date
    subscription.nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      subscription.billingCycle,
    );

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    this.logger.log(`Subscription reactivated: ${subscriptionId}`);
    return this.transformSubscriptionToDto(savedSubscription);
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(
    userId: string,
    filters: {
      status?: SubscriptionStatus;
      plan?: SubscriptionPlan;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<SubscriptionListResponseDto> {
    const queryBuilder = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .where('subscription.userId = :userId', { userId });

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
   * Get subscription by ID
   */
  async getSubscription(
    subscriptionId: string,
    userId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.transformSubscriptionToDto(subscription);
  }

  /**
   * Update subscription usage
   */
  async updateUsage(
    subscriptionId: string,
    usage: {
      messagesUsed?: number;
      workoutsUsed?: number;
      storageUsed?: number;
      videoMinutesUsed?: number;
      apiCallsUsed?: number;
    },
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.currentUsage) {
      subscription.currentUsage = {
        messagesUsed: 0,
        workoutsUsed: 0,
        storageUsed: 0,
        videoMinutesUsed: 0,
        apiCallsUsed: 0,
        lastResetDate: new Date(),
      };
    }

    // Update usage
    if (usage.messagesUsed !== undefined) {
      subscription.currentUsage.messagesUsed += usage.messagesUsed;
    }
    if (usage.workoutsUsed !== undefined) {
      subscription.currentUsage.workoutsUsed += usage.workoutsUsed;
    }
    if (usage.storageUsed !== undefined) {
      subscription.currentUsage.storageUsed += usage.storageUsed;
    }
    if (usage.videoMinutesUsed !== undefined) {
      subscription.currentUsage.videoMinutesUsed += usage.videoMinutesUsed;
    }
    if (usage.apiCallsUsed !== undefined) {
      subscription.currentUsage.apiCallsUsed += usage.apiCallsUsed;
    }

    await this.subscriptionRepository.save(subscription);
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(userId: string, feature: string): Promise<boolean> {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeSubscription) {
      return false;
    }

    return activeSubscription.features?.[feature] === true;
  }

  /**
   * Check if user is within usage limits
   */
  async checkUsageLimit(
    userId: string,
    usageType:
      | 'messagesUsed'
      | 'workoutsUsed'
      | 'storageUsed'
      | 'videoMinutesUsed'
      | 'apiCallsUsed',
  ): Promise<{ withinLimit: boolean; used: number; limit: number }> {
    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeSubscription) {
      return { withinLimit: false, used: 0, limit: 0 };
    }

    const used = activeSubscription.currentUsage?.[usageType] || 0;
    const limit =
      activeSubscription.usageLimits?.[usageType.replace('Used', '')] ||
      Infinity;

    return {
      withinLimit: used < limit,
      used,
      limit: limit === Infinity ? -1 : limit,
    };
  }

  /**
   * Process subscription renewals (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processSubscriptionRenewals(): Promise<void> {
    this.logger.log('Processing subscription renewals...');

    const now = new Date();
    const subscriptionsToRenew = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: true,
        nextBillingDate: Between(new Date(now.getTime() - 60 * 60 * 1000), now), // Within last hour
      },
    });

    for (const subscription of subscriptionsToRenew) {
      try {
        await this.processSubscriptionRenewal(subscription);
      } catch (error) {
        this.logger.error(
          `Failed to renew subscription ${subscription.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Processed ${subscriptionsToRenew.length} subscription renewals`,
    );
  }

  /**
   * Process expired subscriptions (scheduled task)
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async processExpiredSubscriptions(): Promise<void> {
    this.logger.log('Processing expired subscriptions...');

    const now = new Date();
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: Between(new Date(0), now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);
    }

    this.logger.log(
      `Processed ${expiredSubscriptions.length} expired subscriptions`,
    );
  }

  /**
   * Reset monthly usage counters (scheduled task)
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetMonthlyUsage(): Promise<void> {
    this.logger.log('Resetting monthly usage counters...');

    await this.subscriptionRepository
      .createQueryBuilder()
      .update(SubscriptionEntity)
      .set({
        currentUsage: () => `jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  "currentUsage",
                  '{messagesUsed}',
                  '0'
                ),
                '{workoutsUsed}',
                '0'
              ),
              '{storageUsed}',
              '0'
            ),
            '{videoMinutesUsed}',
            '0'
          ),
          '{apiCallsUsed}',
          '0'
        )`,
      })
      .where('status = :status', { status: SubscriptionStatus.ACTIVE })
      .execute();

    this.logger.log('Monthly usage counters reset');
  }

  /**
   * Process individual subscription renewal
   */
  private async processSubscriptionRenewal(
    subscription: SubscriptionEntity,
  ): Promise<void> {
    // Create renewal payment record
    const payment = new PaymentEntity();
    payment.userId = subscription.userId;
    payment.subscriptionId = subscription.id;
    payment.coachId = subscription.coachId;
    payment.paymentMethod = this.getSubscriptionPaymentMethod(subscription);
    payment.paymentType = 'subscription' as any;
    payment.amount = subscription.price;
    payment.currency = subscription.currency as any;
    payment.isRecurring = true;
    payment.status = PaymentStatus.PENDING;
    payment.description = `${subscription.plan} subscription renewal`;

    await this.paymentRepository.save(payment);

    // Update subscription billing dates
    subscription.lastBillingDate = new Date();
    subscription.nextBillingDate = this.calculateNextBillingDate(
      new Date(),
      subscription.billingCycle,
    );
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = subscription.nextBillingDate;

    await this.subscriptionRepository.save(subscription);

    this.logger.log(`Subscription renewal processed: ${subscription.id}`);
  }

  /**
   * Get payment method for subscription
   */
  private getSubscriptionPaymentMethod(
    subscription: SubscriptionEntity,
  ): PaymentMethod {
    if (subscription.appleSubscriptionId) return PaymentMethod.APPLE_IAP;
    if (subscription.googleSubscriptionId) return PaymentMethod.GOOGLE_PLAY;
    if (subscription.stripeSubscriptionId) return PaymentMethod.STRIPE;
    if (subscription.paypalSubscriptionId) return PaymentMethod.PAYPAL;
    return PaymentMethod.STRIPE; // Default
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
      case BillingCycle.MONTHLY:
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        break;
      case BillingCycle.QUARTERLY:
        nextBilling.setMonth(nextBilling.getMonth() + 3);
        break;
      case BillingCycle.YEARLY:
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        break;
      default:
        nextBilling.setMonth(nextBilling.getMonth() + 1);
    }

    return nextBilling;
  }

  /**
   * Transform subscription entity to DTO
   */
  private transformSubscriptionToDto(
    subscription: SubscriptionEntity,
  ): SubscriptionResponseDto {
    return {
      id: subscription.id,
      userId: subscription.userId,
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
      daysUntilExpiry: subscription.daysUntilExpiry,
      monthlyValue: subscription.monthlyValue,
      createdAt: subscription.createdAt,
    };
  }
}
