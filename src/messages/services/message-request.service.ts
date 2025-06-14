import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  MessageRequestEntity,
  MessageRequestStatus,
} from '../entities/message-request.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../../client/entities/client-profile.entity';
import { CoachProfileEntity } from '../../coach/entities/coach-profile.entity';
import {
  CreateMessageRequestDto,
  MessageRequestDto,
  MessageRequestListDto,
  RespondToMessageRequestDto,
  MessageRequestFilterDto,
} from '../dtos/message.dto';

@Injectable()
export class MessageRequestService {
  private readonly logger = new Logger(MessageRequestService.name);

  constructor(
    @InjectRepository(MessageRequestEntity)
    private readonly messageRequestRepository: Repository<MessageRequestEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(TraineeProfileEntity)
    private readonly traineeProfileRepository: Repository<TraineeProfileEntity>,

    @InjectRepository(CoachProfileEntity)
    private readonly coachProfileRepository: Repository<CoachProfileEntity>,
  ) {}

  /**
   * Create a new message request from trainee to coach
   */
  async createMessageRequest(
    traineeId: string,
    createDto: CreateMessageRequestDto,
  ): Promise<MessageRequestEntity> {
    // Verify trainee exists and has trainee role
    const trainee = await this.userRepository.findOne({
      where: { id: traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new BadRequestException('Invalid trainee user');
    }

    // Verify coach exists and has coach role
    const coach = await this.userRepository.findOne({
      where: { id: createDto.coachId, role: UserRole.COACH },
    });

    if (!coach) {
      throw new BadRequestException('Invalid coach user');
    }

    // Check if there's already a pending request between these users
    const existingRequest = await this.messageRequestRepository.findOne({
      where: {
        traineeId,
        coachId: createDto.coachId,
        status: MessageRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request with this coach',
      );
    }

    // Get trainee profile for additional context
    const traineeProfile = await this.traineeProfileRepository.findOne({
      where: { userId: traineeId },
    });

    // Create request with expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const request = this.messageRequestRepository.create({
      traineeId,
      coachId: createDto.coachId,
      initialMessage: createDto.initialMessage,
      reason: createDto.reason,
      status: MessageRequestStatus.PENDING,
      expiresAt,
      metadata: {
        ...createDto.metadata,
        traineeProfile: traineeProfile
          ? {
              age: traineeProfile.age,
              goal: traineeProfile.fitnessGoal,
              experience: traineeProfile.fitnessLevel,
            }
          : undefined,
      },
    });

    const savedRequest = await this.messageRequestRepository.save(request);

    this.logger.log(
      `Message request created: ${savedRequest.id} from trainee ${traineeId} to coach ${createDto.coachId}`,
    );

    return savedRequest;
  }

  /**
   * Respond to a message request (accept/reject)
   */
  async respondToMessageRequest(
    requestId: string,
    coachId: string,
    response: RespondToMessageRequestDto,
  ): Promise<MessageRequestEntity> {
    // Find the request
    const request = await this.messageRequestRepository.findOne({
      where: { id: requestId, coachId },
      relations: ['trainee', 'coach'],
    });

    if (!request) {
      throw new NotFoundException('Message request not found');
    }

    // Check if request is still pending
    if (request.status !== MessageRequestStatus.PENDING) {
      throw new BadRequestException(
        'This request has already been responded to',
      );
    }

    // Check if request has expired
    if (request.expiresAt && request.expiresAt < new Date()) {
      // Mark as expired
      request.status = MessageRequestStatus.EXPIRED;
      await this.messageRequestRepository.save(request);
      throw new BadRequestException('This request has expired');
    }

    // Update request status
    request.status =
      response.action === 'accept'
        ? MessageRequestStatus.ACCEPTED
        : MessageRequestStatus.REJECTED;
    request.responseMessage = response.responseMessage;
    request.respondedAt = new Date();

    const updatedRequest = await this.messageRequestRepository.save(request);

    this.logger.log(
      `Message request ${requestId} ${response.action}ed by coach ${coachId}`,
    );

    return updatedRequest;
  }

  /**
   * Get message requests for a coach (incoming requests)
   */
  async getCoachMessageRequests(
    coachId: string,
    filters: MessageRequestFilterDto,
  ): Promise<MessageRequestListDto> {
    const queryBuilder = this.createRequestQueryBuilder().where(
      'request.coachId = :coachId',
      { coachId },
    );

    this.applyRequestFilters(queryBuilder, filters);

    return this.executeRequestQuery(queryBuilder, filters);
  }

  /**
   * Get message requests for a trainee (outgoing requests)
   */
  async getTraineeMessageRequests(
    traineeId: string,
    filters: MessageRequestFilterDto,
  ): Promise<MessageRequestListDto> {
    const queryBuilder = this.createRequestQueryBuilder().where(
      'request.traineeId = :traineeId',
      { traineeId },
    );

    this.applyRequestFilters(queryBuilder, filters);

    return this.executeRequestQuery(queryBuilder, filters);
  }

  /**
   * Get a specific message request
   */
  async getMessageRequest(
    requestId: string,
    userId: string,
  ): Promise<MessageRequestEntity> {
    const request = await this.messageRequestRepository.findOne({
      where: { id: requestId },
      relations: ['trainee', 'coach'],
    });

    if (!request) {
      throw new NotFoundException('Message request not found');
    }

    // Verify user has access to this request
    if (request.traineeId !== userId && request.coachId !== userId) {
      throw new ForbiddenException('Access denied to this message request');
    }

    return request;
  }

  /**
   * Cancel a pending message request (trainee only)
   */
  async cancelMessageRequest(
    requestId: string,
    traineeId: string,
  ): Promise<void> {
    const request = await this.messageRequestRepository.findOne({
      where: { id: requestId, traineeId, status: MessageRequestStatus.PENDING },
    });

    if (!request) {
      throw new NotFoundException('Pending message request not found');
    }

    await this.messageRequestRepository.delete(requestId);

    this.logger.log(
      `Message request ${requestId} cancelled by trainee ${traineeId}`,
    );
  }

  /**
   * Get message request statistics for a user
   */
  async getMessageRequestStats(
    userId: string,
    userRole: UserRole,
  ): Promise<{
    totalRequests: number;
    pendingRequests: number;
    acceptedRequests: number;
    rejectedRequests: number;
    expiredRequests: number;
  }> {
    const whereClause =
      userRole === UserRole.COACH ? { coachId: userId } : { traineeId: userId };

    const [
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      expiredRequests,
    ] = await Promise.all([
      this.messageRequestRepository.count({ where: whereClause }),
      this.messageRequestRepository.count({
        where: { ...whereClause, status: MessageRequestStatus.PENDING },
      }),
      this.messageRequestRepository.count({
        where: { ...whereClause, status: MessageRequestStatus.ACCEPTED },
      }),
      this.messageRequestRepository.count({
        where: { ...whereClause, status: MessageRequestStatus.REJECTED },
      }),
      this.messageRequestRepository.count({
        where: { ...whereClause, status: MessageRequestStatus.EXPIRED },
      }),
    ]);

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      expiredRequests,
    };
  }

  /**
   * Format message request entity to DTO
   */
  async formatRequestToDto(
    request: MessageRequestEntity,
  ): Promise<MessageRequestDto> {
    // Load trainee and coach if not already loaded
    if (!request.trainee) {
      request.trainee = await this.userRepository.findOne({
        where: { id: request.traineeId },
      });
    }
    if (!request.coach) {
      request.coach = await this.userRepository.findOne({
        where: { id: request.coachId },
      });
    }

    // Get trainee profile for additional info
    const traineeProfile = await this.traineeProfileRepository.findOne({
      where: { userId: request.traineeId },
    });

    return {
      id: request.id,
      trainee: {
        id: request.trainee.id,
        firstName: request.trainee.firstName,
        lastName: request.trainee.lastName,
        profilePictureUrl: (request.trainee as any).profilePictureUrl,
        age: traineeProfile?.age,
        goal: traineeProfile?.fitnessGoal,
        experience: traineeProfile?.fitnessLevel,
      },
      coach: {
        id: request.coach.id,
        firstName: request.coach.firstName,
        lastName: request.coach.lastName,
        profilePictureUrl: (request.coach as any).profilePictureUrl,
      },
      initialMessage: request.initialMessage,
      reason: request.reason,
      status: request.status,
      responseMessage: request.responseMessage,
      metadata: request.metadata,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
      expiresAt: request.expiresAt,
    };
  }

  /**
   * Cron job to expire old pending requests
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldRequests(): Promise<void> {
    const now = new Date();
    const result = await this.messageRequestRepository.update(
      {
        status: MessageRequestStatus.PENDING,
        expiresAt: LessThan(now),
      },
      {
        status: MessageRequestStatus.EXPIRED,
      },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Expired ${result.affected} old message requests`);
    }
  }

  // Private helper methods
  private createRequestQueryBuilder(): SelectQueryBuilder<MessageRequestEntity> {
    return this.messageRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.trainee', 'trainee')
      .leftJoinAndSelect('request.coach', 'coach');
  }

  private applyRequestFilters(
    queryBuilder: SelectQueryBuilder<MessageRequestEntity>,
    filters: MessageRequestFilterDto,
  ): void {
    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: filters.status,
      });
    }
  }

  private async executeRequestQuery(
    queryBuilder: SelectQueryBuilder<MessageRequestEntity>,
    filters: MessageRequestFilterDto,
  ): Promise<MessageRequestListDto> {
    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (filters.page! - 1) * filters.limit!;
    queryBuilder.skip(offset).take(filters.limit!);

    // Order by creation date (newest first)
    queryBuilder.orderBy('request.createdAt', 'DESC');

    const requests = await queryBuilder.getMany();

    // Format requests to DTOs
    const requestDtos = await Promise.all(
      requests.map((request) => this.formatRequestToDto(request)),
    );

    return {
      requests: requestDtos,
      total,
      page: filters.page!,
      limit: filters.limit!,
    };
  }
}
