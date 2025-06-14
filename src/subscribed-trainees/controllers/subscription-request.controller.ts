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
  HttpStatus,
  BadRequestException,
  ForbiddenException,
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
import { SubscriptionRequestService } from '../services/subscription-request.service';
import {
  CreateSubscriptionRequestDto,
  RespondToRequestDto,
  CoachSearchDto,
  SubscriptionRequestResponseDto,
  CoachSearchResponseDto,
  SubscriptionRequestListResponseDto,
  CoachSearchListResponseDto,
} from '../dtos/subscription-request.dto';
import {
  SubscriptionStatus,
  RequestType,
} from '../entities/subscription-request.entity';

@ApiTags('Subscription Requests')
@Controller('subscription-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionRequestController {
  constructor(
    private readonly subscriptionRequestService: SubscriptionRequestService,
  ) {}

  @Get('coaches/search')
  @ApiOperation({ summary: 'Search for coaches (Trainee only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coaches found successfully',
    type: CoachSearchListResponseDto,
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'specializations', required: false, type: [String] })
  @ApiQuery({ name: 'experienceLevel', required: false })
  @ApiQuery({ name: 'minRating', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'availableOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async searchCoaches(
    @CurrentUser() user: any,
    @Query() searchDto: CoachSearchDto,
  ): Promise<CoachSearchListResponseDto> {
    return this.subscriptionRequestService.searchCoaches(user.id, searchDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create subscription request (Trainee only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription request created successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or duplicate request',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async createSubscriptionRequest(
    @CurrentUser() user: any,
    @Body() createDto: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.createSubscriptionRequest(
      user.id,
      createDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get subscription requests for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription requests retrieved successfully',
    type: SubscriptionRequestListResponseDto,
  })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'requestType', required: false, enum: RequestType })
  @ApiQuery({
    name: 'coachId',
    required: false,
    description: 'Filter by coach ID (trainee only)',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    description: 'Filter by trainee ID (coach only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSubscriptionRequests(
    @CurrentUser() user: any,
    @Query('status') status?: SubscriptionStatus,
    @Query('requestType') requestType?: RequestType,
    @Query('coachId') coachId?: string,
    @Query('traineeId') traineeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionRequestListResponseDto> {
    const filters = {
      status,
      requestType,
      coachId: user.role === UserRole.TRAINEE ? coachId : undefined,
      traineeId: user.role === UserRole.COACH ? traineeId : undefined,
      page,
      limit,
    };

    return this.subscriptionRequestService.getSubscriptionRequests(
      user.id,
      user.role,
      filters,
    );
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending subscription requests (Coach only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending requests retrieved successfully',
    type: SubscriptionRequestListResponseDto,
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async getPendingRequests(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionRequestListResponseDto> {
    const filters = {
      status: SubscriptionStatus.PENDING,
      page,
      limit,
    };

    return this.subscriptionRequestService.getSubscriptionRequests(
      user.id,
      user.role,
      filters,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active subscription requests' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active requests retrieved successfully',
    type: SubscriptionRequestListResponseDto,
  })
  async getActiveRequests(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SubscriptionRequestListResponseDto> {
    const filters = {
      status: SubscriptionStatus.ACTIVE,
      page,
      limit,
    };

    return this.subscriptionRequestService.getSubscriptionRequests(
      user.id,
      user.role,
      filters,
    );
  }

  @Get('my-coaches')
  @ApiOperation({ summary: "Get trainee's active coaches (Trainee only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active coaches retrieved successfully',
    type: [SubscriptionRequestResponseDto],
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getMyCoaches(
    @CurrentUser() user: any,
  ): Promise<SubscriptionRequestResponseDto[]> {
    return this.subscriptionRequestService.getTraineeActiveCoaches(user.id);
  }

  @Get('my-trainees')
  @ApiOperation({ summary: "Get coach's active trainees (Coach only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active trainees retrieved successfully',
    type: [SubscriptionRequestResponseDto],
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async getMyTrainees(
    @CurrentUser() user: any,
  ): Promise<SubscriptionRequestResponseDto[]> {
    return this.subscriptionRequestService.getCoachActiveTrainees(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription request by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription request retrieved successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription request not found',
  })
  @ApiParam({ name: 'id', description: 'Subscription request ID' })
  async getSubscriptionRequestById(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.getSubscriptionRequestById(
      requestId,
      user.id,
      user.role,
    );
  }

  @Put(':id/respond')
  @ApiOperation({ summary: 'Respond to subscription request (Coach only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Response submitted successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Request already responded to or invalid data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Subscription request not found',
  })
  @ApiParam({ name: 'id', description: 'Subscription request ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async respondToRequest(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
    @Body() responseDto: RespondToRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.respondToSubscriptionRequest(
      requestId,
      user.id,
      responseDto,
    );
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Quick approve subscription request (Coach only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request approved successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Subscription request ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async approveRequest(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
    @Body() body: { message?: string; monthlyFee?: number },
  ): Promise<SubscriptionRequestResponseDto> {
    const responseDto: RespondToRequestDto = {
      status: SubscriptionStatus.APPROVED,
      coachResponse: body.message,
      monthlyFee: body.monthlyFee,
    };

    return this.subscriptionRequestService.respondToSubscriptionRequest(
      requestId,
      user.id,
      responseDto,
    );
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject subscription request (Coach only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request rejected successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Subscription request ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async rejectRequest(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
    @Body() body: { message?: string },
  ): Promise<SubscriptionRequestResponseDto> {
    const responseDto: RespondToRequestDto = {
      status: SubscriptionStatus.REJECTED,
      coachResponse: body.message,
    };

    return this.subscriptionRequestService.respondToSubscriptionRequest(
      requestId,
      user.id,
      responseDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription request (Trainee only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel active subscription',
  })
  @ApiParam({ name: 'id', description: 'Subscription request ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async cancelRequest(
    @CurrentUser() user: any,
    @Param('id') requestId: string,
  ): Promise<{ message: string }> {
    await this.subscriptionRequestService.cancelSubscriptionRequest(
      requestId,
      user.id,
    );
    return { message: 'Subscription request cancelled successfully' };
  }

  @Get('permissions/can-message/:coachId')
  @ApiOperation({
    summary: 'Check if trainee can message coach (Trainee only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission checked successfully',
    schema: {
      type: 'object',
      properties: {
        canMessage: { type: 'boolean' },
        requestId: { type: 'string', nullable: true },
      },
    },
  })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async canMessageCoach(
    @CurrentUser() user: any,
    @Param('coachId') coachId: string,
  ): Promise<{ canMessage: boolean; requestId?: string }> {
    const canMessage =
      await this.subscriptionRequestService.canTraineeMessageCoach(
        user.id,
        coachId,
      );
    return { canMessage };
  }

  @Get('permissions/can-view-profile/:traineeId')
  @ApiOperation({
    summary: 'Check if coach can view trainee profile (Coach only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission checked successfully',
    schema: {
      type: 'object',
      properties: {
        canViewProfile: { type: 'boolean' },
        requestId: { type: 'string', nullable: true },
      },
    },
  })
  @ApiParam({ name: 'traineeId', description: 'Trainee ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async canViewTraineeProfile(
    @CurrentUser() user: any,
    @Param('traineeId') traineeId: string,
  ): Promise<{ canViewProfile: boolean; requestId?: string }> {
    const canViewProfile =
      await this.subscriptionRequestService.canCoachViewTraineeProfile(
        user.id,
        traineeId,
      );
    return { canViewProfile };
  }

  @Post('bulk-respond')
  @ApiOperation({ summary: 'Bulk respond to multiple requests (Coach only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bulk response completed',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH)
  async bulkRespondToRequests(
    @CurrentUser() user: any,
    @Body()
    body: {
      requestIds: string[];
      response: RespondToRequestDto;
    },
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const { requestIds, response } = body;
    const results = {
      processed: requestIds.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const requestId of requestIds) {
      try {
        await this.subscriptionRequestService.respondToSubscriptionRequest(
          requestId,
          user.id,
          response,
        );
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Request ${requestId}: ${error.message}`);
      }
    }

    return results;
  }

  @Get('analytics/summary')
  @ApiOperation({ summary: 'Get subscription analytics summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number' },
        pendingRequests: { type: 'number' },
        approvedRequests: { type: 'number' },
        rejectedRequests: { type: 'number' },
        activeSubscriptions: { type: 'number' },
        conversionRate: { type: 'number' },
        averageResponseTime: { type: 'number' },
        revenueThisMonth: { type: 'number' },
      },
    },
  })
  async getAnalyticsSummary(@CurrentUser() user: any): Promise<any> {
    // This would implement analytics calculation
    const filters = { page: 1, limit: 1 };
    const summary =
      await this.subscriptionRequestService.getSubscriptionRequests(
        user.id,
        user.role,
        filters,
      );

    return {
      totalRequests: summary.summary.total,
      pendingRequests: summary.summary.pending,
      approvedRequests: summary.summary.approved,
      rejectedRequests: summary.summary.rejected,
      activeSubscriptions: summary.summary.active,
      conversionRate:
        summary.summary.total > 0
          ? (summary.summary.approved / summary.summary.total) * 100
          : 0,
      averageResponseTime: 24, // Hours - would be calculated from actual data
      revenueThisMonth: 0, // Would be calculated from billing data
    };
  }
}
