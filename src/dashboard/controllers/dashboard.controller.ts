import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  Redirect,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DailyQuoteService } from '../services/daily-quote.service';
import { DashboardStatsService } from '../services/dashboard-stats.service';
import { CreateQuoteDto } from '../dtos/create-quote.dto';
import { UpdateTraineeProgressDto } from '../dtos/update-trainee-progress.dto';
import {
  DashboardWelcomeResponseDto,
  DashboardStatsResponseDto,
  TraineeListResponseDto,
  QuoteStatsResponseDto,
} from '../dtos/dashboard-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CoachService } from '../../coach/services/coach.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dailyQuoteService: DailyQuoteService,
    private readonly dashboardStatsService: DashboardStatsService,
    private readonly coachService: CoachService,
  ) {}

  @Get('welcome')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get daily welcome message with quote',
    description:
      'Retrieve the daily motivational quote and personalized welcome message for coaches.',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message and quote retrieved successfully',
    type: DashboardWelcomeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Coach authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Coach role required',
  })
  async getWelcomeMessage(
    @CurrentUser() user,
  ): Promise<DashboardWelcomeResponseDto> {
    const quote = await this.dailyQuoteService.getDailyQuote();

    // Get coach profile for personalization
    let coachName = 'Coach';
    try {
      const coachProfile = await this.coachService.findByUserId(user.id);
      coachName = user.firstName || 'Coach';
    } catch (error) {
      // Use default if coach profile not found
    }

    const currentHour = new Date().getHours();
    let greeting = 'Hello';

    if (currentHour < 12) {
      greeting = 'Good morning';
    } else if (currentHour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    const welcomeMessage = `${greeting}, ${coachName}! Ready to inspire your trainees today?`;
    const date = new Date().toISOString().split('T')[0];

    return {
      quote,
      welcomeMessage,
      date,
    };
  }

  @Get('stats')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve comprehensive dashboard statistics including trainee counts, messages, and growth metrics.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Coach authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Coach role required',
  })
  async getDashboardStats(
    @CurrentUser() user,
  ): Promise<DashboardStatsResponseDto> {
    // Get coach profile to get coach ID
    const coachProfile = await this.coachService.findByUserId(user.id);
    return await this.dashboardStatsService.getDashboardStats(coachProfile.id);
  }

  @Get('trainees')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get trainee list with progress',
    description:
      'Retrieve a paginated list of trainees with their progress data and recent activity.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Trainee list retrieved successfully',
    type: TraineeListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Coach authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Coach role required',
  })
  async getTrainees(
    @CurrentUser() user,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<TraineeListResponseDto> {
    const coachProfile = await this.coachService.findByUserId(user.id);
    const offset = (page - 1) * limit;

    const { trainees, total } =
      await this.dashboardStatsService.getTraineesWithProgress(
        coachProfile.id,
        limit,
        offset,
      );

    // Get recent activity for each trainee
    const traineesWithActivity = await Promise.all(
      trainees.map(async (trainee) => {
        const recentActivity =
          await this.dashboardStatsService.getTraineeRecentActivity(
            trainee.traineeId,
          );
        return {
          trainee,
          recentActivity,
        };
      }),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      trainees: traineesWithActivity,
      total,
      page,
      limit,
      totalPages,
    };
  }

  @Patch('trainees/:traineeId/progress')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update trainee progress',
    description: 'Update progress data for a specific trainee.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'ID of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Trainee progress updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Coach authentication required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Coach role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Trainee not found',
  })
  async updateTraineeProgress(
    @CurrentUser() user,
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Body() updateDto: UpdateTraineeProgressDto,
  ) {
    const coachProfile = await this.coachService.findByUserId(user.id);

    const updatedProgress =
      await this.dashboardStatsService.updateTraineeProgress(
        traineeId,
        coachProfile.id,
        updateDto,
      );

    return {
      message: 'Trainee progress updated successfully',
      progress: updatedProgress,
    };
  }

  @Get('boost-visibility')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Redirect to boost visibility page',
    description: 'Redirect coaches to the boost visibility feature page.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to boost visibility page',
  })
  @Redirect()
  boostVisibility() {
    // In a real application, this would redirect to your boost visibility page
    return {
      url: '/boost-visibility',
      statusCode: 302,
    };
  }

  // Quote Management Endpoints (for admin/coach management)
  @Get('quotes')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all quotes',
    description:
      'Retrieve all quotes with statistics (admin/management feature).',
  })
  @ApiResponse({
    status: 200,
    description: 'Quotes retrieved successfully',
  })
  async getAllQuotes() {
    const quotes = await this.dailyQuoteService.getAllQuotes();
    return { quotes };
  }

  @Get('quotes/stats')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get quote statistics',
    description:
      'Retrieve statistics about quotes including category distribution and most served quotes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote statistics retrieved successfully',
    type: QuoteStatsResponseDto,
  })
  async getQuoteStats(): Promise<QuoteStatsResponseDto> {
    return await this.dailyQuoteService.getQuoteStatistics();
  }

  @Post('quotes')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new quote',
    description: 'Add a new motivational quote to the database (admin only).',
  })
  @ApiResponse({
    status: 201,
    description: 'Quote created successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  async createQuote(@Body() createQuoteDto: CreateQuoteDto) {
    const quote = await this.dailyQuoteService.createQuote(createQuoteDto);
    return {
      message: 'Quote created successfully',
      quote,
    };
  }

  @Patch('quotes/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a quote',
    description: 'Update an existing quote (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the quote',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async updateQuote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateQuoteDto>,
  ) {
    const quote = await this.dailyQuoteService.updateQuote(id, updateDto);
    return {
      message: 'Quote updated successfully',
      quote,
    };
  }

  @Delete('quotes/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a quote',
    description: 'Delete a quote from the database (admin only).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the quote',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Quote deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required',
  })
  @ApiResponse({
    status: 404,
    description: 'Quote not found',
  })
  async deleteQuote(@Param('id', ParseUUIDPipe) id: string) {
    await this.dailyQuoteService.deleteQuote(id);
    return {
      message: 'Quote deleted successfully',
    };
  }
}
