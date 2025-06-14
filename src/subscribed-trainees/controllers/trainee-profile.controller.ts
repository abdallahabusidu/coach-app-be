import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  MonthlyTransformationDto,
  TodayProgressDto,
  TraineeProfileDto,
  UpdateTraineeProfileDto,
  WeeklyReportDto,
} from '../dtos/trainee-profile.dto';
import { TraineeProfileService } from '../services/trainee-profile.service';

@ApiTags('Trainee Profile')
@Controller('trainee-profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TraineeProfileController {
  constructor(private readonly traineeProfileService: TraineeProfileService) {}

  @Get(':traineeId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get complete trainee profile',
    description:
      'Retrieve comprehensive trainee profile information from coach perspective including personal details, fitness goals, subscription info, and progress.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainee profile retrieved successfully',
    type: TraineeProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed to your coaching',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Coach role required',
  })
  async getTraineeProfile(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
  ): Promise<TraineeProfileDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.traineeProfileService.getTraineeProfile(traineeId, coachId);
  }

  @Get(':traineeId/today-progress')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: "Get today's progress for trainee",
    description:
      "Retrieve trainee's progress for today including meals, gym workouts, cardio, and hydration tracking.",
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Today's progress retrieved successfully",
    type: TodayProgressDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed to your coaching',
  })
  async getTodayProgress(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
  ): Promise<TodayProgressDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.traineeProfileService.getTodayProgress(traineeId, coachId);
  }

  @Get(':traineeId/transformations/:year/:month')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get trainee transformations for a specific month',
    description:
      'Retrieve trainee transformation records including weight changes, measurements, and progress photos for a specific month.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'year',
    description: 'Year for transformation data',
    type: 'number',
    example: 2025,
  })
  @ApiParam({
    name: 'month',
    description: 'Month for transformation data (1-12)',
    type: 'number',
    example: 6,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Monthly transformations retrieved successfully',
    type: MonthlyTransformationDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed to your coaching',
  })
  async getTraineeTransformations(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Req() req: Request,
  ): Promise<MonthlyTransformationDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.traineeProfileService.getTraineeTransformations(
      traineeId,
      coachId,
      year,
      month,
    );
  }

  @Get(':traineeId/weekly-report')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get weekly report for trainee',
    description:
      'Generate comprehensive weekly report including daily breakdown, goals achievement, and areas for improvement.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiQuery({
    name: 'weekStart',
    description: 'Start date of the week (YYYY-MM-DD format)',
    type: 'string',
    example: '2025-06-16',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Weekly report generated successfully',
    type: WeeklyReportDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed to your coaching',
  })
  async getWeeklyReport(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
    @Query('weekStart') weekStart?: string,
  ): Promise<WeeklyReportDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;

    // If no weekStart provided, use current week
    let startDate: Date;
    if (weekStart) {
      startDate = new Date(weekStart);
    } else {
      // Get start of current week (Monday)
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      startDate = new Date(today.setDate(diff));
    }

    return this.traineeProfileService.getWeeklyReport(
      traineeId,
      coachId,
      startDate,
    );
  }

  @Put(':traineeId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update trainee profile information',
    description:
      'Update trainee profile information such as target weight, body fat, coach notes, and assigned plans.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainee profile updated successfully',
    type: TraineeProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Trainee not found or not subscribed to your coaching',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateTraineeProfile(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Body() updateDto: UpdateTraineeProfileDto,
    @Req() req: Request,
  ): Promise<TraineeProfileDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.traineeProfileService.updateTraineeProfile(
      traineeId,
      coachId,
      updateDto,
    );
  }

  @Get(':traineeId/calendar-transformations/:year')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get yearly transformation calendar',
    description:
      'Retrieve transformation data organized by months for a full year to display in calendar format.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'year',
    description: 'Year for transformation calendar',
    type: 'number',
    example: 2025,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Yearly transformation calendar retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        year: { type: 'number' },
        months: {
          type: 'object',
          description: 'Transformation data organized by month (1-12)',
          additionalProperties: {
            type: 'object',
            properties: {
              transformationCount: { type: 'number' },
              hasData: { type: 'boolean' },
              weightChange: { type: 'number' },
              milestonesCount: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getYearlyTransformationCalendar(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Param('year', ParseIntPipe) year: number,
    @Req() req: Request,
  ): Promise<any> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;

    const months: Record<string, any> = {};

    // Get transformation data for each month
    for (let month = 1; month <= 12; month++) {
      try {
        const monthlyData =
          await this.traineeProfileService.getTraineeTransformations(
            traineeId,
            coachId,
            year,
            month,
          );

        months[month] = {
          transformationCount: monthlyData.summary.totalRecords,
          hasData: monthlyData.summary.totalRecords > 0,
          weightChange: monthlyData.summary.weightChange || 0,
          milestonesCount: monthlyData.summary.milestonesAchieved,
        };
      } catch (error) {
        // Month with no data
        months[month] = {
          transformationCount: 0,
          hasData: false,
          weightChange: 0,
          milestonesCount: 0,
        };
      }
    }

    return {
      year,
      months,
    };
  }
}
