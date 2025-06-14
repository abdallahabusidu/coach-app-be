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
import { WorkoutSessionService } from '../services/workout-session.service';
import {
  CreateWorkoutSessionDto,
  UpdateWorkoutSessionDto,
  CompleteWorkoutSessionDto,
  AddCoachFeedbackDto,
  WorkoutSessionResponseDto,
  WorkoutSessionListResponseDto,
  WorkoutSessionFilterDto,
} from '../dtos/workout-session.dto';
import { SessionStatus } from '../entities/workout-session.entity';

@ApiTags('Workout Sessions')
@Controller('workout-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkoutSessionController {
  constructor(private readonly workoutSessionService: WorkoutSessionService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create/Schedule a new workout session',
    description:
      'Schedule a workout session for a trainee. Coaches can schedule for their trainees, trainees can schedule for themselves.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workout session created successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout or workout plan not found',
  })
  async createWorkoutSession(
    @Body() createDto: CreateWorkoutSessionDto,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.createWorkoutSession(userId, createDto);
  }

  @Get()
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get workout sessions with filtering and pagination',
    description:
      'Retrieve workout sessions. Coaches see sessions for their trainees, trainees see their own sessions.',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Filter by trainee ID (coaches only)',
  })
  @ApiQuery({
    name: 'workoutPlanId',
    required: false,
    type: 'string',
    description: 'Filter by workout plan ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SessionStatus,
    description: 'Filter by session status',
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
    enum: ['scheduledAt', 'completedAt', 'sessionRating', 'createdAt'],
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
    description: 'Workout sessions retrieved successfully',
    type: WorkoutSessionListResponseDto,
  })
  async getWorkoutSessions(
    @Req() req: Request,
    @Query() filters: WorkoutSessionFilterDto,
  ): Promise<WorkoutSessionListResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    return this.workoutSessionService.getWorkoutSessions(
      userId,
      userRole,
      filters,
    );
  }

  @Get(':sessionId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a specific workout session',
    description:
      'Retrieve detailed information about a specific workout session.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the workout session',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout session retrieved successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to view this session',
  })
  async getWorkoutSessionById(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.getWorkoutSessionById(sessionId, userId);
  }

  @Post(':sessionId/start')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Start a workout session',
    description:
      'Mark a scheduled workout session as started and begin tracking.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the workout session',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout session started successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot start session with current status',
  })
  async startWorkoutSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.startWorkoutSession(sessionId, userId);
  }

  @Put(':sessionId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a workout session',
    description:
      'Update workout session details including exercise data, ratings, and notes.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the workout session',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout session updated successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateWorkoutSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() updateDto: UpdateWorkoutSessionDto,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.updateWorkoutSession(
      sessionId,
      userId,
      updateDto,
    );
  }

  @Post('complete')
  @Roles(UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Complete a workout session',
    description:
      'Mark a workout session as completed with final exercise data and feedback.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout session completed successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session is already completed or invalid data',
  })
  async completeWorkoutSession(
    @Body() completeDto: CompleteWorkoutSessionDto,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.completeWorkoutSession(
      userId,
      completeDto,
    );
  }

  @Post('coach-feedback')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add coach feedback to a session',
    description: 'Add coach feedback and notes to a completed workout session.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coach feedback added successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to add feedback to this session',
  })
  async addCoachFeedback(
    @Body() feedbackDto: AddCoachFeedbackDto,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.workoutSessionService.addCoachFeedback(coachId, feedbackDto);
  }

  @Delete(':sessionId/cancel')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Cancel a workout session',
    description: 'Cancel a scheduled or in-progress workout session.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Unique identifier of the workout session',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout session cancelled successfully',
    type: WorkoutSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel a completed session',
  })
  async cancelWorkoutSession(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Req() req: Request,
  ): Promise<WorkoutSessionResponseDto> {
    const userId = (req.user as any).id;
    return this.workoutSessionService.cancelWorkoutSession(sessionId, userId);
  }

  @Get('trainee/:traineeId/stats')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get workout statistics for a trainee',
    description:
      'Retrieve workout session statistics and progress metrics for a specific trainee.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
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
    description: 'Workout statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSessions: { type: 'number' },
        completedSessions: { type: 'number' },
        completionRate: { type: 'number' },
        averageRating: { type: 'number' },
        totalCaloriesBurned: { type: 'number' },
        averageSessionDuration: { type: 'number' },
        workoutTypeBreakdown: { type: 'object' },
        weeklyProgress: { type: 'array' },
      },
    },
  })
  async getTraineeWorkoutStats(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<any> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // Verify permission
    if (userRole === UserRole.TRAINEE && userId !== traineeId) {
      throw new Error('Forbidden: Cannot access other trainee statistics');
    }

    // Get sessions for statistics
    const filters = {
      traineeId,
      dateFrom,
      dateTo,
      limit: 1000, // Get all sessions for stats
    };

    const sessionsResponse =
      await this.workoutSessionService.getWorkoutSessions(
        userId,
        userRole,
        filters,
      );

    const sessions = sessionsResponse.sessions;

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === SessionStatus.COMPLETED,
    ).length;
    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const ratingsSum = sessions
      .filter((s) => s.sessionRating)
      .reduce((sum, s) => sum + (s.sessionRating || 0), 0);
    const ratedSessions = sessions.filter((s) => s.sessionRating).length;
    const averageRating = ratedSessions > 0 ? ratingsSum / ratedSessions : 0;

    const totalCaloriesBurned = sessions
      .filter((s) => s.caloriesBurned)
      .reduce((sum, s) => sum + (s.caloriesBurned || 0), 0);

    const durationsSum = sessions
      .filter((s) => s.actualDuration)
      .reduce((sum, s) => sum + (s.actualDuration || 0), 0);
    const sessionsWithDuration = sessions.filter(
      (s) => s.actualDuration,
    ).length;
    const averageSessionDuration =
      sessionsWithDuration > 0 ? durationsSum / sessionsWithDuration : 0;

    // Workout type breakdown
    const workoutTypeBreakdown: Record<string, number> = {};
    sessions.forEach((session) => {
      const type = session.workout.workoutType;
      workoutTypeBreakdown[type] = (workoutTypeBreakdown[type] || 0) + 1;
    });

    return {
      totalSessions,
      completedSessions,
      completionRate: Math.round(completionRate * 100) / 100,
      averageRating: Math.round(averageRating * 100) / 100,
      totalCaloriesBurned,
      averageSessionDuration: Math.round(averageSessionDuration * 100) / 100,
      workoutTypeBreakdown,
    };
  }
}
