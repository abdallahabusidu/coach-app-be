import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import {
  CoachSubscriptionService,
  CreateCoachSubscriptionDto,
  UpdateCoachSubscriptionDto,
  CoachSubscriptionResponseDto,
  CoachSubscriptionListResponseDto,
} from '../services/coach-subscription.service';
import {
  CoachSubscriptionPlan,
  CoachSubscriptionStatus,
  BillingCycle,
  CoachPlanFeatures,
} from '../entities/coach-subscription.entity';
import { PaymentMethod } from '../entities/payment.entity';

export class CreateCoachSubscriptionRequestDto {
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

export class UpdateCoachSubscriptionRequestDto {
  plan?: CoachSubscriptionPlan;
  billingCycle?: BillingCycle;
  autoRenew?: boolean;
  cancellationReason?: string;
}

export class CoachSubscriptionQueryDto {
  status?: CoachSubscriptionStatus;
  plan?: CoachSubscriptionPlan;
  page?: number;
  limit?: number;
}

export class FeatureAccessDto {
  feature: keyof CoachPlanFeatures;
  hasAccess: boolean;
}

export class UsageLimitDto {
  withinLimit: boolean;
  used: number;
  limit: number;
  percentage: number;
}

export class PlanComparisonDto {
  plan: CoachSubscriptionPlan;
  features: CoachPlanFeatures;
  pricing: Record<BillingCycle, number>;
  trialDays: number;
  recommended?: boolean;
  savings?: {
    quarterly: number;
    yearly: number;
  };
}

export class CoachSubscriptionAnalyticsDto {
  totalActiveSubscriptions: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  planDistribution: Record<CoachSubscriptionPlan, number>;
  billingCycleDistribution: Record<BillingCycle, number>;
  trialConversionRate: number;
  topCoachingSpecialties: Array<{ specialty: string; count: number }>;
  revenueGrowth: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

@ApiTags('Coach Subscriptions')
@Controller('coach-subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoachSubscriptionController {
  constructor(
    private readonly coachSubscriptionService: CoachSubscriptionService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available coach subscription plans' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscription plans retrieved successfully',
  })
  async getCoachPlans(): Promise<PlanComparisonDto[]> {
    const planConfigs =
      this.coachSubscriptionService.getCoachPlanConfigurations();

    return Object.entries(planConfigs).map(([plan, config]) => {
      const monthlyPrice = config.pricing[BillingCycle.MONTHLY];
      const quarterlyPrice = config.pricing[BillingCycle.QUARTERLY];
      const yearlyPrice = config.pricing[BillingCycle.YEARLY];

      const quarterlySavings = Math.round(
        ((monthlyPrice * 3 - quarterlyPrice) / (monthlyPrice * 3)) * 100,
      );
      const yearlySavings = Math.round(
        ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100,
      );

      return {
        plan: plan as CoachSubscriptionPlan,
        features: config.features,
        pricing: config.pricing,
        trialDays: this.getTrialDaysForPlan(plan as CoachSubscriptionPlan),
        recommended: plan === CoachSubscriptionPlan.PROFESSIONAL,
        savings: {
          quarterly: quarterlySavings,
          yearly: yearlySavings,
        },
      };
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a coach subscription' })
  @ApiResponse({
    status: 201,
    description: 'Coach subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  @ApiResponse({
    status: 409,
    description: 'Coach already has an active subscription',
  })
  async createCoachSubscription(
    @Request() req,
    @Body() createSubscriptionDto: CreateCoachSubscriptionRequestDto,
  ): Promise<CoachSubscriptionResponseDto> {
    const coachId = req.user.id;

    // Validate coach role
    if (req.user.role !== UserRole.COACH) {
      throw new BadRequestException(
        'Only coaches can create coach subscriptions',
      );
    }

    return this.coachSubscriptionService.createCoachSubscription(
      coachId,
      createSubscriptionDto,
    );
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get current user coach subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscriptions retrieved successfully',
  })
  async getMyCoachSubscriptions(
    @Request() req,
    @Query() query: CoachSubscriptionQueryDto,
  ): Promise<CoachSubscriptionListResponseDto> {
    const coachId = req.user.id;
    return this.coachSubscriptionService.getCoachSubscriptions(coachId, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active coach subscription' })
  @ApiResponse({
    status: 200,
    description: 'Active coach subscription retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  async getActiveCoachSubscription(
    @Request() req,
  ): Promise<CoachSubscriptionResponseDto> {
    const coachId = req.user.id;
    const subscriptions =
      await this.coachSubscriptionService.getCoachSubscriptions(coachId, {
        status: CoachSubscriptionStatus.ACTIVE,
        limit: 1,
      });

    if (subscriptions.subscriptions.length === 0) {
      throw new BadRequestException('No active coach subscription found');
    }

    return subscriptions.subscriptions[0];
  }

  @Get('feature-access/:feature')
  @ApiOperation({ summary: 'Check if coach has access to a specific feature' })
  @ApiResponse({
    status: 200,
    description: 'Feature access checked successfully',
  })
  async checkFeatureAccess(
    @Request() req,
    @Param('feature') feature: keyof CoachPlanFeatures,
  ): Promise<FeatureAccessDto> {
    const coachId = req.user.id;
    const hasAccess = await this.coachSubscriptionService.hasFeatureAccess(
      coachId,
      feature,
    );

    return {
      feature,
      hasAccess,
    };
  }

  @Get('usage-limit/:usageType')
  @ApiOperation({ summary: 'Check usage limit for a specific metric' })
  @ApiResponse({ status: 200, description: 'Usage limit checked successfully' })
  async checkUsageLimit(
    @Request() req,
    @Param('usageType') usageType: string,
  ): Promise<UsageLimitDto> {
    const coachId = req.user.id;
    const usageInfo = await this.coachSubscriptionService.checkUsageLimit(
      coachId,
      usageType as any,
    );

    const percentage =
      usageInfo.limit > 0
        ? Math.round((usageInfo.used / usageInfo.limit) * 100)
        : 0;

    return {
      ...usageInfo,
      percentage,
    };
  }

  @Put(':subscriptionId')
  @ApiOperation({ summary: 'Update coach subscription' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Coach subscription not found' })
  async updateCoachSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateCoachSubscriptionRequestDto,
  ): Promise<CoachSubscriptionResponseDto> {
    const coachId = req.user.id;
    return this.coachSubscriptionService.updateCoachSubscription(
      subscriptionId,
      coachId,
      updateSubscriptionDto,
    );
  }

  @Post(':subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel coach subscription' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscription cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Coach subscription not found' })
  @HttpCode(HttpStatus.OK)
  async cancelCoachSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { reason: string },
  ): Promise<CoachSubscriptionResponseDto> {
    const coachId = req.user.id;
    return this.coachSubscriptionService.updateCoachSubscription(
      subscriptionId,
      coachId,
      {
        cancellationReason: body.reason,
      },
    );
  }

  @Post(':subscriptionId/reactivate')
  @ApiOperation({ summary: 'Reactivate cancelled coach subscription' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscription reactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Coach subscription not found' })
  @HttpCode(HttpStatus.OK)
  async reactivateCoachSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<CoachSubscriptionResponseDto> {
    const coachId = req.user.id;

    // This would require additional logic to reactivate
    // For now, we'll update the subscription to pending status
    return this.coachSubscriptionService.updateCoachSubscription(
      subscriptionId,
      coachId,
      {
        cancellationReason: null,
      },
    );
  }

  @Post('usage/increment')
  @ApiOperation({ summary: 'Increment usage counter for active subscription' })
  @ApiResponse({ status: 200, description: 'Usage updated successfully' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  @HttpCode(HttpStatus.OK)
  async incrementUsage(
    @Request() req,
    @Body()
    body: {
      type: 'messages' | 'videoMinutes' | 'apiCalls' | 'storage';
      amount: number;
    },
  ): Promise<{
    success: boolean;
    withinLimit: boolean;
    used: number;
    limit: number;
  }> {
    const coachId = req.user.id;

    // Get active subscription
    const subscriptions =
      await this.coachSubscriptionService.getCoachSubscriptions(coachId, {
        status: CoachSubscriptionStatus.ACTIVE,
        limit: 1,
      });

    if (subscriptions.subscriptions.length === 0) {
      throw new BadRequestException('No active coach subscription found');
    }

    const subscription = subscriptions.subscriptions[0];

    // Map increment type to usage field
    const usageField = {
      messages: 'messagesUsed',
      videoMinutes: 'videoMinutesUsed',
      apiCalls: 'apiCallsUsed',
      storage: 'storageUsedGB',
    }[body.type] as keyof typeof subscription.currentUsage;

    // Check current usage before increment
    const currentUsage = (subscription.currentUsage[usageField] as number) || 0;
    const newUsage = currentUsage + body.amount;

    // Update usage
    await this.coachSubscriptionService.updateUsage(subscription.id, {
      [usageField]: newUsage,
    });

    // Check if still within limits
    const usageInfo = await this.coachSubscriptionService.checkUsageLimit(
      coachId,
      usageField as any,
    );

    return {
      success: true,
      withinLimit: usageInfo.withinLimit,
      used: usageInfo.used,
      limit: usageInfo.limit,
    };
  }

  // Admin endpoints
  @Get('analytics')
  @ApiOperation({ summary: 'Get coach subscription analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCoachSubscriptionAnalytics(): Promise<CoachSubscriptionAnalyticsDto> {
    // This would be implemented with proper analytics queries
    // For now, returning mock data structure
    return {
      totalActiveSubscriptions: 0,
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      averageRevenuePerUser: 0,
      churnRate: 0,
      planDistribution: {
        [CoachSubscriptionPlan.STARTER]: 0,
        [CoachSubscriptionPlan.PROFESSIONAL]: 0,
        [CoachSubscriptionPlan.ELITE]: 0,
        [CoachSubscriptionPlan.ENTERPRISE]: 0,
      },
      billingCycleDistribution: {
        [BillingCycle.MONTHLY]: 0,
        [BillingCycle.QUARTERLY]: 0,
        [BillingCycle.YEARLY]: 0,
      },
      trialConversionRate: 0,
      topCoachingSpecialties: [],
      revenueGrowth: {
        monthOverMonth: 0,
        yearOverYear: 0,
      },
    };
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all coach subscriptions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All coach subscriptions retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAllCoachSubscriptions(
    @Query() query: CoachSubscriptionQueryDto & { coachId?: string },
  ): Promise<CoachSubscriptionListResponseDto> {
    // This would need to be implemented in the service to search across all coaches
    // For now, just return empty results
    return {
      subscriptions: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }

  /**
   * Helper method to get trial days for a plan
   */
  private getTrialDaysForPlan(plan: CoachSubscriptionPlan): number {
    switch (plan) {
      case CoachSubscriptionPlan.STARTER:
        return 7;
      case CoachSubscriptionPlan.PROFESSIONAL:
        return 14;
      case CoachSubscriptionPlan.ELITE:
        return 30;
      case CoachSubscriptionPlan.ENTERPRISE:
        return 30;
      default:
        return 7;
    }
  }
}
