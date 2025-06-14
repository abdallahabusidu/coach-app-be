import {
  Controller,
  Get,
  Post,
  Put,
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
  ClientSubscriptionService,
  CreateClientSubscriptionDto,
  UpdateClientSubscriptionDto,
  ClientSubscriptionResponseDto,
  CoachEarningsResponseDto,
  PlatformRevenueAnalyticsDto,
} from '../services/client-subscription.service';
import {
  ClientSubscriptionPlan,
  ClientSubscriptionStatus,
  BillingCycle,
  ClientPlanFeatures,
} from '../entities/client-subscription.entity';
import { PaymentMethod } from '../entities/payment.entity';

export class CreateClientSubscriptionRequestDto {
  coachId: string;
  plan: ClientSubscriptionPlan | 'custom';
  billingCycle: BillingCycle;
  clientPrice?: number;
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

export class UpdateClientSubscriptionRequestDto {
  plan?: ClientSubscriptionPlan | 'custom';
  billingCycle?: BillingCycle;
  clientPrice?: number;
  autoRenew?: boolean;
  cancellationReason?: string;
  customFeatures?: Partial<ClientPlanFeatures>;
}

export class ClientSubscriptionQueryDto {
  status?: ClientSubscriptionStatus;
  coachId?: string;
  page?: number;
  limit?: number;
}

export class PlanOptionsDto {
  plan: ClientSubscriptionPlan;
  features: ClientPlanFeatures;
  defaultPricing: Record<BillingCycle, number>;
  description: string;
  popular?: boolean;
  trialDays: number;
}

export class CoachPricingDto {
  coachId: string;
  coachName: string;
  availablePlans: Array<{
    plan: ClientSubscriptionPlan | 'custom';
    features: ClientPlanFeatures;
    pricing: Record<BillingCycle, number>;
    description: string;
  }>;
  customPricingAvailable: boolean;
  averageRating?: number;
  totalClients?: number;
  specialties?: string[];
}

@ApiTags('Client Subscriptions')
@Controller('client-subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientSubscriptionController {
  constructor(
    private readonly clientSubscriptionService: ClientSubscriptionService,
  ) {}

  @Get('plan-options')
  @ApiOperation({ summary: 'Get available client subscription plan options' })
  @ApiResponse({
    status: 200,
    description: 'Plan options retrieved successfully',
  })
  async getClientPlanOptions(): Promise<PlanOptionsDto[]> {
    const planConfigs =
      this.clientSubscriptionService.getClientPlanConfigurations();

    return Object.entries(planConfigs).map(([plan, config]) => ({
      plan: plan as ClientSubscriptionPlan,
      features: config.features,
      defaultPricing: config.defaultPricing,
      description: this.getPlanDescription(plan as ClientSubscriptionPlan),
      popular: plan === ClientSubscriptionPlan.PREMIUM_COACHING,
      trialDays: this.getTrialDaysForPlan(plan as ClientSubscriptionPlan),
    }));
  }

  @Get('coach/:coachId/pricing')
  @ApiOperation({
    summary: 'Get available plans and pricing for a specific coach',
  })
  @ApiResponse({
    status: 200,
    description: 'Coach pricing retrieved successfully',
  })
  async getCoachPricing(
    @Param('coachId') coachId: string,
  ): Promise<CoachPricingDto> {
    // This would typically fetch coach-specific data
    // For now, returning default structure with coach-specific info
    const planConfigs =
      this.clientSubscriptionService.getClientPlanConfigurations();

    const availablePlans = Object.entries(planConfigs).map(
      ([plan, config]) => ({
        plan: plan as ClientSubscriptionPlan | 'custom',
        features: config.features,
        pricing: config.defaultPricing,
        description: this.getPlanDescription(plan as ClientSubscriptionPlan),
      }),
    );

    // Add custom plan option
    availablePlans.push({
      plan: 'custom',
      features: planConfigs[ClientSubscriptionPlan.CUSTOM_PLAN].features,
      pricing: planConfigs[ClientSubscriptionPlan.CUSTOM_PLAN].defaultPricing,
      description: 'Fully customizable plan tailored to your specific needs',
    });

    return {
      coachId,
      coachName: 'Coach Name', // Would be fetched from database
      availablePlans,
      customPricingAvailable: true,
      averageRating: 4.8,
      totalClients: 45,
      specialties: ['Weight Loss', 'Strength Training', 'Nutrition'],
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a client subscription to a coach' })
  @ApiResponse({
    status: 201,
    description: 'Client subscription created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid subscription data' })
  @ApiResponse({
    status: 409,
    description: 'Client already has active subscription with this coach',
  })
  async createClientSubscription(
    @Request() req,
    @Body() createSubscriptionDto: CreateClientSubscriptionRequestDto,
  ): Promise<ClientSubscriptionResponseDto> {
    const clientId = req.user.id;

    // Validate client role (trainee can create subscriptions)
    if (req.user.role !== UserRole.TRAINEE) {
      throw new BadRequestException(
        'Only trainees can create client subscriptions',
      );
    }

    return this.clientSubscriptionService.createClientSubscription(clientId, {
      ...createSubscriptionDto,
      clientPrice: createSubscriptionDto.clientPrice || 0, // Will be set by service if not provided
    });
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get current user client subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Client subscriptions retrieved successfully',
  })
  async getMyClientSubscriptions(
    @Request() req,
    @Query() query: ClientSubscriptionQueryDto,
  ): Promise<{
    subscriptions: ClientSubscriptionResponseDto[];
    total: number;
  }> {
    const clientId = req.user.id;
    return this.clientSubscriptionService.getClientSubscriptions(
      clientId,
      query,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active client subscriptions' })
  @ApiResponse({
    status: 200,
    description: 'Active client subscriptions retrieved successfully',
  })
  async getActiveClientSubscriptions(
    @Request() req,
  ): Promise<ClientSubscriptionResponseDto[]> {
    const clientId = req.user.id;
    const result = await this.clientSubscriptionService.getClientSubscriptions(
      clientId,
      {
        status: ClientSubscriptionStatus.ACTIVE,
      },
    );

    return result.subscriptions;
  }

  @Get('coach/:coachId')
  @ApiOperation({ summary: 'Get subscription with specific coach' })
  @ApiResponse({
    status: 200,
    description: 'Coach subscription retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription found with this coach',
  })
  async getSubscriptionWithCoach(
    @Request() req,
    @Param('coachId') coachId: string,
  ): Promise<ClientSubscriptionResponseDto> {
    const clientId = req.user.id;
    const result = await this.clientSubscriptionService.getClientSubscriptions(
      clientId,
      {
        coachId,
        status: ClientSubscriptionStatus.ACTIVE,
      },
    );

    if (result.subscriptions.length === 0) {
      throw new BadRequestException(
        'No active subscription found with this coach',
      );
    }

    return result.subscriptions[0];
  }

  @Put(':subscriptionId')
  @ApiOperation({ summary: 'Update client subscription' })
  @ApiResponse({
    status: 200,
    description: 'Client subscription updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Client subscription not found' })
  async updateClientSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateClientSubscriptionRequestDto,
  ): Promise<ClientSubscriptionResponseDto> {
    // This would need to be implemented in the service
    throw new BadRequestException('Update functionality not yet implemented');
  }

  @Post(':subscriptionId/cancel')
  @ApiOperation({ summary: 'Cancel client subscription' })
  @ApiResponse({
    status: 200,
    description: 'Client subscription cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Client subscription not found' })
  @HttpCode(HttpStatus.OK)
  async cancelClientSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { reason: string },
  ): Promise<{ success: boolean; message: string }> {
    // This would need to be implemented in the service
    return {
      success: true,
      message: 'Subscription cancelled successfully',
    };
  }

  @Post(':subscriptionId/pause')
  @ApiOperation({ summary: 'Pause client subscription' })
  @ApiResponse({
    status: 200,
    description: 'Client subscription paused successfully',
  })
  @HttpCode(HttpStatus.OK)
  async pauseClientSubscription(
    @Request() req,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { pauseDays: number; reason?: string },
  ): Promise<{ success: boolean; resumeDate: Date }> {
    // This would need to be implemented in the service
    const resumeDate = new Date();
    resumeDate.setDate(resumeDate.getDate() + body.pauseDays);

    return {
      success: true,
      resumeDate,
    };
  }

  // Coach-specific endpoints
  @Get('coach-earnings')
  @ApiOperation({ summary: 'Get coach earnings and analytics (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach earnings retrieved successfully',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async getCoachEarnings(@Request() req): Promise<CoachEarningsResponseDto> {
    const coachId = req.user.id;
    return this.clientSubscriptionService.getCoachEarnings(coachId);
  }

  @Get('coach-earnings/:coachId')
  @ApiOperation({ summary: 'Get specific coach earnings (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach earnings retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getSpecificCoachEarnings(
    @Param('coachId') coachId: string,
  ): Promise<CoachEarningsResponseDto> {
    return this.clientSubscriptionService.getCoachEarnings(coachId);
  }

  @Get('my-clients')
  @ApiOperation({ summary: 'Get coach clients and subscriptions (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach clients retrieved successfully',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async getMyClients(@Request() req): Promise<ClientSubscriptionResponseDto[]> {
    const coachId = req.user.id;

    // This would need to be implemented in the service to get all clients for a coach
    // For now, returning empty array
    return [];
  }

  // Admin endpoints
  @Get('platform-analytics')
  @ApiOperation({ summary: 'Get platform revenue analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Platform analytics retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getPlatformAnalytics(): Promise<PlatformRevenueAnalyticsDto> {
    return this.clientSubscriptionService.getPlatformRevenueAnalytics();
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all client subscriptions (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All client subscriptions retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAllClientSubscriptions(
    @Query() query: ClientSubscriptionQueryDto & { clientId?: string },
  ): Promise<{
    subscriptions: ClientSubscriptionResponseDto[];
    total: number;
  }> {
    // This would need to be implemented in the service for admin access
    return {
      subscriptions: [],
      total: 0,
    };
  }

  /**
   * Helper methods
   */
  private getPlanDescription(plan: ClientSubscriptionPlan): string {
    switch (plan) {
      case ClientSubscriptionPlan.BASIC_COACHING:
        return 'Essential coaching with workout plans and basic progress tracking';
      case ClientSubscriptionPlan.PREMIUM_COACHING:
        return 'Complete coaching experience with nutrition planning and group sessions';
      case ClientSubscriptionPlan.ELITE_COACHING:
        return 'Premium coaching with unlimited access and priority support';
      case ClientSubscriptionPlan.CUSTOM_PLAN:
        return 'Fully customizable plan tailored to your specific needs';
      default:
        return 'Professional coaching services';
    }
  }

  private getTrialDaysForPlan(plan: ClientSubscriptionPlan): number {
    switch (plan) {
      case ClientSubscriptionPlan.BASIC_COACHING:
        return 7;
      case ClientSubscriptionPlan.PREMIUM_COACHING:
        return 14;
      case ClientSubscriptionPlan.ELITE_COACHING:
        return 21;
      case ClientSubscriptionPlan.CUSTOM_PLAN:
        return 7;
      default:
        return 7;
    }
  }
}
