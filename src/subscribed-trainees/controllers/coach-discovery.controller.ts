import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  NotFoundException,
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
import { MessagePermissionService } from '../../messages/services/message-permission.service';
import {
  CoachSearchDto,
  CoachSearchListResponseDto,
  CreateSubscriptionRequestDto,
  SubscriptionRequestResponseDto,
} from '../dtos/subscription-request.dto';

@ApiTags('Coach Discovery')
@Controller('coach-discovery')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoachDiscoveryController {
  constructor(
    private readonly subscriptionRequestService: SubscriptionRequestService,
    private readonly messagePermissionService: MessagePermissionService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search for coaches (Trainee only)',
    description:
      'Search and filter coaches based on various criteria including specializations, experience, rating, and location',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coaches found successfully',
    type: CoachSearchListResponseDto,
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search query for coach name or bio',
  })
  @ApiQuery({
    name: 'specializations',
    required: false,
    type: [String],
    description: 'Filter by specializations',
  })
  @ApiQuery({
    name: 'experienceLevel',
    required: false,
    description: 'Filter by experience level',
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum rating (1-5)',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price per hour',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
  })
  @ApiQuery({
    name: 'gender',
    required: false,
    description: 'Filter by gender preference',
  })
  @ApiQuery({
    name: 'availableOnly',
    required: false,
    type: Boolean,
    description: 'Show only available coaches',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort by: rating, price, experience, name, created_at',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order: ASC or DESC',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 50)',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async searchCoaches(
    @CurrentUser() user: any,
    @Query() searchDto: CoachSearchDto,
  ): Promise<CoachSearchListResponseDto> {
    return this.subscriptionRequestService.searchCoaches(user.id, searchDto);
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Get featured coaches (Trainee only)',
    description: 'Get a curated list of top-rated and featured coaches',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Featured coaches retrieved successfully',
    type: CoachSearchListResponseDto,
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getFeaturedCoaches(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<CoachSearchListResponseDto> {
    const searchDto: CoachSearchDto = {
      sortBy: 'rating',
      sortOrder: 'DESC',
      availableOnly: true,
      minRating: 4.0,
      limit: limit || 10,
      page: 1,
    };

    return this.subscriptionRequestService.searchCoaches(user.id, searchDto);
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Get nearby coaches (Trainee only)',
    description: "Get coaches near the trainee's location",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nearby coaches retrieved successfully',
    type: CoachSearchListResponseDto,
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Location to search around',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Search radius in km',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getNearbyCoaches(
    @CurrentUser() user: any,
    @Query('location') location?: string,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ): Promise<CoachSearchListResponseDto> {
    const searchDto: CoachSearchDto = {
      location: location || user.location,
      availableOnly: true,
      sortBy: 'rating',
      sortOrder: 'DESC',
      limit: limit || 20,
      page: 1,
    };

    return this.subscriptionRequestService.searchCoaches(user.id, searchDto);
  }

  @Get('recommendations')
  @ApiOperation({
    summary: 'Get personalized coach recommendations (Trainee only)',
    description:
      'Get coaches recommended based on trainee preferences and goals',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommended coaches retrieved successfully',
    type: CoachSearchListResponseDto,
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getRecommendedCoaches(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<CoachSearchListResponseDto> {
    // This could implement ML-based recommendations based on:
    // - Trainee's goals and preferences
    // - Similar trainees' choices
    // - Coach success rates for similar goals

    const searchDto: CoachSearchDto = {
      availableOnly: true,
      sortBy: 'rating',
      sortOrder: 'DESC',
      limit: limit || 15,
      page: 1,
    };

    return this.subscriptionRequestService.searchCoaches(user.id, searchDto);
  }

  @Post('subscribe')
  @ApiOperation({
    summary: 'Send subscription request to coach (Trainee only)',
    description:
      'Send a subscription request to a coach with detailed goals and preferences',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Subscription request sent successfully',
    type: SubscriptionRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request data or duplicate request',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async sendSubscriptionRequest(
    @CurrentUser() user: any,
    @Body() createDto: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    return this.subscriptionRequestService.createSubscriptionRequest(
      user.id,
      createDto,
    );
  }

  @Get('coach/:coachId/profile')
  @ApiOperation({
    summary: 'Get detailed coach profile (Trainee only)',
    description:
      'Get comprehensive coach profile including reviews, packages, and availability',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coach profile retrieved successfully',
  })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getCoachProfile(
    @CurrentUser() user: any,
    @Param('coachId') coachId: string,
  ): Promise<any> {
    // Search for this specific coach
    const searchResult = await this.subscriptionRequestService.searchCoaches(
      user.id,
      {
        page: 1,
        limit: 1,
      },
    );

    const coach = searchResult.coaches.find((c) => c.id === coachId);

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Check messaging permissions
    const messagePermission =
      await this.messagePermissionService.canStartConversation(
        user.id,
        coachId,
      );

    return {
      ...coach,
      messaging: {
        canMessage: messagePermission.canStart,
        reason: messagePermission.reason,
        suggestedAction: messagePermission.suggestedAction,
      },
      // Additional profile data would be fetched here
      reviews: [], // Coach reviews
      availability: {}, // Coach availability calendar
      packages: coach.packages || [],
      successStories: [], // Success stories from other trainees
    };
  }

  @Get('coach/:coachId/can-message')
  @ApiOperation({
    summary: 'Check if trainee can message coach',
    description: 'Check messaging permissions between trainee and coach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission checked successfully',
    schema: {
      type: 'object',
      properties: {
        canMessage: { type: 'boolean' },
        reason: { type: 'string', nullable: true },
        suggestedAction: { type: 'string', nullable: true },
        hasActiveRequest: { type: 'boolean' },
      },
    },
  })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async canMessageCoach(
    @CurrentUser() user: any,
    @Param('coachId') coachId: string,
  ): Promise<{
    canMessage: boolean;
    reason?: string;
    suggestedAction?: string;
    hasActiveRequest: boolean;
  }> {
    const [messagePermission, canMessage] = await Promise.all([
      this.messagePermissionService.canStartConversation(user.id, coachId),
      this.subscriptionRequestService.canTraineeMessageCoach(user.id, coachId),
    ]);

    return {
      canMessage: messagePermission.canStart,
      reason: messagePermission.reason,
      suggestedAction: messagePermission.suggestedAction,
      hasActiveRequest: canMessage,
    };
  }

  @Get('my-requests')
  @ApiOperation({
    summary: "Get trainee's subscription requests (Trainee only)",
    description: 'Get all subscription requests sent by the current trainee',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Subscription requests retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by request status',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(RolesGuard)
  @Roles(UserRole.TRAINEE)
  async getMyRequests(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<any> {
    const filters = {
      status: status as any, // Type assertion for string to enum conversion
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
  @ApiOperation({
    summary: "Get trainee's active coaches (Trainee only)",
    description: 'Get all coaches the trainee is currently subscribed to',
  })
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

  @Get('specializations')
  @ApiOperation({
    summary: 'Get available coach specializations',
    description:
      'Get list of all available coach specializations for filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Specializations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        specializations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              count: { type: 'number' },
              description: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getSpecializations(): Promise<{
    specializations: Array<{
      name: string;
      count: number;
      description: string;
    }>;
  }> {
    // This would query the database for actual specializations
    const specializations = [
      {
        name: 'Weight Loss',
        count: 45,
        description: 'Focused on sustainable weight reduction',
      },
      {
        name: 'Strength Training',
        count: 38,
        description: 'Building muscle and increasing strength',
      },
      {
        name: 'Cardio Fitness',
        count: 32,
        description: 'Improving cardiovascular health',
      },
      {
        name: 'Yoga & Flexibility',
        count: 28,
        description: 'Enhancing flexibility and mindfulness',
      },
      {
        name: 'Sports Specific',
        count: 25,
        description: 'Training for specific sports performance',
      },
      {
        name: 'Rehabilitation',
        count: 22,
        description: 'Injury recovery and prevention',
      },
      {
        name: 'Nutrition Coaching',
        count: 35,
        description: 'Dietary guidance and meal planning',
      },
      {
        name: 'Senior Fitness',
        count: 18,
        description: 'Fitness programs for older adults',
      },
      {
        name: 'Prenatal Fitness',
        count: 15,
        description: 'Safe exercise during pregnancy',
      },
      {
        name: 'HIIT Training',
        count: 30,
        description: 'High-intensity interval training',
      },
    ];

    return { specializations };
  }

  @Get('filters')
  @ApiOperation({
    summary: 'Get available search filters',
    description: 'Get all available filter options for coach search',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Filters retrieved successfully',
  })
  async getSearchFilters(): Promise<{
    specializations: string[];
    experienceLevels: string[];
    priceRanges: Array<{ label: string; min: number; max: number }>;
    sortOptions: Array<{ value: string; label: string }>;
  }> {
    return {
      specializations: [
        'Weight Loss',
        'Strength Training',
        'Cardio Fitness',
        'Yoga & Flexibility',
        'Sports Specific',
        'Rehabilitation',
        'Nutrition Coaching',
        'Senior Fitness',
        'Prenatal Fitness',
        'HIIT Training',
      ],
      experienceLevels: ['beginner', 'intermediate', 'advanced'],
      priceRanges: [
        { label: 'Under $50/hour', min: 0, max: 50 },
        { label: '$50-$100/hour', min: 50, max: 100 },
        { label: '$100-$150/hour', min: 100, max: 150 },
        { label: 'Over $150/hour', min: 150, max: 1000 },
      ],
      sortOptions: [
        { value: 'rating', label: 'Highest Rated' },
        { value: 'price', label: 'Price: Low to High' },
        { value: 'experience', label: 'Most Experienced' },
        { value: 'name', label: 'Name: A to Z' },
        { value: 'created_at', label: 'Newest First' },
      ],
    };
  }
}
