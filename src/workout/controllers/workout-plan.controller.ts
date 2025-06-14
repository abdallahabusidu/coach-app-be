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
import { WorkoutPlanService } from '../services/workout-plan.service';
import {
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
  AssignWorkoutPlanDto,
  WorkoutPlanResponseDto,
  WorkoutPlanListResponseDto,
} from '../dtos/workout-plan.dto';
import { WorkoutPlanType, PlanStatus } from '../entities/workout-plan.entity';

@ApiTags('Workout Plans')
@Controller('workout-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkoutPlanController {
  constructor(private readonly workoutPlanService: WorkoutPlanService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new workout plan',
    description:
      'Create a comprehensive workout plan with weekly schedules, goals, and progression tracking.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workout plan created successfully',
    type: WorkoutPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Coach role required',
  })
  async createWorkoutPlan(
    @Body() createDto: CreateWorkoutPlanDto,
    @Req() req: Request,
  ): Promise<WorkoutPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.workoutPlanService.createWorkoutPlan(coachId, createDto);
  }

  @Get()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get workout plans with filtering and pagination',
    description:
      'Retrieve workout plans created by the coach with optional filtering by type, status, trainee, etc.',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: WorkoutPlanType,
    description: 'Filter by workout plan type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PlanStatus,
    description: 'Filter by plan status',
  })
  @ApiQuery({
    name: 'isTemplate',
    required: false,
    type: 'boolean',
    description: 'Filter by template status',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    type: 'string',
    description: 'Filter by assigned trainee',
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
    enum: ['name', 'createdAt', 'usageCount', 'averageRating'],
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
    description: 'Workout plans retrieved successfully',
    type: WorkoutPlanListResponseDto,
  })
  async getWorkoutPlans(
    @Req() req: Request,
    @Query('planType') planType?: WorkoutPlanType,
    @Query('status') status?: PlanStatus,
    @Query('isTemplate') isTemplate?: boolean,
    @Query('traineeId') traineeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<WorkoutPlanListResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.workoutPlanService.getWorkoutPlans(coachId, {
      planType,
      status,
      isTemplate,
      traineeId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':planId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get a specific workout plan',
    description: 'Retrieve detailed information about a specific workout plan.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the workout plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout plan retrieved successfully',
    type: WorkoutPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout plan not found',
  })
  async getWorkoutPlanById(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: Request,
  ): Promise<WorkoutPlanResponseDto> {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    // For coaches, use their coach profile ID
    let coachId = userId;
    if (userRole === UserRole.COACH) {
      coachId = (req.user as any).coachProfile?.id || userId;
    }

    return this.workoutPlanService.getWorkoutPlanById(planId, coachId);
  }

  @Put(':planId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update a workout plan',
    description: 'Update an existing workout plan with new information.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the workout plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout plan updated successfully',
    type: WorkoutPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout plan not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async updateWorkoutPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() updateDto: UpdateWorkoutPlanDto,
    @Req() req: Request,
  ): Promise<WorkoutPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.workoutPlanService.updateWorkoutPlan(
      planId,
      coachId,
      updateDto,
    );
  }

  @Delete(':planId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a workout plan',
    description:
      'Delete a workout plan. Can only delete plans that are not currently assigned to trainees.',
  })
  @ApiParam({
    name: 'planId',
    description: 'Unique identifier of the workout plan',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workout plan deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout plan not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete a plan that is currently assigned',
  })
  async deleteWorkoutPlan(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    await this.workoutPlanService.deleteWorkoutPlan(planId, coachId);
    return { message: 'Workout plan deleted successfully' };
  }

  @Post('assign')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Assign a workout plan to a trainee',
    description:
      'Assign an existing workout plan to a specific trainee with optional customizations.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workout plan assigned successfully',
    type: WorkoutPlanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Workout plan or trainee not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Trainee already has an active assignment for this plan',
  })
  async assignWorkoutPlan(
    @Body() assignDto: AssignWorkoutPlanDto,
    @Req() req: Request,
  ): Promise<WorkoutPlanResponseDto> {
    const coachId = (req.user as any).coachProfile?.id || (req.user as any).id;
    return this.workoutPlanService.assignWorkoutPlan(coachId, assignDto);
  }

  @Get('trainee/:traineeId')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get workout plans assigned to a specific trainee',
    description:
      'Retrieve all active workout plans assigned to a specific trainee.',
  })
  @ApiParam({
    name: 'traineeId',
    description: 'Unique identifier of the trainee',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trainee workout plans retrieved successfully',
    type: WorkoutPlanListResponseDto,
  })
  async getTraineeWorkoutPlans(
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Req() req: Request,
  ): Promise<WorkoutPlanListResponseDto> {
    const userRole = (req.user as any).role;
    const userId = (req.user as any).id;

    // If trainee is accessing their own plans
    if (userRole === UserRole.TRAINEE && userId === traineeId) {
      return this.workoutPlanService.getTraineeWorkoutPlans(traineeId);
    }

    // If coach is accessing trainee plans, filter by coach
    if (userRole === UserRole.COACH) {
      const coachId = (req.user as any).coachProfile?.id || userId;
      return this.workoutPlanService.getTraineeWorkoutPlans(traineeId, coachId);
    }

    // Admin can access all
    if (userRole === UserRole.ADMIN) {
      return this.workoutPlanService.getTraineeWorkoutPlans(traineeId);
    }

    throw new Error('Unauthorized access');
  }

  @Get('templates/public')
  @Roles(UserRole.COACH, UserRole.TRAINEE, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get public workout plan templates',
    description:
      'Retrieve public workout plan templates that can be used as starting points for new plans.',
  })
  @ApiQuery({
    name: 'planType',
    required: false,
    enum: WorkoutPlanType,
    description: 'Filter by workout plan type',
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Public templates retrieved successfully',
    type: WorkoutPlanListResponseDto,
  })
  async getPublicTemplates(
    @Req() req: Request,
    @Query('planType') planType?: WorkoutPlanType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<WorkoutPlanListResponseDto> {
    // This would be a separate method to get public templates
    // For now, we'll use the existing method with isTemplate filter
    const userId = (req.user as any).id;
    return this.workoutPlanService.getWorkoutPlans(userId, {
      planType,
      isTemplate: true,
      page,
      limit,
      sortBy: 'usageCount',
      sortOrder: 'DESC',
    });
  }
}
