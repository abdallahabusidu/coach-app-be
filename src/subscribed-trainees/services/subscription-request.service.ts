import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, In } from 'typeorm';
import {
  SubscriptionRequestEntity,
  SubscriptionStatus,
  RequestType,
} from '../entities/subscription-request.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import { CoachProfileEntity } from '../../coach/entities/coach-profile.entity';
import { PackageEntity } from '../../coach/entities/package.entity';
import {
  CreateSubscriptionRequestDto,
  RespondToRequestDto,
  CoachSearchDto,
  SubscriptionRequestResponseDto,
  CoachSearchResponseDto,
  SubscriptionRequestListResponseDto,
  CoachSearchListResponseDto,
} from '../dtos/subscription-request.dto';

@Injectable()
export class SubscriptionRequestService {
  private readonly logger = new Logger(SubscriptionRequestService.name);

  constructor(
    @InjectRepository(SubscriptionRequestEntity)
    private readonly subscriptionRequestRepository: Repository<SubscriptionRequestEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(CoachProfileEntity)
    private readonly coachProfileRepository: Repository<CoachProfileEntity>,

    @InjectRepository(PackageEntity)
    private readonly packageRepository: Repository<PackageEntity>,
  ) {}

  /**
   * Search for coaches with filtering
   */
  async searchCoaches(
    traineeId: string,
    searchDto: CoachSearchDto,
  ): Promise<CoachSearchListResponseDto> {
    const queryBuilder = this.coachProfileRepository
      .createQueryBuilder('coach_profile')
      .leftJoinAndSelect('coach_profile.user', 'user')
      .leftJoinAndSelect('coach_profile.packages', 'packages')
      .where('user.role = :role', { role: UserRole.COACH })
      .andWhere('user.isActive = true');

    // Apply search filters
    this.applyCoachFilters(queryBuilder, searchDto);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply sorting
    this.applyCoachSorting(queryBuilder, searchDto);

    // Apply pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const coachProfiles = await queryBuilder.getMany();

    // Get existing requests for the trainee
    const existingRequests = await this.subscriptionRequestRepository.find({
      where: {
        traineeId,
        coachId: In(coachProfiles.map((cp) => cp.userId)),
        status: In([
          SubscriptionStatus.PENDING,
          SubscriptionStatus.APPROVED,
          SubscriptionStatus.ACTIVE,
        ]),
      },
    });

    const existingRequestMap = new Map(
      existingRequests.map((req) => [req.coachId, req]),
    );

    // Transform to response DTOs
    const coaches = await Promise.all(
      coachProfiles.map(async (coachProfile) => {
        const existingRequest = existingRequestMap.get(coachProfile.userId);
        return this.transformCoachToSearchDto(coachProfile, existingRequest);
      }),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      coaches,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
      appliedFilters: {
        specializations: searchDto.specializations,
        experienceLevel: searchDto.experienceLevel,
        minRating: searchDto.minRating,
        maxPrice: searchDto.maxPrice,
        location: searchDto.location,
        availableOnly: searchDto.availableOnly,
      },
    };
  }

  /**
   * Create a subscription request
   */
  async createSubscriptionRequest(
    traineeId: string,
    createDto: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    // Verify trainee exists
    const trainee = await this.userRepository.findOne({
      where: { id: traineeId, role: UserRole.TRAINEE },
    });

    if (!trainee) {
      throw new NotFoundException('Trainee not found');
    }

    // Verify coach exists and is active
    const coach = await this.userRepository.findOne({
      where: { id: createDto.coachId, role: UserRole.COACH, isActive: true },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found or inactive');
    }

    // Get coach profile to check availability
    const coachProfile = await this.coachProfileRepository.findOne({
      where: { userId: createDto.coachId },
    });

    if (!coachProfile) {
      throw new NotFoundException('Coach profile not found');
    }

    // Check for existing active request
    const existingRequest = await this.subscriptionRequestRepository.findOne({
      where: {
        traineeId,
        coachId: createDto.coachId,
        status: In([
          SubscriptionStatus.PENDING,
          SubscriptionStatus.APPROVED,
          SubscriptionStatus.ACTIVE,
        ]),
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have an active or pending request with this coach',
      );
    }

    // Verify package if provided
    let packageEntity: PackageEntity | undefined;
    if (createDto.packageId) {
      packageEntity = await this.packageRepository.findOne({
        where: { id: createDto.packageId },
      });

      if (!packageEntity) {
        throw new NotFoundException('Package not found');
      }
    }

    // Set expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create subscription request
    const subscriptionRequest = this.subscriptionRequestRepository.create({
      traineeId,
      coachId: createDto.coachId,
      packageId: createDto.packageId,
      requestType: createDto.requestType,
      traineeMessage: createDto.traineeMessage,
      traineeGoals: createDto.traineeGoals,
      subscriptionDetails: createDto.subscriptionDetails,
      priority: createDto.priority || 'medium',
      source: createDto.source || 'search',
      canMessage: createDto.canMessage !== false,
      canViewProfile: createDto.canViewProfile !== false,
      expiresAt,
      coachRatingAtRequest: coachProfile?.rating,
    });

    const savedRequest =
      await this.subscriptionRequestRepository.save(subscriptionRequest);

    // TODO: Send notification to coach about new request

    return this.transformRequestToResponseDto(
      savedRequest,
      trainee,
      coach,
      packageEntity,
    );
  }

  /**
   * Get subscription requests for user
   */
  async getSubscriptionRequests(
    userId: string,
    userRole: UserRole,
    filters: {
      status?: SubscriptionStatus;
      requestType?: RequestType;
      coachId?: string;
      traineeId?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<SubscriptionRequestListResponseDto> {
    const queryBuilder = this.subscriptionRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.trainee', 'trainee')
      .leftJoinAndSelect('request.coach', 'coach')
      .leftJoinAndSelect('coach.coachProfile', 'coachProfile')
      .leftJoinAndSelect('request.package', 'package');

    // Apply role-based filtering
    if (userRole === UserRole.COACH) {
      queryBuilder.where('request.coachId = :userId', { userId });
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.where('request.traineeId = :userId', { userId });
    }

    // Apply additional filters
    this.applyRequestFilters(queryBuilder, filters);

    // Get total count before pagination
    const totalCount = await queryBuilder.getCount();

    // Apply sorting (newest first)
    queryBuilder.orderBy('request.createdAt', 'DESC');

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const requests = await queryBuilder.getMany();

    // Transform to response DTOs
    const requestDtos = requests.map((request) =>
      this.transformRequestToResponseDto(request),
    );

    // Calculate summary
    const summary = await this.calculateRequestSummary(userId, userRole);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      requests: requestDtos,
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
   * Get subscription request by ID
   */
  async getSubscriptionRequestById(
    requestId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<SubscriptionRequestResponseDto> {
    const queryBuilder = this.subscriptionRequestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.trainee', 'trainee')
      .leftJoinAndSelect('request.coach', 'coach')
      .leftJoinAndSelect('coach.coachProfile', 'coachProfile')
      .leftJoinAndSelect('request.package', 'package')
      .where('request.id = :requestId', { requestId });

    // Apply access control
    if (userRole === UserRole.COACH) {
      queryBuilder.andWhere('request.coachId = :userId', { userId });
    } else if (userRole === UserRole.TRAINEE) {
      queryBuilder.andWhere('request.traineeId = :userId', { userId });
    }

    const request = await queryBuilder.getOne();

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    return this.transformRequestToResponseDto(request);
  }

  /**
   * Respond to subscription request (Coach only)
   */
  async respondToSubscriptionRequest(
    requestId: string,
    coachId: string,
    responseDto: RespondToRequestDto,
  ): Promise<SubscriptionRequestResponseDto> {
    const request = await this.subscriptionRequestRepository.findOne({
      where: { id: requestId, coachId },
      relations: ['trainee', 'coach', 'coach.coachProfile', 'package'],
    });

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    if (request.status !== SubscriptionStatus.PENDING) {
      throw new BadRequestException('Request has already been responded to');
    }

    // Update request with response
    request.status = responseDto.status;
    request.coachResponse = responseDto.coachResponse;
    request.coachTerms = responseDto.coachTerms;
    request.respondedAt = new Date();

    if (responseDto.status === SubscriptionStatus.APPROVED) {
      request.startDate = responseDto.startDate
        ? new Date(responseDto.startDate)
        : new Date();
      request.endDate = responseDto.endDate
        ? new Date(responseDto.endDate)
        : undefined;
      request.monthlyFee = responseDto.monthlyFee;
      request.activatedAt = new Date();

      // TODO: Create subscription record in billing system
      // TODO: Send approval notification to trainee
    } else {
      // TODO: Send rejection notification to trainee
    }

    const updatedRequest =
      await this.subscriptionRequestRepository.save(request);

    return this.transformRequestToResponseDto(updatedRequest);
  }

  /**
   * Cancel subscription request (Trainee only)
   */
  async cancelSubscriptionRequest(
    requestId: string,
    traineeId: string,
  ): Promise<void> {
    const request = await this.subscriptionRequestRepository.findOne({
      where: { id: requestId, traineeId },
    });

    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    if (request.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot cancel an active subscription. Please contact support.',
      );
    }

    request.status = SubscriptionStatus.CANCELLED;
    await this.subscriptionRequestRepository.save(request);

    // TODO: Send cancellation notification to coach
  }

  /**
   * Check if trainee can message coach
   */
  async canTraineeMessageCoach(
    traineeId: string,
    coachId: string,
  ): Promise<boolean> {
    const request = await this.subscriptionRequestRepository.findOne({
      where: {
        traineeId,
        coachId,
        status: In([
          SubscriptionStatus.PENDING,
          SubscriptionStatus.APPROVED,
          SubscriptionStatus.ACTIVE,
        ]),
      },
    });

    return request?.canMessage || false;
  }

  /**
   * Check if coach can view trainee profile
   */
  async canCoachViewTraineeProfile(
    coachId: string,
    traineeId: string,
  ): Promise<boolean> {
    const request = await this.subscriptionRequestRepository.findOne({
      where: {
        traineeId,
        coachId,
        status: In([
          SubscriptionStatus.PENDING,
          SubscriptionStatus.APPROVED,
          SubscriptionStatus.ACTIVE,
        ]),
      },
    });

    return request?.canViewProfile || false;
  }

  /**
   * Get coach's active trainees
   */
  async getCoachActiveTrainees(
    coachId: string,
  ): Promise<SubscriptionRequestResponseDto[]> {
    const requests = await this.subscriptionRequestRepository.find({
      where: {
        coachId,
        status: In([SubscriptionStatus.APPROVED, SubscriptionStatus.ACTIVE]),
      },
      relations: ['trainee', 'coach', 'package'],
      order: { activatedAt: 'DESC' },
    });

    return requests.map((request) =>
      this.transformRequestToResponseDto(request),
    );
  }

  /**
   * Get trainee's active coaches
   */
  async getTraineeActiveCoaches(
    traineeId: string,
  ): Promise<SubscriptionRequestResponseDto[]> {
    const requests = await this.subscriptionRequestRepository.find({
      where: {
        traineeId,
        status: In([SubscriptionStatus.APPROVED, SubscriptionStatus.ACTIVE]),
      },
      relations: ['trainee', 'coach', 'coach.coachProfile', 'package'],
      order: { activatedAt: 'DESC' },
    });

    return requests.map((request) =>
      this.transformRequestToResponseDto(request),
    );
  }

  /**
   * Update message count for request
   */
  async incrementMessageCount(
    traineeId: string,
    coachId: string,
  ): Promise<void> {
    await this.subscriptionRequestRepository
      .createQueryBuilder()
      .update(SubscriptionRequestEntity)
      .set({
        messageCount: () => 'messageCount + 1',
        lastInteractionAt: new Date(),
      })
      .where('traineeId = :traineeId', { traineeId })
      .andWhere('coachId = :coachId', { coachId })
      .andWhere('status IN (:...statuses)', {
        statuses: [
          SubscriptionStatus.PENDING,
          SubscriptionStatus.APPROVED,
          SubscriptionStatus.ACTIVE,
        ],
      })
      .execute();
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<void> {
    const now = new Date();

    await this.subscriptionRequestRepository
      .createQueryBuilder()
      .update(SubscriptionRequestEntity)
      .set({ status: SubscriptionStatus.EXPIRED })
      .where('expiresAt < :now', { now })
      .andWhere('status = :status', { status: SubscriptionStatus.PENDING })
      .execute();

    this.logger.log('Cleaned up expired subscription requests');
  }

  /**
   * Apply coach search filters
   */
  private applyCoachFilters(
    queryBuilder: SelectQueryBuilder<CoachProfileEntity>,
    filters: CoachSearchDto,
  ): void {
    if (filters.query) {
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE LOWER(:query) OR LOWER(user.lastName) LIKE LOWER(:query) OR LOWER(coach_profile.bio) LIKE LOWER(:query))',
        { query: `%${filters.query}%` },
      );
    }

    if (filters.specializations && filters.specializations.length > 0) {
      queryBuilder.andWhere(
        'coach_profile.specializations && :specializations',
        {
          specializations: filters.specializations,
        },
      );
    }

    if (filters.experienceLevel) {
      queryBuilder.andWhere(
        'coach_profile.experienceLevel = :experienceLevel',
        {
          experienceLevel: filters.experienceLevel,
        },
      );
    }

    if (filters.minRating) {
      queryBuilder.andWhere('coach_profile.averageRating >= :minRating', {
        minRating: filters.minRating,
      });
    }

    if (filters.maxPrice) {
      queryBuilder.andWhere('coach_profile.startingPrice <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    if (filters.location) {
      queryBuilder.andWhere(
        'LOWER(coach_profile.location) LIKE LOWER(:location)',
        {
          location: `%${filters.location}%`,
        },
      );
    }

    if (filters.gender) {
      queryBuilder.andWhere('user.gender = :gender', {
        gender: filters.gender,
      });
    }

    if (filters.availableOnly) {
      queryBuilder.andWhere('coach_profile.isAcceptingClients = true');
    }
  }

  /**
   * Apply coach search sorting
   */
  private applyCoachSorting(
    queryBuilder: SelectQueryBuilder<CoachProfileEntity>,
    filters: CoachSearchDto,
  ): void {
    const sortBy = filters.sortBy || 'rating';
    const sortOrder = filters.sortOrder || 'DESC';

    switch (sortBy) {
      case 'rating':
        queryBuilder.orderBy('coach_profile.averageRating', sortOrder);
        break;
      case 'price':
        queryBuilder.orderBy('coach_profile.startingPrice', sortOrder);
        break;
      case 'experience':
        queryBuilder.orderBy('coach_profile.yearsOfExperience', sortOrder);
        break;
      case 'name':
        queryBuilder.orderBy('user.firstName', sortOrder);
        break;
      case 'created_at':
        queryBuilder.orderBy('coach_profile.createdAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('coach_profile.averageRating', 'DESC');
    }
  }

  /**
   * Apply request filters
   */
  private applyRequestFilters(
    queryBuilder: SelectQueryBuilder<SubscriptionRequestEntity>,
    filters: any,
  ): void {
    if (filters.status) {
      queryBuilder.andWhere('request.status = :status', {
        status: filters.status,
      });
    }

    if (filters.requestType) {
      queryBuilder.andWhere('request.requestType = :requestType', {
        requestType: filters.requestType,
      });
    }

    if (filters.coachId) {
      queryBuilder.andWhere('request.coachId = :coachId', {
        coachId: filters.coachId,
      });
    }

    if (filters.traineeId) {
      queryBuilder.andWhere('request.traineeId = :traineeId', {
        traineeId: filters.traineeId,
      });
    }
  }

  /**
   * Calculate request summary statistics
   */
  private async calculateRequestSummary(
    userId: string,
    userRole: UserRole,
  ): Promise<any> {
    const whereClause =
      userRole === UserRole.COACH ? { coachId: userId } : { traineeId: userId };

    const [total, pending, approved, rejected, active] = await Promise.all([
      this.subscriptionRequestRepository.count({ where: whereClause }),
      this.subscriptionRequestRepository.count({
        where: { ...whereClause, status: SubscriptionStatus.PENDING },
      }),
      this.subscriptionRequestRepository.count({
        where: { ...whereClause, status: SubscriptionStatus.APPROVED },
      }),
      this.subscriptionRequestRepository.count({
        where: { ...whereClause, status: SubscriptionStatus.REJECTED },
      }),
      this.subscriptionRequestRepository.count({
        where: { ...whereClause, status: SubscriptionStatus.ACTIVE },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      active,
    };
  }

  /**
   * Transform coach profile to search response DTO
   */
  private transformCoachToSearchDto(
    coachProfile: CoachProfileEntity,
    existingRequest?: SubscriptionRequestEntity,
  ): CoachSearchResponseDto {
    const hasExistingRequest = !!existingRequest;
    const canSendRequest =
      !hasExistingRequest ||
      existingRequest.status === SubscriptionStatus.REJECTED;

    return {
      id: coachProfile.userId,
      name: `${coachProfile.user.firstName} ${coachProfile.user.lastName}`,
      email: coachProfile.user.email,
      profilePicture: coachProfile.profilePictureUrl,
      bio: coachProfile.bio,
      specializations: coachProfile.specialization
        ? [coachProfile.specialization]
        : [],
      yearsOfExperience: coachProfile.yearsOfExperience,
      rating: coachProfile.rating,
      reviewCount: coachProfile.totalRatings,
      startingPrice: coachProfile.hourlyRate,
      location: coachProfile.location,
      isAcceptingClients: true, // Default to true, can be updated based on business logic
      activeClientCount: 0, // This would need to be calculated separately
      averageResponseTime: 24, // Default 24 hours, can be calculated separately
      successRate: 95, // Default success rate, can be calculated separately
      certifications: coachProfile.certificates || [],
      languages: ['English'], // Default language, can be added to profile later
      packages: [], // Packages would be loaded separately
      hasExistingRequest,
      canSendRequest,
    };
  }

  /**
   * Transform subscription request to response DTO
   */
  private transformRequestToResponseDto(
    request: SubscriptionRequestEntity,
    trainee?: UserEntity,
    coach?: UserEntity,
    packageEntity?: PackageEntity,
  ): SubscriptionRequestResponseDto {
    const now = new Date();
    const daysSinceRequest = Math.floor(
      (now.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isExpired = request.expiresAt ? now > request.expiresAt : false;

    return {
      id: request.id,
      trainee:
        trainee || request.trainee
          ? {
              id: (trainee || request.trainee).id,
              name: `${(trainee || request.trainee).firstName} ${(trainee || request.trainee).lastName}`,
              email: (trainee || request.trainee).email,
              profilePicture: undefined, // No profile picture field in UserEntity
            }
          : { id: request.traineeId, name: 'Unknown Trainee', email: '' },
      coach:
        coach || request.coach
          ? {
              id: (coach || request.coach).id,
              name: `${(coach || request.coach).firstName} ${(coach || request.coach).lastName}`,
              email: (coach || request.coach).email,
              profilePicture: undefined, // No profile picture field in UserEntity
              specializations: [], // Would need to fetch coach profile separately
              rating: undefined, // Would need to fetch coach profile separately
            }
          : { id: request.coachId, name: 'Unknown Coach', email: '' },
      package:
        packageEntity || request.package
          ? {
              id: (packageEntity || request.package).id,
              title: (packageEntity || request.package).title,
              price: (packageEntity || request.package).price,
              duration: (packageEntity || request.package).duration,
            }
          : undefined,
      requestType: request.requestType,
      status: request.status,
      traineeMessage: request.traineeMessage,
      coachResponse: request.coachResponse,
      traineeGoals: request.traineeGoals,
      subscriptionDetails: request.subscriptionDetails,
      coachTerms: request.coachTerms,
      startDate: request.startDate,
      endDate: request.endDate,
      monthlyFee: request.monthlyFee,
      currency: request.currency,
      paymentStatus: request.paymentStatus,
      priority: request.priority,
      source: request.source,
      canMessage: request.canMessage,
      canViewProfile: request.canViewProfile,
      messageCount: request.messageCount,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      respondedAt: request.respondedAt,
      activatedAt: request.activatedAt,
      daysSinceRequest,
      isExpired,
    };
  }
}
