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
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { SubscriptionService } from '../services/subscription.service';
import {
  SubscriptionStatus,
  SubscriptionPlan,
} from '../entities/subscription.entity';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  SubscriptionListResponseDto,
} from '../dtos/payment.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new subscription',
    description: 'Create a new subscription for the current user',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription created successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid subscription data or user already has active subscription',
  })
  async createSubscription(
    @CurrentUser() user: any,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.createSubscription(
      user.id,
      createSubscriptionDto,
    );
  }

  @Get('my-subscriptions')
  @ApiOperation({
    summary: 'Get user subscriptions',
    description: 'Get paginated list of user subscriptions with filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions retrieved successfully',
    type: SubscriptionListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: 'Filter by subscription status',
  })
  @ApiQuery({
    name: 'plan',
    required: false,
    enum: SubscriptionPlan,
    description: 'Filter by subscription plan',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getUserSubscriptions(
    @CurrentUser() user: any,
    @Query('status') status?: SubscriptionStatus,
    @Query('plan') plan?: SubscriptionPlan,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionListResponseDto> {
    return this.subscriptionService.getUserSubscriptions(user.id, {
      status,
      plan,
      page,
      limit,
    });
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active subscription',
    description: "Get the user's current active subscription",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active subscription retrieved successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active subscription found',
  })
  async getActiveSubscription(
    @CurrentUser() user: any,
  ): Promise<SubscriptionResponseDto> {
    const subscriptions = await this.subscriptionService.getUserSubscriptions(
      user.id,
      {
        status: SubscriptionStatus.ACTIVE,
        limit: 1,
      },
    );

    if (subscriptions.subscriptions.length === 0) {
      throw new NotFoundException('No active subscription found');
    }

    return subscriptions.subscriptions[0];
  }

  @Get('feature-access/:feature')
  @ApiOperation({
    summary: 'Check feature access',
    description: 'Check if user has access to a specific feature',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feature access checked successfully',
    schema: {
      type: 'object',
      properties: {
        hasAccess: { type: 'boolean' },
        feature: { type: 'string' },
        subscription: { $ref: '#/components/schemas/SubscriptionResponseDto' },
      },
    },
  })
  @ApiParam({ name: 'feature', description: 'Feature name to check' })
  async checkFeatureAccess(
    @CurrentUser() user: any,
    @Param('feature') feature: string,
  ): Promise<{
    hasAccess: boolean;
    feature: string;
    subscription?: SubscriptionResponseDto;
  }> {
    const hasAccess = await this.subscriptionService.hasFeatureAccess(
      user.id,
      feature,
    );

    let subscription: SubscriptionResponseDto | undefined;
    if (hasAccess) {
      const activeSubscriptions =
        await this.subscriptionService.getUserSubscriptions(user.id, {
          status: SubscriptionStatus.ACTIVE,
          limit: 1,
        });
      subscription = activeSubscriptions.subscriptions[0];
    }

    return {
      hasAccess,
      feature,
      subscription,
    };
  }

  @Get('usage-limit/:usageType')
  @ApiOperation({
    summary: 'Check usage limit',
    description: 'Check current usage against subscription limits',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage limit checked successfully',
    schema: {
      type: 'object',
      properties: {
        withinLimit: { type: 'boolean' },
        used: { type: 'number' },
        limit: { type: 'number' },
        usageType: { type: 'string' },
        percentage: { type: 'number' },
      },
    },
  })
  @ApiParam({
    name: 'usageType',
    description: 'Usage type to check',
    enum: [
      'messagesUsed',
      'workoutsUsed',
      'storageUsed',
      'videoMinutesUsed',
      'apiCallsUsed',
    ],
  })
  async checkUsageLimit(
    @CurrentUser() user: any,
    @Param('usageType')
    usageType:
      | 'messagesUsed'
      | 'workoutsUsed'
      | 'storageUsed'
      | 'videoMinutesUsed'
      | 'apiCallsUsed',
  ): Promise<{
    withinLimit: boolean;
    used: number;
    limit: number;
    usageType: string;
    percentage: number;
  }> {
    const usageInfo = await this.subscriptionService.checkUsageLimit(
      user.id,
      usageType,
    );

    const percentage =
      usageInfo.limit > 0
        ? Math.round((usageInfo.used / usageInfo.limit) * 100)
        : 0;

    return {
      withinLimit: usageInfo.withinLimit,
      used: usageInfo.used,
      limit: usageInfo.limit,
      usageType,
      percentage,
    };
  }

  @Post('usage/increment')
  @ApiOperation({
    summary: 'Increment usage counters',
    description: 'Increment usage counters for the active subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usage updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No active subscription found',
  })
  async incrementUsage(
    @CurrentUser() user: any,
    @Body()
    usage: {
      messagesUsed?: number;
      workoutsUsed?: number;
      storageUsed?: number;
      videoMinutesUsed?: number;
      apiCallsUsed?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    // Find active subscription
    const activeSubscriptions =
      await this.subscriptionService.getUserSubscriptions(user.id, {
        status: SubscriptionStatus.ACTIVE,
        limit: 1,
      });

    if (activeSubscriptions.subscriptions.length === 0) {
      throw new NotFoundException('No active subscription found');
    }

    const subscription = activeSubscriptions.subscriptions[0];
    await this.subscriptionService.updateUsage(subscription.id, usage);

    return {
      success: true,
      message: 'Usage updated successfully',
    };
  }

  @Get(':subscriptionId')
  @ApiOperation({
    summary: 'Get subscription details',
    description: 'Get detailed information about a specific subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription details retrieved successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  async getSubscription(
    @CurrentUser() user: any,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.getSubscription(subscriptionId, user.id);
  }

  @Put(':subscriptionId')
  @ApiOperation({
    summary: 'Update subscription',
    description: 'Update subscription plan, billing cycle, or other settings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription updated successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  async updateSubscription(
    @CurrentUser() user: any,
    @Param('subscriptionId') subscriptionId: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.updateSubscription(
      subscriptionId,
      user.id,
      updateSubscriptionDto,
    );
  }

  @Put(':subscriptionId/cancel')
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancel an active subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription cancelled successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  async cancelSubscription(
    @CurrentUser() user: any,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: { reason?: string },
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.cancelSubscription(
      subscriptionId,
      user.id,
      body.reason,
    );
  }

  @Put(':subscriptionId/reactivate')
  @ApiOperation({
    summary: 'Reactivate subscription',
    description: 'Reactivate a cancelled subscription',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription reactivated successfully',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Subscription cannot be reactivated',
  })
  @ApiParam({ name: 'subscriptionId', description: 'Subscription ID' })
  async reactivateSubscription(
    @CurrentUser() user: any,
    @Param('subscriptionId') subscriptionId: string,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionService.reactivateSubscription(
      subscriptionId,
      user.id,
    );
  }

  // Admin-only endpoints
  @Get('admin/all')
  @ApiOperation({
    summary: 'Get all subscriptions (Admin only)',
    description: 'Get paginated list of all subscriptions with filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscriptions retrieved successfully',
    type: SubscriptionListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: 'Filter by subscription status',
  })
  @ApiQuery({
    name: 'plan',
    required: false,
    enum: SubscriptionPlan,
    description: 'Filter by subscription plan',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'coachId',
    required: false,
    type: String,
    description: 'Filter by coach ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAllSubscriptions(
    @Query('status') status?: SubscriptionStatus,
    @Query('plan') plan?: SubscriptionPlan,
    @Query('userId') userId?: string,
    @Query('coachId') coachId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionListResponseDto> {
    // This would require extending the service to support admin filters
    throw new BadRequestException(
      'Admin subscription filtering not yet implemented',
    );
  }

  @Get('admin/analytics')
  @ApiOperation({
    summary: 'Get subscription analytics (Admin only)',
    description: 'Get comprehensive subscription analytics and metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Analytics start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Analytics end date',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getSubscriptionAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    cancelledSubscriptions: number;
    trialSubscriptions: number;
    subscriptionsByPlan: Record<string, number>;
    monthlyRecurringRevenue: number;
    churnRate: number;
    averageLifetime: number;
  }> {
    // This would be implemented with proper analytics aggregation
    throw new BadRequestException('Subscription analytics not yet implemented');
  }

  @Get('coach/:coachId/trainees')
  @ApiOperation({
    summary: "Get coach's subscribed trainees (Coach/Admin only)",
    description: 'Get list of trainees subscribed to a specific coach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coach trainees retrieved successfully',
    type: SubscriptionListResponseDto,
  })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: 'Filter by subscription status',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getCoachTrainees(
    @CurrentUser() user: any,
    @Param('coachId') coachId: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionListResponseDto> {
    // Coaches can only view their own trainees, admins can view any
    if (user.role === UserRole.COACH && user.id !== coachId) {
      throw new BadRequestException("Cannot access other coach's trainees");
    }

    // This would require extending the service to filter by coachId
    throw new BadRequestException(
      'Coach trainee filtering not yet implemented',
    );
  }
}
