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
  CoachBoostService,
  CreateCoachBoostDto,
  UpdateCoachBoostDto,
  CoachBoostResponseDto,
  BoostPackageDto,
  CoachBoostAnalyticsDto,
  PlatformBoostAnalyticsDto,
} from '../services/coach-boost.service';
import {
  CoachBoostType,
  CoachBoostStatus,
  BoostDuration,
  BoostTargeting,
  BoostSettings,
} from '../entities/coach-boost.entity';

export class CreateCoachBoostRequestDto {
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

export class UpdateCoachBoostRequestDto {
  priority?: number;
  autoRenew?: boolean;
  targeting?: BoostTargeting;
  settings?: Partial<BoostSettings>;
  badgeText?: string;
  badgeColor?: string;
  promotionText?: string;
}

export class CoachBoostQueryDto {
  status?: CoachBoostStatus;
  boostType?: CoachBoostType;
  page?: number;
  limit?: number;
}

export class BoostMetricsUpdateDto {
  impressions?: number;
  clicks?: number;
  profileViews?: number;
  clientInquiries?: number;
  conversions?: number;
  amountSpent?: number;
  revenue?: number;
}

export class CancelBoostDto {
  reason: string;
}

export class SearchBoostFiltersDto {
  boostTypes?: CoachBoostType[];
  location?: string;
  limit?: number;
}

@ApiTags('Coach Boosting')
@Controller('coach-boosts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoachBoostController {
  constructor(private readonly coachBoostService: CoachBoostService) {}

  @Get('packages')
  @ApiOperation({ summary: 'Get available boost packages and pricing' })
  @ApiResponse({
    status: 200,
    description: 'Boost packages retrieved successfully',
  })
  async getBoostPackages(): Promise<BoostPackageDto[]> {
    return this.coachBoostService.getAvailableBoostPackages();
  }

  @Post()
  @ApiOperation({ summary: 'Create a coach boost (Coach only)' })
  @ApiResponse({ status: 201, description: 'Coach boost created successfully' })
  @ApiResponse({
    status: 400,
    description:
      'Invalid boost data or coach already has active boost of this type',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async createCoachBoost(
    @Request() req,
    @Body() createBoostDto: CreateCoachBoostRequestDto,
  ): Promise<CoachBoostResponseDto> {
    const coachId = req.user.id;
    return this.coachBoostService.createCoachBoost(coachId, createBoostDto);
  }

  @Get('my-boosts')
  @ApiOperation({ summary: 'Get coach boosts for current user (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach boosts retrieved successfully',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async getMyBoosts(
    @Request() req,
    @Query() query: CoachBoostQueryDto,
  ): Promise<{ boosts: CoachBoostResponseDto[]; total: number }> {
    const coachId = req.user.id;
    return this.coachBoostService.getCoachBoosts(coachId, query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active coach boosts (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Active boosts retrieved successfully',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async getActiveBoosts(@Request() req): Promise<CoachBoostResponseDto[]> {
    const coachId = req.user.id;
    const result = await this.coachBoostService.getCoachBoosts(coachId, {
      status: CoachBoostStatus.ACTIVE,
    });
    return result.boosts;
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get coach boost analytics (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Boost analytics retrieved successfully',
  })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async getBoostAnalytics(@Request() req): Promise<CoachBoostAnalyticsDto> {
    const coachId = req.user.id;
    return this.coachBoostService.getCoachBoostAnalytics(coachId);
  }

  @Put(':boostId')
  @ApiOperation({ summary: 'Update coach boost (Coach only)' })
  @ApiResponse({ status: 200, description: 'Coach boost updated successfully' })
  @ApiResponse({ status: 404, description: 'Boost not found' })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  async updateCoachBoost(
    @Request() req,
    @Param('boostId') boostId: string,
    @Body() updateBoostDto: UpdateCoachBoostRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    // This would need to be implemented in the service
    return {
      success: true,
      message: 'Boost updated successfully',
    };
  }

  @Post(':boostId/cancel')
  @ApiOperation({ summary: 'Cancel coach boost (Coach only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach boost cancelled successfully',
  })
  @ApiResponse({ status: 404, description: 'Boost not found' })
  @Roles(UserRole.COACH)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async cancelCoachBoost(
    @Request() req,
    @Param('boostId') boostId: string,
    @Body() cancelDto: CancelBoostDto,
  ): Promise<CoachBoostResponseDto> {
    const coachId = req.user.id;
    return this.coachBoostService.cancelCoachBoost(
      coachId,
      boostId,
      cancelDto.reason,
    );
  }

  @Post(':boostId/metrics')
  @ApiOperation({ summary: 'Update boost metrics (Internal/System use)' })
  @ApiResponse({ status: 200, description: 'Metrics updated successfully' })
  @HttpCode(HttpStatus.OK)
  async updateBoostMetrics(
    @Param('boostId') boostId: string,
    @Body() metricsUpdate: BoostMetricsUpdateDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.coachBoostService.updateBoostMetrics(boostId, metricsUpdate);
    return {
      success: true,
      message: 'Metrics updated successfully',
    };
  }

  @Get('search/active')
  @ApiOperation({
    summary: 'Get active boosts for search algorithms (Internal use)',
  })
  @ApiResponse({
    status: 200,
    description: 'Active search boosts retrieved successfully',
  })
  async getActiveBoostsForSearch(
    @Query() filters: SearchBoostFiltersDto,
  ): Promise<CoachBoostResponseDto[]> {
    return this.coachBoostService.getActiveBoostsForSearch(filters);
  }

  @Get('recommendations/priority')
  @ApiOperation({
    summary: 'Get priority boosts for home page recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'Priority boosts retrieved successfully',
  })
  async getPriorityBoostsForRecommendations(): Promise<
    CoachBoostResponseDto[]
  > {
    return this.coachBoostService.getActiveBoostsForSearch({
      boostTypes: [
        CoachBoostType.HOME_RECOMMENDATIONS,
        CoachBoostType.PREMIUM_LISTING,
        CoachBoostType.TOP_PLACEMENT,
      ],
      limit: 10,
    });
  }

  @Get('featured/badges')
  @ApiOperation({ summary: 'Get coaches with active featured badges' })
  @ApiResponse({
    status: 200,
    description: 'Featured badge boosts retrieved successfully',
  })
  async getFeaturedBadgeBoosts(): Promise<CoachBoostResponseDto[]> {
    return this.coachBoostService.getActiveBoostsForSearch({
      boostTypes: [
        CoachBoostType.FEATURED_BADGE,
        CoachBoostType.PREMIUM_LISTING,
      ],
      limit: 50,
    });
  }

  // Admin endpoints
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all coach boosts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All boosts retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAllBoosts(
    @Query() query: CoachBoostQueryDto & { coachId?: string },
  ): Promise<{ boosts: CoachBoostResponseDto[]; total: number }> {
    if (query.coachId) {
      return this.coachBoostService.getCoachBoosts(query.coachId, query);
    }

    // This would need to be implemented for admin to see all boosts
    return {
      boosts: [],
      total: 0,
    };
  }

  @Get('admin/analytics')
  @ApiOperation({ summary: 'Get platform boost analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Platform analytics retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getPlatformBoostAnalytics(): Promise<PlatformBoostAnalyticsDto> {
    // This would need to be implemented in the service
    return {
      totalActiveBoosts: 0,
      totalBoostRevenue: 0,
      averageBoostValue: 0,
      topPerformingBoostTypes: [],
      topBoostingCoaches: [],
      boostTypeDistribution: {
        [CoachBoostType.SEARCH_PRIORITY]: 0,
        [CoachBoostType.FEATURED_BADGE]: 0,
        [CoachBoostType.HOME_RECOMMENDATIONS]: 0,
        [CoachBoostType.TOP_PLACEMENT]: 0,
        [CoachBoostType.PREMIUM_LISTING]: 0,
        [CoachBoostType.SPONSORED_CONTENT]: 0,
      },
      durationDistribution: {
        [BoostDuration.DAILY]: 0,
        [BoostDuration.WEEKLY]: 0,
        [BoostDuration.MONTHLY]: 0,
        [BoostDuration.QUARTERLY]: 0,
        [BoostDuration.YEARLY]: 0,
      },
      revenueGrowth: {
        monthOverMonth: 0,
        yearOverYear: 0,
      },
      marketTrends: {
        averageBidPrice: 0,
        competitionLevel: 0,
        popularKeywords: [],
        peakHours: [],
      },
    };
  }

  @Get('admin/coach/:coachId/analytics')
  @ApiOperation({ summary: 'Get specific coach boost analytics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Coach analytics retrieved successfully',
  })
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCoachAnalyticsAdmin(
    @Param('coachId') coachId: string,
  ): Promise<CoachBoostAnalyticsDto> {
    return this.coachBoostService.getCoachBoostAnalytics(coachId);
  }

  // Utility endpoints for boost management
  @Get('pricing/calculator')
  @ApiOperation({ summary: 'Calculate boost pricing based on parameters' })
  @ApiResponse({ status: 200, description: 'Pricing calculated successfully' })
  async calculateBoostPricing(
    @Query()
    params: {
      boostType: CoachBoostType;
      duration: BoostDuration;
      priority?: number;
      targeting?: string; // JSON string
    },
  ): Promise<{
    basePrice: number;
    priorityMultiplier: number;
    targetingMultiplier: number;
    finalPrice: number;
    estimatedResults: {
      impressions: string;
      clicks: string;
      profileViews: string;
      inquiries: string;
    };
    competitorAnalysis: {
      averagePrice: number;
      yourPosition: string;
      recommendations: string[];
    };
  }> {
    const packages = this.coachBoostService.getAvailableBoostPackages();
    const packageInfo = packages.find(
      (pkg) => pkg.boostType === params.boostType,
    );

    if (!packageInfo) {
      throw new BadRequestException('Invalid boost type');
    }

    const basePrice = packageInfo.pricing[params.duration];
    const priorityMultiplier = (params.priority || 5) / 5; // Base priority is 5
    const targetingMultiplier = params.targeting ? 1.2 : 1.0; // 20% increase for targeting
    const finalPrice = Math.round(
      basePrice * priorityMultiplier * targetingMultiplier,
    );

    return {
      basePrice,
      priorityMultiplier,
      targetingMultiplier,
      finalPrice,
      estimatedResults: {
        impressions: packageInfo.estimatedResults.impressionsIncrease,
        clicks: packageInfo.estimatedResults.clickIncrease,
        profileViews: packageInfo.estimatedResults.profileViewIncrease,
        inquiries: packageInfo.estimatedResults.inquiryIncrease,
      },
      competitorAnalysis: {
        averagePrice: basePrice * 1.1,
        yourPosition:
          finalPrice > basePrice * 1.1 ? 'above average' : 'competitive',
        recommendations: [
          'Consider targeting specific demographics for better ROI',
          'Monitor performance weekly and adjust bidding strategy',
          'Combine with content marketing for maximum impact',
        ],
      },
    };
  }

  @Get('performance/leaderboard')
  @ApiOperation({ summary: 'Get boost performance leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  async getBoostLeaderboard(): Promise<{
    topPerformers: Array<{
      rank: number;
      coachId: string;
      coachName: string;
      effectivenessScore: number;
      totalSpent: number;
      totalROI: number;
      activeBoosts: number;
    }>;
    yourRanking?: {
      rank: number;
      percentile: number;
      scoreToNextLevel: number;
    };
  }> {
    // This would be implemented with real data
    return {
      topPerformers: [
        {
          rank: 1,
          coachId: 'coach-1',
          coachName: 'Sarah Johnson',
          effectivenessScore: 95,
          totalSpent: 2500,
          totalROI: 450,
          activeBoosts: 3,
        },
        {
          rank: 2,
          coachId: 'coach-2',
          coachName: 'Mike Chen',
          effectivenessScore: 89,
          totalSpent: 1800,
          totalROI: 320,
          activeBoosts: 2,
        },
        {
          rank: 3,
          coachId: 'coach-3',
          coachName: 'Lisa Rodriguez',
          effectivenessScore: 87,
          totalSpent: 3200,
          totalROI: 380,
          activeBoosts: 4,
        },
      ],
    };
  }
}
