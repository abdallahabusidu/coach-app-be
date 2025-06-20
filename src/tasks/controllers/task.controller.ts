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
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  ParseEnumPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { TaskService } from '../services/task.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskResponseDto,
  TaskListResponseDto,
  TaskSummaryDto,
} from '../dtos/task.dto';
import {
  CreateTaskSubmissionDto,
  UpdateTaskSubmissionDto,
  ReviewSubmissionDto,
  TaskSubmissionResponseDto,
  TaskSubmissionListResponseDto,
  QuickTaskSubmissionDto,
  BulkTaskActionDto,
} from '../dtos/task-submission.dto';
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskFrequency,
} from '../entities/task.entity';
import { SubmissionStatus } from '../entities/task-submission.entity';
import {
  ApiCreateResponses,
  ApiCrudResponses,
  ApiUpdateResponses,
  ApiDeleteResponses,
  ApiPaginatedResponse,
  ApiStandardErrorResponses,
} from '../../common/decorators/api-responses.decorator';
import { PaginationSortingQueryDto } from '../../common/dtos/common-response.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * Create a new task (Coach only)
   */
  @Post()
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Create a new task',
    description:
      'Create a new task and assign it to a trainee. Only coaches can create tasks.',
  })
  @ApiResponse({
    status: 201,
    description: 'Task created successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid task data' })
  @ApiResponse({ status: 404, description: 'Trainee not found' })
  async createTask(
    @Request() req: any,
    @Body() createDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.createTask(req.user.id, createDto);
  }

  /**
   * Get tasks with filtering and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get tasks',
    description:
      'Get tasks with optional filtering and pagination. Coaches see all their tasks, trainees see only their assigned tasks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks retrieved successfully',
    type: TaskListResponseDto,
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    description: 'Filter by trainee ID (coach only)',
  })
  @ApiQuery({
    name: 'taskType',
    required: false,
    enum: TaskType,
    description: 'Filter by task type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaskStatus,
    description: 'Filter by task status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: TaskPriority,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'frequency',
    required: false,
    enum: TaskFrequency,
    description: 'Filter by frequency',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags',
  })
  @ApiQuery({
    name: 'dueDateFrom',
    required: false,
    description: 'Filter by due date from (ISO date)',
  })
  @ApiQuery({
    name: 'dueDateTo',
    required: false,
    description: 'Filter by due date to (ISO date)',
  })
  @ApiQuery({
    name: 'isOverdue',
    required: false,
    type: Boolean,
    description: 'Filter overdue tasks',
  })
  @ApiQuery({
    name: 'requiresApproval',
    required: false,
    type: Boolean,
    description: 'Filter tasks requiring approval',
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
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (title, dueDate, priority, status, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
  })
  async getTasks(
    @Request() req: any,
    @Query('traineeId') traineeId?: string,
    @Query('taskType') taskType?: TaskType,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('frequency') frequency?: TaskFrequency,
    @Query('tags') tags?: string | string[],
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('isOverdue') isOverdue?: boolean,
    @Query('requiresApproval') requiresApproval?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<TaskListResponseDto> {
    // Parse tags array if it's a string
    const parsedTags = typeof tags === 'string' ? [tags] : tags;

    return this.taskService.getTasks(req.user.id, req.user.role, {
      traineeId,
      taskType,
      status,
      priority,
      frequency,
      tags: parsedTags,
      dueDateFrom,
      dueDateTo,
      isOverdue,
      requiresApproval,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  /**
   * Get task by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get task by ID',
    description: 'Get detailed information about a specific task.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task retrieved successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTaskById(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) taskId: string,
  ): Promise<TaskResponseDto> {
    return this.taskService.getTaskById(taskId, req.user.id, req.user.role);
  }

  /**
   * Update a task (Coach only)
   */
  @Put(':id')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Update a task',
    description:
      'Update an existing task. Only the coach who created the task can update it.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({
    status: 200,
    description: 'Task updated successfully',
    type: TaskResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this task',
  })
  async updateTask(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) taskId: string,
    @Body() updateDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.taskService.updateTask(taskId, req.user.id, updateDto);
  }

  /**
   * Delete a task (Coach only)
   */
  @Delete(':id')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Delete a task',
    description:
      'Delete a task. Only the coach who created the task can delete it. Tasks with submissions cannot be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete task with submissions',
  })
  async deleteTask(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    return this.taskService.deleteTask(taskId, req.user.id);
  }

  /**
   * Submit a task (Trainee only)
   */
  @Post('submit')
  @Roles(UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Submit a task',
    description:
      'Submit a task completion with detailed data. Only trainees can submit tasks.',
  })
  @ApiResponse({
    status: 201,
    description: 'Task submitted successfully',
    type: TaskSubmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid submission data' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async submitTask(
    @Request() req: any,
    @Body() submitDto: CreateTaskSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    return this.taskService.submitTask(req.user.id, submitDto);
  }

  /**
   * Quick submit a task (Trainee only)
   */
  @Post('quick-submit')
  @Roles(UserRole.TRAINEE)
  @ApiOperation({
    summary: 'Quick submit a task',
    description:
      'Quickly mark a task as completed with minimal data. Useful for simple tasks.',
  })
  @ApiResponse({
    status: 201,
    description: 'Task submitted successfully',
    type: TaskSubmissionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid submission data' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async quickSubmitTask(
    @Request() req: any,
    @Body() quickDto: QuickTaskSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    return this.taskService.quickSubmitTask(req.user.id, quickDto);
  }

  /**
   * Get task submissions
   */
  @Get('submissions/list')
  @ApiOperation({
    summary: 'Get task submissions',
    description:
      'Get task submissions with filtering. Coaches see submissions for their tasks, trainees see their own submissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'Submissions retrieved successfully',
    type: TaskSubmissionListResponseDto,
  })
  @ApiQuery({
    name: 'taskId',
    required: false,
    description: 'Filter by task ID',
  })
  @ApiQuery({
    name: 'traineeId',
    required: false,
    description: 'Filter by trainee ID (coach only)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubmissionStatus,
    description: 'Filter by submission status',
  })
  @ApiQuery({
    name: 'reviewRequired',
    required: false,
    type: Boolean,
    description: 'Filter submissions requiring review',
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
  async getTaskSubmissions(
    @Request() req: any,
    @Query('taskId') taskId?: string,
    @Query('traineeId') traineeId?: string,
    @Query('status') status?: SubmissionStatus,
    @Query('reviewRequired') reviewRequired?: boolean,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<TaskSubmissionListResponseDto> {
    return this.taskService.getTaskSubmissions(req.user.id, req.user.role, {
      taskId,
      traineeId,
      status,
      reviewRequired,
      page,
      limit,
    });
  }

  /**
   * Review a task submission (Coach only)
   */
  @Put('submissions/:id/review')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Review a task submission',
    description:
      'Review and approve/reject a task submission. Only coaches can review submissions.',
  })
  @ApiParam({ name: 'id', description: 'Submission ID' })
  @ApiResponse({
    status: 200,
    description: 'Submission reviewed successfully',
    type: TaskSubmissionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Submission not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to review this submission',
  })
  async reviewSubmission(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) submissionId: string,
    @Body() reviewDto: ReviewSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    return this.taskService.reviewSubmission(
      submissionId,
      req.user.id,
      reviewDto,
    );
  }

  /**
   * Get task summary for dashboard
   */
  @Get('dashboard/summary')
  @ApiOperation({
    summary: 'Get task summary',
    description: 'Get task summary statistics for dashboard display.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task summary retrieved successfully',
    type: TaskSummaryDto,
  })
  async getTaskSummary(@Request() req: any): Promise<TaskSummaryDto> {
    return this.taskService.getTaskSummary(req.user.id, req.user.role);
  }

  /**
   * Get tasks for homepage
   */
  @Get('homepage/tasks')
  @ApiOperation({
    summary: 'Get homepage tasks',
    description:
      'Get tasks for homepage display - urgent, due today, recent, and in-progress tasks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Homepage tasks retrieved successfully',
  })
  async getHomepageTasks(@Request() req: any): Promise<{
    urgent: TaskResponseDto[];
    dueToday: TaskResponseDto[];
    recent: TaskResponseDto[];
    inProgress: TaskResponseDto[];
  }> {
    return this.taskService.getHomepageTasks(req.user.id, req.user.role);
  }

  /**
   * Bulk task actions
   */
  @Post('bulk-action')
  @ApiOperation({
    summary: 'Perform bulk actions on tasks',
    description:
      'Perform actions on multiple tasks at once (complete, cancel, extend due date, change priority).',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk action completed',
  })
  async bulkTaskAction(
    @Request() req: any,
    @Body() bulkDto: BulkTaskActionDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.taskService.bulkTaskAction(req.user.id, req.user.role, bulkDto);
  }

  /**
   * Get tasks by trainee (Coach only)
   */
  @Get('trainee/:traineeId')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get tasks for a specific trainee',
    description:
      'Get all tasks assigned to a specific trainee. Only coaches can access this endpoint.',
  })
  @ApiParam({ name: 'traineeId', description: 'Trainee ID' })
  @ApiResponse({
    status: 200,
    description: 'Trainee tasks retrieved successfully',
    type: TaskListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: TaskStatus,
    description: 'Filter by task status',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: TaskPriority,
    description: 'Filter by priority',
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
  async getTraineeTasks(
    @Request() req: any,
    @Param('traineeId', ParseUUIDPipe) traineeId: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<TaskListResponseDto> {
    return this.taskService.getTasks(req.user.id, req.user.role, {
      traineeId,
      status,
      priority,
      page,
      limit,
    });
  }

  /**
   * Get tasks pending review (Coach only)
   */
  @Get('review/pending')
  @Roles(UserRole.COACH)
  @ApiOperation({
    summary: 'Get tasks pending review',
    description: 'Get all task submissions that are pending coach review.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending reviews retrieved successfully',
    type: TaskSubmissionListResponseDto,
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
  async getPendingReviews(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<TaskSubmissionListResponseDto> {
    return this.taskService.getTaskSubmissions(req.user.id, req.user.role, {
      reviewRequired: true,
      page,
      limit,
    });
  }

  /**
   * Get overdue tasks
   */
  @Get('overdue/list')
  @ApiOperation({
    summary: 'Get overdue tasks',
    description: 'Get all overdue tasks for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Overdue tasks retrieved successfully',
    type: TaskListResponseDto,
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
  async getOverdueTasks(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<TaskListResponseDto> {
    return this.taskService.getTasks(req.user.id, req.user.role, {
      isOverdue: true,
      page,
      limit,
    });
  }

  /**
   * Get tasks due today
   */
  @Get('due-today/list')
  @ApiOperation({
    summary: 'Get tasks due today',
    description: 'Get all tasks due today for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks due today retrieved successfully',
    type: TaskListResponseDto,
  })
  async getTasksDueToday(@Request() req: any): Promise<TaskListResponseDto> {
    const today = new Date();
    const startOfDay = today.toISOString().split('T')[0] + 'T00:00:00.000Z';
    const endOfDay = today.toISOString().split('T')[0] + 'T23:59:59.999Z';

    return this.taskService.getTasks(req.user.id, req.user.role, {
      dueDateFrom: startOfDay,
      dueDateTo: endOfDay,
      status: TaskStatus.PENDING,
    });
  }

  /**
   * Get task types with descriptions
   */
  @Get('types/list')
  @ApiOperation({
    summary: 'Get available task types',
    description:
      'Get all available task types with descriptions for task creation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Task types retrieved successfully',
  })
  async getTaskTypes(): Promise<{
    taskTypes: {
      type: TaskType;
      name: string;
      description: string;
      defaultPoints: number;
      requiresConfig: boolean;
    }[];
  }> {
    const taskTypes = [
      {
        type: TaskType.WORKOUT,
        name: 'Workout',
        description: 'Complete a specific workout routine',
        defaultPoints: 50,
        requiresConfig: true,
      },
      {
        type: TaskType.MEAL_LOG,
        name: 'Meal Log',
        description: 'Log meals and track nutrition',
        defaultPoints: 30,
        requiresConfig: true,
      },
      {
        type: TaskType.WEIGHT_CHECK,
        name: 'Weight Check',
        description: 'Record body weight measurement',
        defaultPoints: 20,
        requiresConfig: true,
      },
      {
        type: TaskType.PROGRESS_PHOTO,
        name: 'Progress Photo',
        description: 'Take progress photos for tracking',
        defaultPoints: 40,
        requiresConfig: true,
      },
      {
        type: TaskType.MEASUREMENT,
        name: 'Body Measurement',
        description: 'Record body measurements',
        defaultPoints: 25,
        requiresConfig: true,
      },
      {
        type: TaskType.HABIT_TRACKING,
        name: 'Habit Tracking',
        description: 'Track daily habits and behaviors',
        defaultPoints: 35,
        requiresConfig: true,
      },
      {
        type: TaskType.REFLECTION,
        name: 'Reflection',
        description: 'Complete reflection questions',
        defaultPoints: 25,
        requiresConfig: true,
      },
      {
        type: TaskType.EDUCATION,
        name: 'Education',
        description: 'Complete educational content',
        defaultPoints: 30,
        requiresConfig: true,
      },
      {
        type: TaskType.GOAL_SETTING,
        name: 'Goal Setting',
        description: 'Set and review goals',
        defaultPoints: 40,
        requiresConfig: true,
      },
      {
        type: TaskType.CUSTOM,
        name: 'Custom Task',
        description: 'Custom task defined by coach',
        defaultPoints: 20,
        requiresConfig: false,
      },
    ];

    return { taskTypes };
  }
}
