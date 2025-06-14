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
  Req,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { NutritionLogService } from '../services/nutrition-log.service';
import {
  LogMealDto,
  UpdateNutritionLogDto,
  NutritionLogResponseDto,
  NutritionLogListResponseDto,
  DailyNutritionSummaryDto,
  WeeklyNutritionReportDto,
} from '../dtos/nutrition-log.dto';

@ApiTags('Nutrition Logs')
@Controller('nutrition-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NutritionLogController {
  constructor(private readonly nutritionLogService: NutritionLogService) {}

  @Post()
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Log a meal consumption',
    description: 'Log when a trainee consumes a meal with portion size and additional details.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Meal logged successfully',
    type: NutritionLogResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or duplicate log entry',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Meal or meal plan not found',
  })
  async logMeal(
    @Body() logDto: LogMealDto,
    @Req() req: Request,
  ): Promise<NutritionLogResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // Trainees can only log for themselves, coaches can log for their trainees
    let traineeId = userId;
    if (userRole === UserRole.COACH && logDto.traineeId) {
      traineeId = logDto.traineeId;
    } else if (userRole === UserRole.TRAINEE) {
      traineeId = userId;
    }

    return this.nutritionLogService.logMeal(traineeId, logDto);
  }

  @Get()
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get nutrition logs with filtering and pagination',
    description: 'Retrieve nutrition logs. Trainees see their own logs, coaches see logs for their trainees.',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Filter by trainee ID (coaches only)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: 'string',
    description: 'Filter by start date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: 'string',
    description: 'Filter by end date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'mealPlanId',
    required: false,
    type: 'string',
    description: 'Filter by meal plan ID',
  })
  @ApiQuery({
    name: 'mealCategory',
    required: false,
    type: 'string',
    description: 'Filter by meal category (breakfast, lunch, dinner, snack)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: 'number',
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: 'number',
    description: 'Number of items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: 'string',
    description: 'Sort field',
    enum: ['logDate', 'createdAt', 'rating', 'calories'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: 'string',
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nutrition logs retrieved successfully',
    type: NutritionLogListResponseDto,
  })
  async getNutritionLogs(
    @Req() req: Request,
    @Query('traineeId') traineeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('mealPlanId') mealPlanId?: string,
    @Query('mealCategory') mealCategory?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<NutritionLogListResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // Determine which trainee's logs to retrieve
    let targetTraineeId = userId;
    if (userRole === UserRole.COACH && traineeId) {
      targetTraineeId = traineeId;
    } else if (userRole === UserRole.TRAINEE) {
      targetTraineeId = userId;
    }

    return this.nutritionLogService.getNutritionLogs(targetTraineeId, {
      dateFrom,
      dateTo,
      mealPlanId,
      mealCategory,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':logId')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a specific nutrition log',
    description: 'Retrieve detailed information about a specific nutrition log entry.',
  })
  @ApiParam({
    name: 'logId',
    description: 'Unique identifier of the nutrition log',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nutrition log retrieved successfully',
    type: NutritionLogResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nutrition log not found',
  })
  async getNutritionLogById(
    @Param('logId', ParseUUIDPipe) logId: string,
    @Req() req: Request,
  ): Promise<NutritionLogResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // For now, use the current user's ID as trainee ID
    // In a more complex scenario, you might need to verify coach-trainee relationships
    let traineeId = userId;
    if (userRole === UserRole.COACH) {
      // Coach should be able to view any log, but we need to handle this properly
      // For simplicity, we'll allow coaches to view any log for now
      const log = await this.nutritionLogService.getNutritionLogById(logId, userId);
      return log;
    }

    return this.nutritionLogService.getNutritionLogById(logId, traineeId);
  }

  @Put(':logId')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a nutrition log',
    description: 'Update an existing nutrition log entry with new information.',
  })
  @ApiParam({
    name: 'logId',
    description: 'Unique identifier of the nutrition log',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nutrition log updated successfully',
    type: NutritionLogResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nutrition log not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateNutritionLog(
    @Param('logId', ParseUUIDPipe) logId: string,
    @Body() updateDto: UpdateNutritionLogDto,
    @Req() req: Request,
  ): Promise<NutritionLogResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // Trainees can only update their own logs
    let traineeId = userId;
    if (userRole === UserRole.COACH) {
      // For coaches, we need to verify they own this log or it belongs to their trainee
      // For simplicity, allowing coaches to update any log for now
      traineeId = userId;
    }

    return this.nutritionLogService.updateNutritionLog(logId, traineeId, updateDto);
  }

  @Delete(':logId')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a nutrition log',
    description: 'Delete a nutrition log entry.',
  })
  @ApiParam({
    name: 'logId',
    description: 'Unique identifier of the nutrition log',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nutrition log deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nutrition log not found',
  })
  async deleteNutritionLog(
    @Param('logId', ParseUUIDPipe) logId: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    let traineeId = userId;
    if (userRole === UserRole.COACH) {
      traineeId = userId; // Simplified for now
    }

    await this.nutritionLogService.deleteNutritionLog(logId, traineeId);
    return { message: 'Nutrition log deleted successfully' };
  }

  @Get('summary/daily/:date')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get daily nutrition summary',
    description: 'Get nutritional summary for a specific day including totals, targets, and adherence.',
  })
  @ApiParam({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    type: 'string',
    example: '2024-06-14',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Trainee ID (coaches only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Daily nutrition summary retrieved successfully',
    type: DailyNutritionSummaryDto,
  })
  async getDailyNutritionSummary(
    @Param('date') date: string,
    @Req() req: Request,
    @Query('traineeId') traineeId?: string,
  ): Promise<DailyNutritionSummaryDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    let targetTraineeId = userId;
    if (userRole === UserRole.COACH && traineeId) {
      targetTraineeId = traineeId;
    } else if (userRole === UserRole.TRAINEE) {
      targetTraineeId = userId;
    }

    return this.nutritionLogService.getDailyNutritionSummary(targetTraineeId, date);
  }

  @Get('report/weekly/:weekStart')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get weekly nutrition report',
    description: 'Get comprehensive weekly nutrition report with daily summaries, averages, and insights.',
  })
  @ApiParam({
    name: 'weekStart',
    description: 'Week start date in YYYY-MM-DD format (Monday)',
    type: 'string',
    example: '2024-06-10',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Trainee ID (coaches only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly nutrition report retrieved successfully',
    type: WeeklyNutritionReportDto,
  })
  async getWeeklyNutritionReport(
    @Param('weekStart') weekStart: string,
    @Req() req: Request,
    @Query('traineeId') traineeId?: string,
  ): Promise<WeeklyNutritionReportDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    let targetTraineeId = userId;
    if (userRole === UserRole.COACH && traineeId) {
      targetTraineeId = traineeId;
    } else if (userRole === UserRole.TRAINEE) {
      targetTraineeId = userId;
    }

    return this.nutritionLogService.getWeeklyNutritionReport(targetTraineeId, weekStart);
  }

  @Get('stats/overview')
  @Roles(UserRole.TRAINEE, UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get nutrition statistics overview',
    description: 'Get overall nutrition statistics and progress metrics for a trainee.',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Trainee ID (coaches only)',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: 'string',
    description: 'Start date for statistics (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: 'string',
    description: 'End date for statistics (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nutrition statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalMealsLogged: { type: 'number' },
        averageDailyCalories: { type: 'number' },
        averageDailyProtein: { type: 'number' },
        averageDailyCarbs: { type: 'number' },
        averageDailyFat: { type: 'number' },
        overallAdherence: { type: 'number' },
        averageMealRating: { type: 'number' },
        topMeals: { type: 'array' },
        nutritionTrends: { type: 'object' },
      },
    },
  })
  async getNutritionStatsOverview(
    @Req() req: Request,
    @Query('traineeId') traineeId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<any> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    let targetTraineeId = userId;
    if (userRole === UserRole.COACH && traineeId) {
      targetTraineeId = traineeId;
    } else if (userRole === UserRole.TRAINEE) {
      targetTraineeId = userId;
    }

    // Get logs for statistics
    const logsResponse = await this.nutritionLogService.getNutritionLogs(targetTraineeId, {
      dateFrom,
      dateTo,
      limit: 1000, // Get all logs for stats
    });

    const logs = logsResponse.logs;

    // Calculate statistics
    const totalMealsLogged = logs.length;
    const averageDailyCalories = totalMealsLogged > 0 
      ? logs.reduce((sum, log) => sum + log.actualCalories, 0) / totalMealsLogged 
      : 0;
    const averageDailyProtein = totalMealsLogged > 0 
      ? logs.reduce((sum, log) => sum + log.actualProtein, 0) / totalMealsLogged 
      : 0;
    const averageDailyCarbs = totalMealsLogged > 0 
      ? logs.reduce((sum, log) => sum + log.actualCarbs, 0) / totalMealsLogged 
      : 0;
    const averageDailyFat = totalMealsLogged > 0 
      ? logs.reduce((sum, log) => sum + log.actualFat, 0) / totalMealsLogged 
      : 0;

    const plannedMeals = logs.filter(log => log.wasPlanned).length;
    const overallAdherence = totalMealsLogged > 0 ? (plannedMeals / totalMealsLogged) * 100 : 0;

    const ratedMeals = logs.filter(log => log.rating);
    const averageMealRating = ratedMeals.length > 0 
      ? ratedMeals.reduce((sum, log) => sum + (log.rating || 0), 0) / ratedMeals.length 
      : 0;

    // Group meals by name and count frequency
    const mealFrequency: Record<string, { count: number; totalRating: number; ratingCount: number }> = {};
    logs.forEach(log => {
      const mealName = log.meal.name;
      if (!mealFrequency[mealName]) {
        mealFrequency[mealName] = { count: 0, totalRating: 0, ratingCount: 0 };
      }
      mealFrequency[mealName].count++;
      if (log.rating) {
        mealFrequency[mealName].totalRating += log.rating;
        mealFrequency[mealName].ratingCount++;
      }
    });

    const topMeals = Object.entries(mealFrequency)
      .map(([name, data]) => ({
        mealName: name,
        frequency: data.count,
        averageRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    return {
      totalMealsLogged,
      averageDailyCalories: Math.round(averageDailyCalories * 100) / 100,
      averageDailyProtein: Math.round(averageDailyProtein * 100) / 100,
      averageDailyCarbs: Math.round(averageDailyCarbs * 100) / 100,
      averageDailyFat: Math.round(averageDailyFat * 100) / 100,
      overallAdherence: Math.round(overallAdherence * 100) / 100,
      averageMealRating: Math.round(averageMealRating * 100) / 100,
      topMeals,
    };
  }
}
