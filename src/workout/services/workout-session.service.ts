import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import {
  WorkoutSessionEntity,
  SessionStatus,
} from '../entities/workout-session.entity';
import { WorkoutEntity } from '../entities/workout.entity';
import { WorkoutPlanEntity } from '../entities/workout-plan.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import {
  CreateWorkoutSessionDto,
  UpdateWorkoutSessionDto,
  CompleteWorkoutSessionDto,
  AddCoachFeedbackDto,
  WorkoutSessionResponseDto,
  WorkoutSessionListResponseDto,
  WorkoutSessionFilterDto,
} from '../dtos/workout-session.dto';

@Injectable()
export class WorkoutSessionService {
  private readonly logger = new Logger(WorkoutSessionService.name);

  constructor(
    @InjectRepository(WorkoutSessionEntity)
    private readonly workoutSessionRepository: Repository<WorkoutSessionEntity>,

    @InjectRepository(WorkoutEntity)
    private readonly workoutRepository: Repository<WorkoutEntity>,

    @InjectRepository(WorkoutPlanEntity)
    private readonly workoutPlanRepository: Repository<WorkoutPlanEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create/Schedule a new workout session
   */
  async createWorkoutSession(
    userId: string,
    createDto: CreateWorkoutSessionDto,
  ): Promise<WorkoutSessionResponseDto> {
    // Verify workout exists
    const workout = await this.workoutRepository.findOne({
      where: { id: createDto.workoutId },
    });

    if (!workout) {
      throw new NotFoundException('Workout not found');
    }

    // Verify workout plan exists if provided
    let workoutPlan: WorkoutPlanEntity | undefined;
    if (createDto.workoutPlanId) {
      workoutPlan = await this.workoutPlanRepository.findOne({
        where: { id: createDto.workoutPlanId },
      });

      if (!workoutPlan) {
        throw new NotFoundException('Workout plan not found');
      }
    }

    // Determine trainee and coach
    let traineeId = createDto.traineeId || userId;
    let coachId: string | undefined;

    // Get user info
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // If current user is coach and traineeId is provided, use that
    if (currentUser.role === UserRole.COACH && createDto.traineeId) {
      traineeId = createDto.traineeId;
      coachId = userId;
    } else if (currentUser.role === UserRole.TRAINEE) {
      // If current user is trainee, they're scheduling for themselves
      traineeId = userId;
      // Get coach from workout plan if available
      if (workoutPlan) {
        coachId = workoutPlan.coachId;
      }
    }

    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    const session = this.workoutSessionRepository.create({
      workoutId: createDto.workoutId,
      workoutPlanId: createDto.workoutPlanId,
      traineeId,
      coachId,
      scheduledAt: new Date(createDto.scheduledAt),
      planWeek: createDto.planWeek,
      planDay: createDto.planDay,
      isMakeupSession: createDto.isMakeupSession || false,
      status: SessionStatus.SCHEDULED,
    });

    const savedSession = await this.workoutSessionRepository.save(session);
    return this.transformToResponseDto(
      savedSession,
      workout,
      workoutPlan,
      trainee,
    );
  }

  /**
   * Start a workout session
   */
  async startWorkoutSession(
    sessionId: string,
    userId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify user has permission to start this session
    if (session.traineeId !== userId && session.coachId !== userId) {
      throw new BadRequestException(
        'You do not have permission to start this session',
      );
    }

    if (session.status !== SessionStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot start session with status: ${session.status}`,
      );
    }

    session.status = SessionStatus.IN_PROGRESS;
    session.startedAt = new Date();

    const updatedSession = await this.workoutSessionRepository.save(session);
    return this.transformToResponseDto(updatedSession);
  }

  /**
   * Update a workout session
   */
  async updateWorkoutSession(
    sessionId: string,
    userId: string,
    updateDto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify user has permission to update this session
    if (session.traineeId !== userId && session.coachId !== userId) {
      throw new BadRequestException(
        'You do not have permission to update this session',
      );
    }

    // Update fields
    if (updateDto.status !== undefined) {
      session.status = updateDto.status;

      if (
        updateDto.status === SessionStatus.COMPLETED &&
        !session.completedAt
      ) {
        session.completedAt = new Date();

        // Calculate actual duration
        if (session.startedAt) {
          const durationMs =
            session.completedAt.getTime() - session.startedAt.getTime();
          session.actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }
      }
    }

    if (updateDto.exerciseData !== undefined) {
      session.exerciseData = updateDto.exerciseData;
    }

    if (updateDto.sessionRating !== undefined) {
      session.sessionRating = updateDto.sessionRating;
    }

    if (updateDto.traineeNotes !== undefined) {
      session.traineeNotes = updateDto.traineeNotes;
    }

    if (updateDto.caloriesBurned !== undefined) {
      session.caloriesBurned = updateDto.caloriesBurned;
    }

    if (updateDto.heartRateData !== undefined) {
      session.heartRateData = updateDto.heartRateData;
    }

    const updatedSession = await this.workoutSessionRepository.save(session);
    return this.transformToResponseDto(updatedSession);
  }

  /**
   * Complete a workout session
   */
  async completeWorkoutSession(
    userId: string,
    completeDto: CompleteWorkoutSessionDto,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: completeDto.sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify user has permission to complete this session
    if (session.traineeId !== userId) {
      throw new BadRequestException(
        'Only the trainee can complete their own session',
      );
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    // Update session with completion data
    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    session.exerciseData = completeDto.exerciseData;
    session.sessionRating = completeDto.sessionRating;
    session.traineeNotes = completeDto.traineeNotes;
    session.caloriesBurned = completeDto.caloriesBurned;
    session.heartRateData = completeDto.heartRateData;

    // Calculate actual duration
    if (session.startedAt) {
      const durationMs =
        session.completedAt.getTime() - session.startedAt.getTime();
      session.actualDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
    }

    const updatedSession = await this.workoutSessionRepository.save(session);
    return this.transformToResponseDto(updatedSession);
  }

  /**
   * Add coach feedback to a session
   */
  async addCoachFeedback(
    coachId: string,
    feedbackDto: AddCoachFeedbackDto,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: feedbackDto.sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify coach has permission to add feedback
    if (session.coachId !== coachId) {
      throw new BadRequestException(
        'You do not have permission to add feedback to this session',
      );
    }

    session.coachFeedback = feedbackDto.coachFeedback;
    const updatedSession = await this.workoutSessionRepository.save(session);

    return this.transformToResponseDto(updatedSession);
  }

  /**
   * Get workout sessions with filtering and pagination
   */
  async getWorkoutSessions(
    userId: string,
    userRole: UserRole,
    filters: WorkoutSessionFilterDto = {},
  ): Promise<WorkoutSessionListResponseDto> {
    const queryBuilder = this.createWorkoutSessionQueryBuilder();

    // Apply role-based filtering
    if (userRole === UserRole.COACH) {
      queryBuilder.andWhere('session.coachId = :userId', { userId });
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.andWhere('session.traineeId = :userId', { userId });
    }

    // Apply additional filters
    this.applyFilters(queryBuilder, filters);

    // Apply sorting
    this.applySorting(queryBuilder, filters);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const sessions = await queryBuilder.getMany();

    // Transform to response DTOs
    const sessionDtos = sessions.map((session) =>
      this.transformToResponseDto(session),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      sessions: sessionDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get a single workout session by ID
   */
  async getWorkoutSessionById(
    sessionId: string,
    userId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify user has permission to view this session
    if (session.traineeId !== userId && session.coachId !== userId) {
      throw new BadRequestException(
        'You do not have permission to view this session',
      );
    }

    return this.transformToResponseDto(session);
  }

  /**
   * Cancel a workout session
   */
  async cancelWorkoutSession(
    sessionId: string,
    userId: string,
  ): Promise<WorkoutSessionResponseDto> {
    const session = await this.workoutSessionRepository.findOne({
      where: { id: sessionId },
      relations: ['workout', 'workoutPlan', 'trainee', 'coach'],
    });

    if (!session) {
      throw new NotFoundException('Workout session not found');
    }

    // Verify user has permission to cancel this session
    if (session.traineeId !== userId && session.coachId !== userId) {
      throw new BadRequestException(
        'You do not have permission to cancel this session',
      );
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed session');
    }

    session.status = SessionStatus.CANCELLED;
    const updatedSession = await this.workoutSessionRepository.save(session);

    return this.transformToResponseDto(updatedSession);
  }

  /**
   * Create base query builder for workout sessions
   */
  private createWorkoutSessionQueryBuilder(): SelectQueryBuilder<WorkoutSessionEntity> {
    return this.workoutSessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.workout', 'workout')
      .leftJoinAndSelect('session.workoutPlan', 'workoutPlan')
      .leftJoinAndSelect('session.trainee', 'trainee')
      .leftJoinAndSelect('session.coach', 'coach');
  }

  /**
   * Apply filters to query builder
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<WorkoutSessionEntity>,
    filters: WorkoutSessionFilterDto,
  ): void {
    if (filters.traineeId) {
      queryBuilder.andWhere('session.traineeId = :traineeId', {
        traineeId: filters.traineeId,
      });
    }

    if (filters.workoutPlanId) {
      queryBuilder.andWhere('session.workoutPlanId = :workoutPlanId', {
        workoutPlanId: filters.workoutPlanId,
      });
    }

    if (filters.status) {
      queryBuilder.andWhere('session.status = :status', {
        status: filters.status,
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const fromDate = filters.dateFrom
        ? new Date(filters.dateFrom)
        : new Date('1900-01-01');
      const toDate = filters.dateTo
        ? new Date(filters.dateTo + 'T23:59:59')
        : new Date('2100-12-31');

      queryBuilder.andWhere(
        'session.scheduledAt BETWEEN :fromDate AND :toDate',
        {
          fromDate,
          toDate,
        },
      );
    }
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<WorkoutSessionEntity>,
    filters: WorkoutSessionFilterDto,
  ): void {
    const sortBy = filters.sortBy || 'scheduledAt';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'scheduledAt':
        queryBuilder.orderBy('session.scheduledAt', sortOrder);
        break;
      case 'completedAt':
        queryBuilder.orderBy('session.completedAt', sortOrder);
        break;
      case 'sessionRating':
        queryBuilder.orderBy('session.sessionRating', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('session.createdAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('session.scheduledAt', sortOrder);
    }
  }

  /**
   * Transform entity to response DTO
   */
  private transformToResponseDto(
    session: WorkoutSessionEntity,
    workout?: WorkoutEntity,
    workoutPlan?: WorkoutPlanEntity,
    trainee?: UserEntity,
    coach?: UserEntity,
  ): WorkoutSessionResponseDto {
    return {
      id: session.id,
      workout:
        workout || session.workout
          ? {
              id: (workout || session.workout).id,
              name: (workout || session.workout).name,
              workoutType: (workout || session.workout).workoutType,
              duration: (workout || session.workout).duration,
              difficulty: (workout || session.workout).difficulty,
            }
          : {
              id: session.workoutId,
              name: 'Unknown Workout',
              workoutType: 'unknown',
              duration: 0,
              difficulty: 'unknown',
            },
      workoutPlan:
        workoutPlan || session.workoutPlan
          ? {
              id: (workoutPlan || session.workoutPlan).id,
              name: (workoutPlan || session.workoutPlan).name,
              planType: (workoutPlan || session.workoutPlan).planType,
            }
          : undefined,
      trainee:
        trainee || session.trainee
          ? {
              id: (trainee || session.trainee).id,
              name: `${(trainee || session.trainee).firstName} ${(trainee || session.trainee).lastName}`,
            }
          : { id: session.traineeId, name: 'Unknown Trainee' },
      coach:
        coach || session.coach
          ? {
              id: (coach || session.coach).id,
              name: `${(coach || session.coach).firstName} ${(coach || session.coach).lastName}`,
            }
          : session.coachId
            ? { id: session.coachId, name: 'Unknown Coach' }
            : undefined,
      status: session.status,
      scheduledAt: session.scheduledAt,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      actualDuration: session.actualDuration,
      exerciseData: session.exerciseData,
      sessionRating: session.sessionRating,
      traineeNotes: session.traineeNotes,
      coachFeedback: session.coachFeedback,
      caloriesBurned: session.caloriesBurned,
      heartRateData: session.heartRateData,
      planWeek: session.planWeek,
      planDay: session.planDay,
      isMakeupSession: session.isMakeupSession,
      createdAt: session.createdAt,
    };
  }
}
