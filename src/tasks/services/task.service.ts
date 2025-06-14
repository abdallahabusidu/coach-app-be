import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  SelectQueryBuilder,
  Between,
  LessThan,
  MoreThan,
} from 'typeorm';
import {
  TaskEntity,
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskFrequency,
} from '../entities/task.entity';
import {
  TaskSubmissionEntity,
  SubmissionStatus,
} from '../entities/task-submission.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
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

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,

    @InjectRepository(TaskSubmissionEntity)
    private readonly submissionRepository: Repository<TaskSubmissionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new task
   */
  async createTask(
    coachId: string,
    createDto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    // Verify coach exists
    const coach = await this.userRepository.findOne({
      where: { id: coachId, role: UserRole.COACH },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Verify trainee exists and is associated with coach
    const trainee = await this.userRepository.findOne({
      where: { id: createDto.traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Validate task configuration based on type
    this.validateTaskConfig(createDto.taskType, createDto.taskConfig);

    const task = this.taskRepository.create({
      title: createDto.title,
      description: createDto.description,
      taskType: createDto.taskType,
      coachId,
      traineeId: createDto.traineeId,
      priority: createDto.priority,
      frequency: createDto.frequency,
      dueDate: createDto.dueDate ? new Date(createDto.dueDate) : undefined,
      startDate: createDto.startDate
        ? new Date(createDto.startDate)
        : new Date(),
      estimatedMinutes: createDto.estimatedMinutes,
      taskConfig: createDto.taskConfig,
      instructions: createDto.instructions,
      tags: createDto.tags || [],
      points: createDto.points || this.getDefaultPoints(createDto.taskType),
      isVisible: createDto.isVisible !== false,
      requiresApproval: createDto.requiresApproval || false,
      maxSubmissions: createDto.maxSubmissions || 1,
      allowLateSubmission: createDto.allowLateSubmission !== false,
      reminderSettings: createDto.reminderSettings,
      recurrencePattern: createDto.recurrencePattern,
    });

    const savedTask = await this.taskRepository.save(task);

    // Create recurring tasks if needed
    if (
      createDto.frequency !== TaskFrequency.ONCE &&
      createDto.recurrencePattern
    ) {
      await this.createRecurringTasks(savedTask);
    }

    return this.transformToResponseDto(savedTask, coach, trainee);
  }

  /**
   * Get tasks with filtering and pagination
   */
  async getTasks(
    userId: string,
    userRole: UserRole,
    filters: {
      traineeId?: string;
      coachId?: string;
      taskType?: TaskType;
      status?: TaskStatus;
      priority?: TaskPriority;
      frequency?: TaskFrequency;
      tags?: string[];
      dueDateFrom?: string;
      dueDateTo?: string;
      isOverdue?: boolean;
      requiresApproval?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ): Promise<TaskListResponseDto> {
    const queryBuilder = this.createTaskQueryBuilder(userId, userRole, filters);

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply sorting
    this.applySorting(queryBuilder, filters);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const tasks = await queryBuilder.getMany();

    // Transform to response DTOs
    const taskDtos = await Promise.all(
      tasks.map((task) => this.transformToResponseDto(task)),
    );

    // Calculate summary statistics
    const summary = await this.calculateTaskSummary(userId, userRole, filters);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      tasks: taskDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      summary,
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(
    taskId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<TaskResponseDto> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.coach', 'coach')
      .leftJoinAndSelect('task.trainee', 'trainee')
      .leftJoinAndSelect('task.submissions', 'submissions')
      .where('task.id = :taskId', { taskId });

    // Apply access control
    if (userRole === UserRole.COACH) {
      queryBuilder.andWhere('task.coachId = :userId', { userId });
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.andWhere('task.traineeId = :userId', { userId });
    }

    const task = await queryBuilder.getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return this.transformToResponseDto(task);
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    coachId: string,
    updateDto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, coachId },
      relations: ['coach', 'trainee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Validate task configuration if being updated
    if (updateDto.taskConfig) {
      this.validateTaskConfig(task.taskType, updateDto.taskConfig);
    }

    // Update fields
    Object.assign(task, {
      ...updateDto,
      dueDate: updateDto.dueDate ? new Date(updateDto.dueDate) : task.dueDate,
      startDate: updateDto.startDate
        ? new Date(updateDto.startDate)
        : task.startDate,
    });

    // Update status based on conditions
    if (updateDto.status === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
      task.completionData = {
        completedAt: new Date(),
        completedBy: coachId,
        notes: 'Completed by coach',
      };
    }

    const updatedTask = await this.taskRepository.save(task);
    return this.transformToResponseDto(updatedTask);
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string, coachId: string): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId, coachId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if task has submissions
    const submissionCount = await this.submissionRepository.count({
      where: { taskId },
    });

    if (submissionCount > 0) {
      throw new BadRequestException(
        'Cannot delete a task that has submissions. Cancel the task instead.',
      );
    }

    await this.taskRepository.remove(task);
  }

  /**
   * Submit a task (by trainee)
   */
  async submitTask(
    traineeId: string,
    createDto: CreateTaskSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    // Verify task exists and belongs to trainee
    const task = await this.taskRepository.findOne({
      where: { id: createDto.taskId, traineeId },
      relations: ['coach', 'trainee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if task allows submissions
    if (
      task.status === TaskStatus.COMPLETED ||
      task.status === TaskStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot submit to a completed or cancelled task',
      );
    }

    // Check submission limits
    const existingSubmissions = await this.submissionRepository.count({
      where: { taskId: createDto.taskId, submittedById: traineeId },
    });

    if (existingSubmissions >= task.maxSubmissions) {
      throw new BadRequestException(
        `Maximum submissions (${task.maxSubmissions}) reached for this task`,
      );
    }

    // Check if late submission is allowed
    if (
      task.dueDate &&
      new Date() > task.dueDate &&
      !task.allowLateSubmission
    ) {
      throw new BadRequestException(
        'Late submissions are not allowed for this task',
      );
    }

    // Validate submission data based on task type
    this.validateSubmissionData(task.taskType, createDto.submissionData);

    // Mark previous submissions as not latest
    await this.submissionRepository.update(
      { taskId: createDto.taskId, submittedById: traineeId },
      { isLatest: false },
    );

    const submission = this.submissionRepository.create({
      taskId: createDto.taskId,
      submittedById: traineeId,
      submissionData: createDto.submissionData,
      notes: createDto.notes,
      attachments: createDto.attachments || [],
      timeTaken: createDto.timeTaken,
      difficultyRating: createDto.difficultyRating,
      satisfactionRating: createDto.satisfactionRating,
      submissionNumber: existingSubmissions + 1,
      pointsAwarded: task.requiresApproval ? 0 : task.points,
      status: task.requiresApproval
        ? SubmissionStatus.SUBMITTED
        : SubmissionStatus.APPROVED,
    });

    const savedSubmission = await this.submissionRepository.save(submission);

    // Update task status and start time
    if (task.status === TaskStatus.PENDING) {
      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = new Date();
    }

    // Auto-complete task if it doesn't require approval
    if (!task.requiresApproval) {
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date();
      task.completionData = {
        completedAt: new Date(),
        completedBy: traineeId,
        timeTaken: createDto.timeTaken,
        rating: createDto.satisfactionRating,
      };
    }

    await this.taskRepository.save(task);

    return this.transformSubmissionToResponseDto(
      savedSubmission,
      task,
      task.trainee,
    );
  }

  /**
   * Quick task submission (simple completion)
   */
  async quickSubmitTask(
    traineeId: string,
    quickDto: QuickTaskSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    const task = await this.taskRepository.findOne({
      where: { id: quickDto.taskId, traineeId },
      relations: ['coach', 'trainee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const submissionData = {
      custom: {
        text: quickDto.notes || '',
        data: {
          completed: quickDto.completed,
          rating: quickDto.rating,
        },
      },
    };

    return this.submitTask(traineeId, {
      taskId: quickDto.taskId,
      submissionData,
      notes: quickDto.notes,
      satisfactionRating: quickDto.rating,
    });
  }

  /**
   * Review a task submission (by coach)
   */
  async reviewSubmission(
    submissionId: string,
    coachId: string,
    reviewDto: ReviewSubmissionDto,
  ): Promise<TaskSubmissionResponseDto> {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['task', 'task.coach', 'submittedBy'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.task.coachId !== coachId) {
      throw new ForbiddenException(
        'You can only review submissions for your tasks',
      );
    }

    // Update submission
    submission.status = reviewDto.status;
    submission.coachFeedback = reviewDto.coachFeedback;
    submission.coachRating = reviewDto.coachRating;
    submission.pointsAwarded =
      reviewDto.pointsAwarded || submission.task.points;
    submission.reviewedById = coachId;
    submission.reviewedAt = new Date();

    const updatedSubmission = await this.submissionRepository.save(submission);

    // Update task status if approved
    if (reviewDto.status === SubmissionStatus.APPROVED) {
      submission.task.status = TaskStatus.COMPLETED;
      submission.task.completedAt = new Date();
      await this.taskRepository.save(submission.task);
    }

    return this.transformSubmissionToResponseDto(updatedSubmission);
  }

  /**
   * Get task submissions
   */
  async getTaskSubmissions(
    userId: string,
    userRole: UserRole,
    filters: {
      taskId?: string;
      traineeId?: string;
      status?: SubmissionStatus;
      reviewRequired?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<TaskSubmissionListResponseDto> {
    const queryBuilder = this.submissionRepository
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.task', 'task')
      .leftJoinAndSelect('submission.submittedBy', 'submittedBy')
      .leftJoinAndSelect('submission.reviewedBy', 'reviewedBy');

    // Apply access control
    if (userRole === UserRole.COACH) {
      queryBuilder.where('task.coachId = :userId', { userId });
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.where('submission.submittedById = :userId', { userId });
    }

    // Apply filters
    if (filters.taskId) {
      queryBuilder.andWhere('submission.taskId = :taskId', {
        taskId: filters.taskId,
      });
    }

    if (filters.traineeId) {
      queryBuilder.andWhere('submission.submittedById = :traineeId', {
        traineeId: filters.traineeId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('submission.status = :status', {
        status: filters.status,
      });
    }

    if (filters.reviewRequired) {
      queryBuilder.andWhere('submission.status = :status', {
        status: SubmissionStatus.SUBMITTED,
      });
    }

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Apply sorting
    queryBuilder.orderBy('submission.createdAt', 'DESC');

    // Execute query
    const submissions = await queryBuilder.getMany();

    // Transform to response DTOs
    const submissionDtos = submissions.map((submission) =>
      this.transformSubmissionToResponseDto(submission),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      submissions: submissionDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get task summary for dashboard
   */
  async getTaskSummary(
    userId: string,
    userRole: UserRole,
  ): Promise<TaskSummaryDto> {
    return this.calculateTaskSummary(userId, userRole);
  }

  /**
   * Get tasks for homepage (recent and urgent)
   */
  async getHomepageTasks(
    userId: string,
    userRole: UserRole,
  ): Promise<{
    urgent: TaskResponseDto[];
    dueToday: TaskResponseDto[];
    recent: TaskResponseDto[];
    inProgress: TaskResponseDto[];
  }> {
    const baseQuery = this.createTaskQueryBuilder(userId, userRole);

    // Get urgent tasks (high priority, due soon)
    const urgentTasks = await baseQuery
      .clone()
      .andWhere('task.priority IN (:...priorities)', {
        priorities: [TaskPriority.HIGH, TaskPriority.URGENT],
      })
      .andWhere('task.status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
      })
      .orderBy('task.dueDate', 'ASC')
      .take(5)
      .getMany();

    // Get tasks due today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const dueTodayTasks = await baseQuery
      .clone()
      .andWhere('task.dueDate BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .andWhere('task.status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
      })
      .orderBy('task.dueDate', 'ASC')
      .take(5)
      .getMany();

    // Get recent tasks
    const recentTasks = await baseQuery
      .clone()
      .orderBy('task.createdAt', 'DESC')
      .take(5)
      .getMany();

    // Get in-progress tasks
    const inProgressTasks = await baseQuery
      .clone()
      .andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS })
      .orderBy('task.startedAt', 'DESC')
      .take(5)
      .getMany();

    return {
      urgent: await Promise.all(
        urgentTasks.map((task) => this.transformToResponseDto(task)),
      ),
      dueToday: await Promise.all(
        dueTodayTasks.map((task) => this.transformToResponseDto(task)),
      ),
      recent: await Promise.all(
        recentTasks.map((task) => this.transformToResponseDto(task)),
      ),
      inProgress: await Promise.all(
        inProgressTasks.map((task) => this.transformToResponseDto(task)),
      ),
    };
  }

  /**
   * Bulk task actions
   */
  async bulkTaskAction(
    userId: string,
    userRole: UserRole,
    bulkDto: BulkTaskActionDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const taskId of bulkDto.taskIds) {
      try {
        const task = await this.taskRepository.findOne({
          where: { id: taskId },
        });

        if (!task) {
          results.failed++;
          results.errors.push(`Task ${taskId} not found`);
          continue;
        }

        // Check permissions
        if (userRole === UserRole.COACH && task.coachId !== userId) {
          results.failed++;
          results.errors.push(`No permission for task ${taskId}`);
          continue;
        }

        if (userRole === UserRole.TRAINEE && task.traineeId !== userId) {
          results.failed++;
          results.errors.push(`No permission for task ${taskId}`);
          continue;
        }

        // Perform action
        switch (bulkDto.action) {
          case 'complete':
            task.status = TaskStatus.COMPLETED;
            task.completedAt = new Date();
            break;
          case 'cancel':
            task.status = TaskStatus.CANCELLED;
            break;
          case 'extend_due_date':
            if (bulkDto.actionData?.dueDate) {
              task.dueDate = new Date(bulkDto.actionData.dueDate);
            }
            break;
          case 'change_priority':
            if (bulkDto.actionData?.priority) {
              task.priority = bulkDto.actionData.priority as TaskPriority;
            }
            break;
        }

        await this.taskRepository.save(task);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error with task ${taskId}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Update overdue tasks
   */
  async updateOverdueTasks(): Promise<void> {
    const now = new Date();

    await this.taskRepository
      .createQueryBuilder()
      .update(TaskEntity)
      .set({ status: TaskStatus.OVERDUE })
      .where('dueDate < :now', { now })
      .andWhere('status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
      })
      .execute();

    this.logger.log('Updated overdue tasks');
  }

  /**
   * Create base query builder for tasks
   */
  private createTaskQueryBuilder(
    userId: string,
    userRole: UserRole,
    filters?: any,
  ): SelectQueryBuilder<TaskEntity> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.coach', 'coach')
      .leftJoinAndSelect('task.trainee', 'trainee');

    // Apply access control
    if (userRole === UserRole.COACH) {
      if (filters?.traineeId) {
        queryBuilder.where(
          'task.coachId = :userId AND task.traineeId = :traineeId',
          {
            userId,
            traineeId: filters.traineeId,
          },
        );
      } else {
        queryBuilder.where('task.coachId = :userId', { userId });
      }
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.where('task.traineeId = :userId', { userId });
      queryBuilder.andWhere('task.isVisible = true');
    }

    return queryBuilder;
  }

  /**
   * Apply filters to task query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<TaskEntity>,
    filters: any,
  ): void {
    if (filters.taskType) {
      queryBuilder.andWhere('task.taskType = :taskType', {
        taskType: filters.taskType,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('task.status = :status', {
        status: filters.status,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.frequency) {
      queryBuilder.andWhere('task.frequency = :frequency', {
        frequency: filters.frequency,
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('task.tags && :tags', {
        tags: filters.tags,
      });
    }

    if (filters.dueDateFrom) {
      queryBuilder.andWhere('task.dueDate >= :dueDateFrom', {
        dueDateFrom: new Date(filters.dueDateFrom),
      });
    }

    if (filters.dueDateTo) {
      queryBuilder.andWhere('task.dueDate <= :dueDateTo', {
        dueDateTo: new Date(filters.dueDateTo),
      });
    }

    if (filters.isOverdue) {
      const now = new Date();
      queryBuilder.andWhere('task.dueDate < :now', { now });
      queryBuilder.andWhere('task.status != :completedStatus', {
        completedStatus: TaskStatus.COMPLETED,
      });
    }

    if (filters.requiresApproval !== undefined) {
      queryBuilder.andWhere('task.requiresApproval = :requiresApproval', {
        requiresApproval: filters.requiresApproval,
      });
    }
  }

  /**
   * Apply sorting to task query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<TaskEntity>,
    filters: any,
  ): void {
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'title':
        queryBuilder.orderBy('task.title', sortOrder);
        break;
      case 'dueDate':
        queryBuilder.orderBy('task.dueDate', sortOrder);
        break;
      case 'priority':
        queryBuilder.orderBy('task.priority', sortOrder);
        break;
      case 'status':
        queryBuilder.orderBy('task.status', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('task.createdAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('task.createdAt', sortOrder);
    }
  }

  /**
   * Calculate task summary statistics
   */
  private async calculateTaskSummary(
    userId: string,
    userRole: UserRole,
    filters?: any,
  ): Promise<any> {
    const baseQuery = this.createTaskQueryBuilder(userId, userRole, filters);

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
      baseQuery.clone().getCount(),
      baseQuery
        .clone()
        .andWhere('task.status = :status', { status: TaskStatus.PENDING })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('task.status = :status', { status: TaskStatus.IN_PROGRESS })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('task.status = :status', { status: TaskStatus.OVERDUE })
        .getCount(),
    ]);

    // Calculate points
    const totalPointsResult = await baseQuery
      .clone()
      .select('SUM(task.points)', 'total')
      .getRawOne();

    const earnedPointsResult = await baseQuery
      .clone()
      .leftJoin('task.submissions', 'submission')
      .select('SUM(submission.pointsAwarded)', 'earned')
      .andWhere('submission.status = :status', {
        status: SubmissionStatus.APPROVED,
      })
      .getRawOne();

    const totalPoints = parseInt(totalPointsResult?.total || '0');
    const pointsEarned = parseInt(earnedPointsResult?.earned || '0');
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate tasks due today and this week
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const [dueToday, dueThisWeek] = await Promise.all([
      baseQuery
        .clone()
        .andWhere('task.dueDate BETWEEN :start AND :end', {
          start: startOfDay,
          end: endOfDay,
        })
        .andWhere('task.status IN (:...statuses)', {
          statuses: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        })
        .getCount(),
      baseQuery
        .clone()
        .andWhere('task.dueDate BETWEEN :start AND :end', {
          start: new Date(),
          end: endOfWeek,
        })
        .andWhere('task.status IN (:...statuses)', {
          statuses: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        })
        .getCount(),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      totalPoints,
      pointsEarned,
      completionRate,
      dueToday,
      dueThisWeek,
      currentStreak: 0, // TODO: Implement streak calculation
      longestStreak: 0, // TODO: Implement streak calculation
    };
  }

  /**
   * Validate task configuration based on task type
   */
  private validateTaskConfig(taskType: TaskType, config: any): void {
    if (!config) return;

    switch (taskType) {
      case TaskType.WORKOUT:
        if (!config.workout?.workoutId) {
          throw new BadRequestException(
            'Workout ID is required for workout tasks',
          );
        }
        break;
      case TaskType.MEAL_LOG:
        if (!config.mealLog?.mealsToLog?.length) {
          throw new BadRequestException(
            'Meals to log are required for meal log tasks',
          );
        }
        break;
      case TaskType.WEIGHT_CHECK:
        if (!config.weightCheck?.unit) {
          throw new BadRequestException(
            'Unit is required for weight check tasks',
          );
        }
        break;
      case TaskType.PROGRESS_PHOTO:
        if (!config.progressPhoto?.angles?.length) {
          throw new BadRequestException(
            'Photo angles are required for progress photo tasks',
          );
        }
        break;
      case TaskType.MEASUREMENT:
        if (!config.measurement?.bodyParts?.length) {
          throw new BadRequestException(
            'Body parts are required for measurement tasks',
          );
        }
        break;
      case TaskType.HABIT_TRACKING:
        if (!config.habitTracking?.habits?.length) {
          throw new BadRequestException(
            'Habits are required for habit tracking tasks',
          );
        }
        break;
      case TaskType.REFLECTION:
        if (!config.reflection?.questions?.length) {
          throw new BadRequestException(
            'Questions are required for reflection tasks',
          );
        }
        break;
      case TaskType.EDUCATION:
        if (!config.education?.contentType) {
          throw new BadRequestException(
            'Content type is required for education tasks',
          );
        }
        break;
      case TaskType.GOAL_SETTING:
        if (!config.goalSetting?.categories?.length) {
          throw new BadRequestException(
            'Categories are required for goal setting tasks',
          );
        }
        break;
    }
  }

  /**
   * Validate submission data based on task type
   */
  private validateSubmissionData(taskType: TaskType, data: any): void {
    // Basic validation - can be expanded based on requirements
    if (!data) {
      throw new BadRequestException('Submission data is required');
    }

    switch (taskType) {
      case TaskType.WORKOUT:
        if (!data.workout) {
          throw new BadRequestException('Workout data is required');
        }
        break;
      case TaskType.MEAL_LOG:
        if (!data.mealLog?.meals?.length) {
          throw new BadRequestException('Meal data is required');
        }
        break;
      case TaskType.WEIGHT_CHECK:
        if (!data.weightCheck?.weight) {
          throw new BadRequestException('Weight measurement is required');
        }
        break;
      case TaskType.PROGRESS_PHOTO:
        if (!data.progressPhoto?.photos?.length) {
          throw new BadRequestException('Progress photos are required');
        }
        break;
    }
  }

  /**
   * Get default points for task type
   */
  private getDefaultPoints(taskType: TaskType): number {
    const defaultPoints = {
      [TaskType.WORKOUT]: 50,
      [TaskType.MEAL_LOG]: 30,
      [TaskType.WEIGHT_CHECK]: 20,
      [TaskType.PROGRESS_PHOTO]: 40,
      [TaskType.MEASUREMENT]: 25,
      [TaskType.HABIT_TRACKING]: 35,
      [TaskType.REFLECTION]: 25,
      [TaskType.EDUCATION]: 30,
      [TaskType.GOAL_SETTING]: 40,
      [TaskType.CUSTOM]: 20,
    };

    return defaultPoints[taskType] || 20;
  }

  /**
   * Create recurring tasks
   */
  private async createRecurringTasks(parentTask: TaskEntity): Promise<void> {
    if (!parentTask.recurrencePattern) return;

    const { interval, maxOccurrences, endDate, daysOfWeek } =
      parentTask.recurrencePattern;
    const maxTasks = Math.min(maxOccurrences || 52, 52); // Limit to 52 instances

    for (let i = 1; i < maxTasks; i++) {
      const nextDueDate = new Date(parentTask.dueDate);

      if (parentTask.frequency === TaskFrequency.DAILY) {
        nextDueDate.setDate(nextDueDate.getDate() + interval * i);
      } else if (parentTask.frequency === TaskFrequency.WEEKLY) {
        nextDueDate.setDate(nextDueDate.getDate() + interval * 7 * i);
      } else if (parentTask.frequency === TaskFrequency.MONTHLY) {
        nextDueDate.setMonth(nextDueDate.getMonth() + interval * i);
      }

      if (endDate && nextDueDate > endDate) break;

      // Skip if date is in exceptions
      if (
        parentTask.recurrencePattern.exceptions?.some(
          (exception) => exception.getTime() === nextDueDate.getTime(),
        )
      ) {
        continue;
      }

      const recurringTask = this.taskRepository.create({
        ...parentTask,
        id: undefined,
        dueDate: nextDueDate,
        parentTaskId: parentTask.id,
        sequenceNumber: i + 1,
        status: TaskStatus.PENDING,
        startedAt: undefined,
        completedAt: undefined,
        completionData: undefined,
      });

      await this.taskRepository.save(recurringTask);
    }
  }

  /**
   * Transform task entity to response DTO
   */
  private async transformToResponseDto(
    task: TaskEntity,
    coach?: UserEntity,
    trainee?: UserEntity,
  ): Promise<TaskResponseDto> {
    const submissionCount = await this.submissionRepository.count({
      where: { taskId: task.id },
    });

    const now = new Date();
    const isOverdue = task.dueDate
      ? task.dueDate < now && task.status !== TaskStatus.COMPLETED
      : false;
    const daysUntilDue = task.dueDate
      ? Math.ceil(
          (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )
      : undefined;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      taskType: task.taskType,
      coach:
        coach || task.coach
          ? {
              id: (coach || task.coach).id,
              name: `${(coach || task.coach).firstName} ${(coach || task.coach).lastName}`,
            }
          : { id: task.coachId, name: 'Unknown Coach' },
      trainee:
        trainee || task.trainee
          ? {
              id: (trainee || task.trainee).id,
              name: `${(trainee || task.trainee).firstName} ${(trainee || task.trainee).lastName}`,
            }
          : { id: task.traineeId, name: 'Unknown Trainee' },
      priority: task.priority,
      status: isOverdue ? TaskStatus.OVERDUE : task.status,
      frequency: task.frequency,
      dueDate: task.dueDate,
      startDate: task.startDate,
      estimatedMinutes: task.estimatedMinutes,
      taskConfig: task.taskConfig,
      instructions: task.instructions,
      tags: task.tags,
      points: task.points,
      isVisible: task.isVisible,
      requiresApproval: task.requiresApproval,
      maxSubmissions: task.maxSubmissions,
      allowLateSubmission: task.allowLateSubmission,
      reminderSettings: task.reminderSettings,
      recurrencePattern: task.recurrencePattern,
      completionData: task.completionData,
      submissionCount,
      isOverdue,
      daysUntilDue,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      parentTaskId: task.parentTaskId,
      sequenceNumber: task.sequenceNumber,
    };
  }

  /**
   * Transform submission entity to response DTO
   */
  private transformSubmissionToResponseDto(
    submission: TaskSubmissionEntity,
    task?: TaskEntity,
    submittedBy?: UserEntity,
    reviewedBy?: UserEntity,
  ): TaskSubmissionResponseDto {
    return {
      id: submission.id,
      task:
        task || submission.task
          ? {
              id: (task || submission.task).id,
              title: (task || submission.task).title,
              taskType: (task || submission.task).taskType,
            }
          : {
              id: submission.taskId,
              title: 'Unknown Task',
              taskType: 'unknown',
            },
      submittedBy:
        submittedBy || submission.submittedBy
          ? {
              id: (submittedBy || submission.submittedBy).id,
              name: `${(submittedBy || submission.submittedBy).firstName} ${(submittedBy || submission.submittedBy).lastName}`,
            }
          : { id: submission.submittedById, name: 'Unknown User' },
      status: submission.status,
      submissionData: submission.submissionData,
      notes: submission.notes,
      attachments: submission.attachments,
      timeTaken: submission.timeTaken,
      difficultyRating: submission.difficultyRating,
      satisfactionRating: submission.satisfactionRating,
      reviewedBy:
        reviewedBy || submission.reviewedBy
          ? {
              id: (reviewedBy || submission.reviewedBy).id,
              name: `${(reviewedBy || submission.reviewedBy).firstName} ${(reviewedBy || submission.reviewedBy).lastName}`,
            }
          : undefined,
      coachFeedback: submission.coachFeedback,
      coachRating: submission.coachRating,
      pointsAwarded: submission.pointsAwarded,
      isLatest: submission.isLatest,
      submissionNumber: submission.submissionNumber,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      reviewedAt: submission.reviewedAt,
    };
  }
}
