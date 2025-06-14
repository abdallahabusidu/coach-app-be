import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CoachBoostEntity,
  CoachBoostType,
  CoachBoostStatus,
  BoostDuration,
  BoostMetrics,
  BoostTargeting,
  BoostSettings,
} from '../entities/coach-boost.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import { PaymentEntity } from '../entities/payment.entity';

export interface CreateCoachBoostDto {
  boostType: CoachBoostType;
  duration: BoostDuration;
  priority?: number;
  totalAmount: number;
  autoRenew?: boolean;
  targeting?: BoostTargeting;
  settings?: Partial<BoostSettings>;
  badgeText?: string;
  badgeColor?: string;
  promotionText?: string;
  paymentMethod: string;
}

export interface UpdateCoachBoostDto {
  priority?: number;
  autoRenew?: boolean;
  targeting?: BoostTargeting;
  settings?: Partial<BoostSettings>;
  badgeText?: string;
  badgeColor?: string;
  promotionText?: string;
  cancellationReason?: string;
}

export interface CoachBoostResponseDto {
  id: string;
  coachId: string;
  boostType: CoachBoostType;
  status: CoachBoostStatus;
  duration: BoostDuration;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  amountSpent: number;
  remainingBudget: number;
  priority: number;
  currency: string;
  metrics: BoostMetrics;
  targeting: BoostTargeting | null;
  settings: BoostSettings;
  badgeText: string | null;
  badgeColor: string | null;
  promotionText: string | null;
  autoRenew: boolean;
  nextRenewalDate: Date | null;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  budgetUtilization: number;
  effectivenessScore: number;
  displayBadge: string;
  badgeDisplayColor: string;
  costEfficiency: 'excellent' | 'good' | 'average' | 'poor';
  performanceTrend: 'improving' | 'stable' | 'declining';
  competitiveAdvantage: number;
  createdAt: Date;
}

export interface BoostPackageDto {
  id: string;
  name: string;
  description: string;
  boostType: CoachBoostType;
  features: string[];
  pricing: Record<BoostDuration, number>;
  maxPriority: number;
  recommended?: boolean;
  popular?: boolean;
  savings?: Record<BoostDuration, number>;
  estimatedResults: {
    impressionsIncrease: string;
    clickIncrease: string;
    profileViewIncrease: string;
    inquiryIncrease: string;
  };
}

export interface CoachBoostAnalyticsDto {
  coachId: string;
  totalActiveBoosts: number;
  totalAmountSpent: number;
  totalAmountRemaining: number;
  averageEffectivenessScore: number;
  totalImpressions: number;
  totalClicks: number;
  totalProfileViews: number;
  totalClientInquiries: number;
  totalConversions: number;
  averageClickThroughRate: number;
  averageConversionRate: number;
  totalReturnOnInvestment: number;
  mostEffectiveBoostType: CoachBoostType;
  recentBoosts: CoachBoostResponseDto[];
  competitiveRanking: number;
  marketShare: number;
}

export interface PlatformBoostAnalyticsDto {
  totalActiveBoosts: number;
  totalBoostRevenue: number;
  averageBoostValue: number;
  topPerformingBoostTypes: Array<{
    boostType: CoachBoostType;
    count: number;
    revenue: number;
    averageEffectiveness: number;
  }>;
  topBoostingCoaches: Array<{
    coachId: string;
    coachName: string;
    totalSpent: number;
    totalBoosts: number;
    averageEffectiveness: number;
  }>;
  boostTypeDistribution: Record<CoachBoostType, number>;
  durationDistribution: Record<BoostDuration, number>;
  revenueGrowth: {
    monthOverMonth: number;
    yearOverYear: number;
  };
  marketTrends: {
    averageBidPrice: number;
    competitionLevel: number;
    popularKeywords: string[];
    peakHours: number[];
  };
}

@Injectable()
export class CoachBoostService {
  private readonly logger = new Logger(CoachBoostService.name);

  constructor(
    @InjectRepository(CoachBoostEntity)
    private readonly coachBoostRepository: Repository<CoachBoostEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  /**
   * Get available boost packages
   */
  getAvailableBoostPackages(): BoostPackageDto[] {
    return [
      {
        id: 'search-priority',
        name: 'Search Priority Boost',
        description:
          'Appear at the top of relevant search results with a "Top Result" badge',
        boostType: CoachBoostType.SEARCH_PRIORITY,
        features: [
          'Top placement in search results',
          'Priority ranking algorithm',
          'Increased visibility by 300%',
          'Performance analytics',
          'Keyword targeting',
        ],
        pricing: {
          [BoostDuration.DAILY]: 19,
          [BoostDuration.WEEKLY]: 99,
          [BoostDuration.MONTHLY]: 299,
          [BoostDuration.QUARTERLY]: 799, // 11% savings
          [BoostDuration.YEARLY]: 2999, // 16% savings
        },
        maxPriority: 8,
        popular: true,
        savings: {
          [BoostDuration.DAILY]: 0,
          [BoostDuration.WEEKLY]: 5,
          [BoostDuration.MONTHLY]: 8,
          [BoostDuration.QUARTERLY]: 11,
          [BoostDuration.YEARLY]: 16,
        },
        estimatedResults: {
          impressionsIncrease: '200-400%',
          clickIncrease: '150-300%',
          profileViewIncrease: '100-250%',
          inquiryIncrease: '50-150%',
        },
      },
      {
        id: 'featured-badge',
        name: 'Featured Coach Badge',
        description:
          'Display a premium "Featured" badge on your profile and listings',
        boostType: CoachBoostType.FEATURED_BADGE,
        features: [
          'Premium "Featured" badge',
          'Enhanced profile visibility',
          'Trust signal for clients',
          'Custom badge colors',
          'Social proof boost',
        ],
        pricing: {
          [BoostDuration.DAILY]: 9,
          [BoostDuration.WEEKLY]: 49,
          [BoostDuration.MONTHLY]: 149,
          [BoostDuration.QUARTERLY]: 399,
          [BoostDuration.YEARLY]: 1499,
        },
        maxPriority: 6,
        estimatedResults: {
          impressionsIncrease: '50-100%',
          clickIncrease: '75-150%',
          profileViewIncrease: '100-200%',
          inquiryIncrease: '25-75%',
        },
      },
      {
        id: 'home-recommendations',
        name: 'Home Page Spotlight',
        description: 'Featured placement in home page coach recommendations',
        boostType: CoachBoostType.HOME_RECOMMENDATIONS,
        features: [
          'Home page featured section',
          'First impression advantage',
          'Rotating spotlight placement',
          'Enhanced profile preview',
          'New user exposure',
        ],
        pricing: {
          [BoostDuration.DAILY]: 29,
          [BoostDuration.WEEKLY]: 149,
          [BoostDuration.MONTHLY]: 449,
          [BoostDuration.QUARTERLY]: 1199,
          [BoostDuration.YEARLY]: 4499,
        },
        maxPriority: 9,
        recommended: true,
        estimatedResults: {
          impressionsIncrease: '300-500%',
          clickIncrease: '200-400%',
          profileViewIncrease: '150-350%',
          inquiryIncrease: '75-200%',
        },
      },
      {
        id: 'premium-listing',
        name: 'Premium Listing',
        description:
          'Comprehensive premium placement across all platform features',
        boostType: CoachBoostType.PREMIUM_LISTING,
        features: [
          'Search priority',
          'Featured badge',
          'Home page placement',
          'Category spotlight',
          'Premium support',
          'Advanced analytics',
          'A/B testing',
          'Dedicated account manager',
        ],
        pricing: {
          [BoostDuration.DAILY]: 59,
          [BoostDuration.WEEKLY]: 299,
          [BoostDuration.MONTHLY]: 899,
          [BoostDuration.QUARTERLY]: 2399,
          [BoostDuration.YEARLY]: 8999,
        },
        maxPriority: 10,
        savings: {
          [BoostDuration.DAILY]: 0,
          [BoostDuration.WEEKLY]: 10,
          [BoostDuration.MONTHLY]: 15,
          [BoostDuration.QUARTERLY]: 18,
          [BoostDuration.YEARLY]: 22,
        },
        estimatedResults: {
          impressionsIncrease: '400-800%',
          clickIncrease: '300-600%',
          profileViewIncrease: '250-500%',
          inquiryIncrease: '100-300%',
        },
      },
      {
        id: 'sponsored-content',
        name: 'Sponsored Content',
        description: 'Create and promote sponsored content and success stories',
        boostType: CoachBoostType.SPONSORED_CONTENT,
        features: [
          'Sponsored posts',
          'Success story highlights',
          'Social media amplification',
          'Content creation support',
          'Multi-platform distribution',
        ],
        pricing: {
          [BoostDuration.DAILY]: 39,
          [BoostDuration.WEEKLY]: 199,
          [BoostDuration.MONTHLY]: 599,
          [BoostDuration.QUARTERLY]: 1599,
          [BoostDuration.YEARLY]: 5999,
        },
        maxPriority: 7,
        estimatedResults: {
          impressionsIncrease: '250-450%',
          clickIncrease: '150-350%',
          profileViewIncrease: '200-400%',
          inquiryIncrease: '50-150%',
        },
      },
    ];
  }

  /**
   * Create a coach boost
   */
  async createCoachBoost(
    coachId: string,
    createBoostDto: CreateCoachBoostDto,
  ): Promise<CoachBoostResponseDto> {
    // Validate coach exists
    const coach = await this.userRepository.findOne({ where: { id: coachId } });
    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Check if coach already has an active boost of the same type
    const existingBoost = await this.coachBoostRepository.findOne({
      where: {
        coachId,
        boostType: createBoostDto.boostType,
        status: CoachBoostStatus.ACTIVE,
      },
    });

    if (existingBoost) {
      throw new BadRequestException(
        `Coach already has an active ${createBoostDto.boostType} boost`,
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = this.calculateBoostEndDate(
      startDate,
      createBoostDto.duration,
    );
    const nextRenewalDate = createBoostDto.autoRenew ? endDate : null;

    // Create default boost settings
    const defaultSettings: BoostSettings = {
      autoRenew: createBoostDto.autoRenew || false,
      maxBudget: createBoostDto.totalAmount,
      bidAmount: this.calculateRecommendedBid(createBoostDto.boostType),
      targetImpressions: this.calculateTargetImpressions(
        createBoostDto.duration,
      ),
      targetClicks: 0, // Will be calculated based on CTR
      pauseOnBudgetExhaustion: true,
      competitiveBidding: true,
      smartOptimization: true,
      ...createBoostDto.settings,
    };

    // Create initial metrics
    const initialMetrics: BoostMetrics = {
      impressions: 0,
      clicks: 0,
      profileViews: 0,
      clientInquiries: 0,
      conversions: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      costPerClick: 0,
      costPerConversion: 0,
      totalSpent: 0,
      totalRevenue: 0,
      returnOnInvestment: 0,
    };

    // Create boost entity
    const boost = new CoachBoostEntity();
    boost.coach = coach;
    boost.coachId = coachId;
    boost.boostType = createBoostDto.boostType;
    boost.status = CoachBoostStatus.PENDING; // Will be activated after payment
    boost.duration = createBoostDto.duration;
    boost.startDate = startDate;
    boost.endDate = endDate;
    boost.totalAmount = createBoostDto.totalAmount;
    boost.amountSpent = 0;
    boost.remainingBudget = createBoostDto.totalAmount;
    boost.priority =
      createBoostDto.priority ||
      this.getDefaultPriority(createBoostDto.boostType);
    boost.currency = 'USD';
    boost.metrics = initialMetrics;
    boost.targeting = createBoostDto.targeting || null;
    boost.settings = defaultSettings;
    boost.badgeText = createBoostDto.badgeText || null;
    boost.badgeColor = createBoostDto.badgeColor || null;
    boost.promotionText = createBoostDto.promotionText || null;
    boost.autoRenew = createBoostDto.autoRenew || false;
    boost.nextRenewalDate = nextRenewalDate;
    boost.paymentMethod = createBoostDto.paymentMethod;

    const savedBoost = await this.coachBoostRepository.save(boost);

    this.logger.log(
      `Coach boost created: ${savedBoost.id} (Coach: ${coachId}, Type: ${createBoostDto.boostType})`,
    );
    return this.transformBoostToDto(savedBoost);
  }

  /**
   * Get coach boosts
   */
  async getCoachBoosts(
    coachId: string,
    filters: {
      status?: CoachBoostStatus;
      boostType?: CoachBoostType;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ boosts: CoachBoostResponseDto[]; total: number }> {
    const queryBuilder = this.coachBoostRepository
      .createQueryBuilder('boost')
      .where('boost.coachId = :coachId', { coachId });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('boost.status = :status', {
        status: filters.status,
      });
    }

    if (filters.boostType) {
      queryBuilder.andWhere('boost.boostType = :boostType', {
        boostType: filters.boostType,
      });
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('boost.createdAt', 'DESC').skip(offset).take(limit);

    const boosts = await queryBuilder.getMany();
    const boostDtos = boosts.map((boost) => this.transformBoostToDto(boost));

    return {
      boosts: boostDtos,
      total: totalCount,
    };
  }

  /**
   * Get active coach boosts for search/recommendation algorithms
   */
  async getActiveBoostsForSearch(
    filters: {
      boostTypes?: CoachBoostType[];
      location?: string;
      limit?: number;
    } = {},
  ): Promise<CoachBoostResponseDto[]> {
    const queryBuilder = this.coachBoostRepository
      .createQueryBuilder('boost')
      .leftJoinAndSelect('boost.coach', 'coach')
      .where('boost.status = :status', { status: CoachBoostStatus.ACTIVE })
      .andWhere('boost.startDate <= :now', { now: new Date() })
      .andWhere('boost.endDate >= :now', { now: new Date() })
      .andWhere('boost.remainingBudget > :zero', { zero: 0 });

    // Filter by boost types
    if (filters.boostTypes && filters.boostTypes.length > 0) {
      queryBuilder.andWhere('boost.boostType IN (:...boostTypes)', {
        boostTypes: filters.boostTypes,
      });
    }

    // Order by priority (higher first) and effectiveness
    queryBuilder.orderBy('boost.priority', 'DESC');

    // Limit results
    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    const boosts = await queryBuilder.getMany();
    return boosts.map((boost) => this.transformBoostToDto(boost));
  }

  /**
   * Update boost metrics (called when tracking events)
   */
  async updateBoostMetrics(
    boostId: string,
    metricsUpdate: {
      impressions?: number;
      clicks?: number;
      profileViews?: number;
      clientInquiries?: number;
      conversions?: number;
      amountSpent?: number;
      revenue?: number;
    },
  ): Promise<void> {
    const boost = await this.coachBoostRepository.findOne({
      where: { id: boostId },
    });
    if (!boost) {
      throw new NotFoundException('Boost not found');
    }

    // Update metrics
    const metrics = boost.metrics;
    if (metricsUpdate.impressions)
      metrics.impressions += metricsUpdate.impressions;
    if (metricsUpdate.clicks) metrics.clicks += metricsUpdate.clicks;
    if (metricsUpdate.profileViews)
      metrics.profileViews += metricsUpdate.profileViews;
    if (metricsUpdate.clientInquiries)
      metrics.clientInquiries += metricsUpdate.clientInquiries;
    if (metricsUpdate.conversions)
      metrics.conversions += metricsUpdate.conversions;
    if (metricsUpdate.revenue) metrics.totalRevenue += metricsUpdate.revenue;

    // Update spent amount
    if (metricsUpdate.amountSpent) {
      boost.amountSpent = Number(boost.amountSpent) + metricsUpdate.amountSpent;
      boost.remainingBudget =
        Number(boost.totalAmount) - Number(boost.amountSpent);
      metrics.totalSpent = Number(boost.amountSpent);
    }

    // Recalculate derived metrics
    metrics.clickThroughRate =
      metrics.impressions > 0
        ? (metrics.clicks / metrics.impressions) * 100
        : 0;
    metrics.conversionRate =
      metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    metrics.costPerClick =
      metrics.clicks > 0 ? metrics.totalSpent / metrics.clicks : 0;
    metrics.costPerConversion =
      metrics.conversions > 0 ? metrics.totalSpent / metrics.conversions : 0;
    metrics.returnOnInvestment =
      metrics.totalSpent > 0
        ? ((metrics.totalRevenue - metrics.totalSpent) / metrics.totalSpent) *
          100
        : 0;

    boost.metrics = metrics;

    // Check if budget is exhausted
    if (boost.remainingBudget <= 0 && boost.settings.pauseOnBudgetExhaustion) {
      boost.status = CoachBoostStatus.PAUSED;
    }

    await this.coachBoostRepository.save(boost);
  }

  /**
   * Get coach boost analytics
   */
  async getCoachBoostAnalytics(
    coachId: string,
  ): Promise<CoachBoostAnalyticsDto> {
    const boosts = await this.coachBoostRepository.find({
      where: { coachId },
      order: { createdAt: 'DESC' },
    });

    const activeBoosts = boosts.filter((boost) => boost.isActive);
    const totalAmountSpent = boosts.reduce(
      (sum, boost) => sum + Number(boost.amountSpent),
      0,
    );
    const totalAmountRemaining = activeBoosts.reduce(
      (sum, boost) => sum + Number(boost.remainingBudget),
      0,
    );

    // Calculate aggregated metrics
    const totalMetrics = boosts.reduce(
      (acc, boost) => {
        acc.impressions += boost.metrics.impressions;
        acc.clicks += boost.metrics.clicks;
        acc.profileViews += boost.metrics.profileViews;
        acc.clientInquiries += boost.metrics.clientInquiries;
        acc.conversions += boost.metrics.conversions;
        acc.totalROI += boost.metrics.returnOnInvestment;
        return acc;
      },
      {
        impressions: 0,
        clicks: 0,
        profileViews: 0,
        clientInquiries: 0,
        conversions: 0,
        totalROI: 0,
      },
    );

    const averageClickThroughRate =
      totalMetrics.impressions > 0
        ? (totalMetrics.clicks / totalMetrics.impressions) * 100
        : 0;
    const averageConversionRate =
      totalMetrics.clicks > 0
        ? (totalMetrics.conversions / totalMetrics.clicks) * 100
        : 0;
    const averageEffectivenessScore =
      boosts.length > 0
        ? boosts.reduce((sum, boost) => sum + boost.effectivenessScore, 0) /
          boosts.length
        : 0;
    const totalReturnOnInvestment =
      boosts.length > 0 ? totalMetrics.totalROI / boosts.length : 0;

    // Find most effective boost type
    const boostTypeEffectiveness = boosts.reduce(
      (acc, boost) => {
        if (!acc[boost.boostType]) {
          acc[boost.boostType] = { total: 0, count: 0 };
        }
        acc[boost.boostType].total += boost.effectivenessScore;
        acc[boost.boostType].count += 1;
        return acc;
      },
      {} as Record<CoachBoostType, { total: number; count: number }>,
    );

    const mostEffectiveBoostType = Object.entries(
      boostTypeEffectiveness,
    ).reduce(
      (best, [type, data]) => {
        const average = data.total / data.count;
        return average > best.score
          ? { type: type as CoachBoostType, score: average }
          : best;
      },
      { type: CoachBoostType.SEARCH_PRIORITY, score: 0 },
    ).type;

    return {
      coachId,
      totalActiveBoosts: activeBoosts.length,
      totalAmountSpent,
      totalAmountRemaining,
      averageEffectivenessScore,
      totalImpressions: totalMetrics.impressions,
      totalClicks: totalMetrics.clicks,
      totalProfileViews: totalMetrics.profileViews,
      totalClientInquiries: totalMetrics.clientInquiries,
      totalConversions: totalMetrics.conversions,
      averageClickThroughRate,
      averageConversionRate,
      totalReturnOnInvestment,
      mostEffectiveBoostType,
      recentBoosts: boosts
        .slice(0, 5)
        .map((boost) => this.transformBoostToDto(boost)),
      competitiveRanking: 1, // Would be calculated based on comparison with other coaches
      marketShare: 0.1, // Would be calculated based on total market
    };
  }

  /**
   * Cancel coach boost
   */
  async cancelCoachBoost(
    coachId: string,
    boostId: string,
    cancellationReason: string,
  ): Promise<CoachBoostResponseDto> {
    const boost = await this.coachBoostRepository.findOne({
      where: { id: boostId, coachId },
    });

    if (!boost) {
      throw new NotFoundException('Boost not found');
    }

    boost.status = CoachBoostStatus.CANCELLED;
    boost.cancelledAt = new Date();
    boost.cancellationReason = cancellationReason;
    boost.autoRenew = false;

    const savedBoost = await this.coachBoostRepository.save(boost);
    return this.transformBoostToDto(savedBoost);
  }

  /**
   * Process boost renewals (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processBoostRenewals(): Promise<void> {
    this.logger.log('Processing coach boost renewals...');

    const now = new Date();
    const boostsToRenew = await this.coachBoostRepository.find({
      where: {
        status: CoachBoostStatus.ACTIVE,
        autoRenew: true,
        nextRenewalDate: LessThan(now),
      },
    });

    for (const boost of boostsToRenew) {
      try {
        await this.processBoostRenewal(boost);
      } catch (error) {
        this.logger.error(
          `Failed to renew boost ${boost.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(`Processed ${boostsToRenew.length} boost renewals`);
  }

  /**
   * Expire old boosts (scheduled task)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async expireOldBoosts(): Promise<void> {
    this.logger.log('Expiring old boosts...');

    const now = new Date();
    const expiredBoosts = await this.coachBoostRepository.find({
      where: {
        status: CoachBoostStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    for (const boost of expiredBoosts) {
      boost.status = CoachBoostStatus.EXPIRED;
      await this.coachBoostRepository.save(boost);
    }

    this.logger.log(`Expired ${expiredBoosts.length} boosts`);
  }

  /**
   * Helper methods
   */
  private calculateBoostEndDate(
    startDate: Date,
    duration: BoostDuration,
  ): Date {
    const endDate = new Date(startDate);

    switch (duration) {
      case BoostDuration.DAILY:
        endDate.setDate(endDate.getDate() + 1);
        break;
      case BoostDuration.WEEKLY:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case BoostDuration.QUARTERLY:
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case BoostDuration.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      case BoostDuration.MONTHLY:
      default:
        endDate.setMonth(endDate.getMonth() + 1);
    }

    return endDate;
  }

  private getDefaultPriority(boostType: CoachBoostType): number {
    switch (boostType) {
      case CoachBoostType.PREMIUM_LISTING:
        return 10;
      case CoachBoostType.HOME_RECOMMENDATIONS:
        return 9;
      case CoachBoostType.SEARCH_PRIORITY:
        return 8;
      case CoachBoostType.SPONSORED_CONTENT:
        return 7;
      case CoachBoostType.FEATURED_BADGE:
        return 6;
      case CoachBoostType.TOP_PLACEMENT:
        return 8;
      default:
        return 5;
    }
  }

  private calculateRecommendedBid(boostType: CoachBoostType): number {
    // Base bid recommendations
    switch (boostType) {
      case CoachBoostType.PREMIUM_LISTING:
        return 5.0;
      case CoachBoostType.HOME_RECOMMENDATIONS:
        return 3.0;
      case CoachBoostType.SEARCH_PRIORITY:
        return 2.0;
      case CoachBoostType.SPONSORED_CONTENT:
        return 2.5;
      case CoachBoostType.FEATURED_BADGE:
        return 1.0;
      case CoachBoostType.TOP_PLACEMENT:
        return 2.5;
      default:
        return 1.5;
    }
  }

  private calculateTargetImpressions(duration: BoostDuration): number {
    switch (duration) {
      case BoostDuration.DAILY:
        return 500;
      case BoostDuration.WEEKLY:
        return 2500;
      case BoostDuration.MONTHLY:
        return 10000;
      case BoostDuration.QUARTERLY:
        return 25000;
      case BoostDuration.YEARLY:
        return 100000;
      default:
        return 5000;
    }
  }

  private async processBoostRenewal(boost: CoachBoostEntity): Promise<void> {
    // Create new renewal period
    boost.startDate = boost.endDate;
    boost.endDate = this.calculateBoostEndDate(boost.startDate, boost.duration);
    boost.nextRenewalDate = boost.endDate;
    boost.remainingBudget = boost.totalAmount;
    boost.amountSpent = 0;

    // Reset monthly metrics but preserve historical data
    const newMetrics: BoostMetrics = {
      impressions: 0,
      clicks: 0,
      profileViews: 0,
      clientInquiries: 0,
      conversions: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      costPerClick: 0,
      costPerConversion: 0,
      totalSpent: 0,
      totalRevenue: 0,
      returnOnInvestment: 0,
    };

    boost.metrics = newMetrics;
    await this.coachBoostRepository.save(boost);

    this.logger.log(`Boost renewal processed: ${boost.id}`);
  }

  private transformBoostToDto(boost: CoachBoostEntity): CoachBoostResponseDto {
    return {
      id: boost.id,
      coachId: boost.coachId,
      boostType: boost.boostType,
      status: boost.status,
      duration: boost.duration,
      startDate: boost.startDate,
      endDate: boost.endDate,
      totalAmount: Number(boost.totalAmount),
      amountSpent: Number(boost.amountSpent),
      remainingBudget: Number(boost.remainingBudget),
      priority: boost.priority,
      currency: boost.currency,
      metrics: boost.metrics,
      targeting: boost.targeting,
      settings: boost.settings,
      badgeText: boost.badgeText,
      badgeColor: boost.badgeColor,
      promotionText: boost.promotionText,
      autoRenew: boost.autoRenew,
      nextRenewalDate: boost.nextRenewalDate,
      isActive: boost.isActive,
      isExpired: boost.isExpired,
      daysRemaining: boost.daysRemaining,
      budgetUtilization: boost.budgetUtilization,
      effectivenessScore: boost.effectivenessScore,
      displayBadge: boost.displayBadge,
      badgeDisplayColor: boost.badgeDisplayColor,
      costEfficiency: boost.costEfficiency,
      performanceTrend: boost.performanceTrend,
      competitiveAdvantage: boost.competitiveAdvantage,
      createdAt: boost.createdAt,
    };
  }
}
