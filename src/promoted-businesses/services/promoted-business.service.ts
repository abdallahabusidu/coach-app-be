import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PromotedBusinessEntity,
  BusinessType,
  BusinessStatus,
  PromotionType,
  BusinessMetrics,
} from '../entities/promoted-business.entity';
import {
  BusinessUserInteractionEntity,
  InteractionType,
} from '../entities/business-user-interaction.entity';
import {
  CreatePromotedBusinessDto,
  UpdatePromotedBusinessDto,
  GetPromotedBusinessesDto,
  CreateInteractionDto,
  PromotedBusinessResponseDto,
  HomePageBusinessesResponseDto,
} from '../dtos/promoted-business.dto';

@Injectable()
export class PromotedBusinessService {
  constructor(
    @InjectRepository(PromotedBusinessEntity)
    private readonly businessRepository: Repository<PromotedBusinessEntity>,
    @InjectRepository(BusinessUserInteractionEntity)
    private readonly interactionRepository: Repository<BusinessUserInteractionEntity>,
  ) {}

  // Business CRUD Operations
  async createBusiness(
    createBusinessDto: CreatePromotedBusinessDto,
  ): Promise<PromotedBusinessEntity> {
    // Initialize default metrics
    const defaultMetrics: BusinessMetrics = {
      views: 0,
      clicks: 0,
      calls: 0,
      websiteVisits: 0,
      directionsRequested: 0,
      offersRedeemed: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      averageRating: 0,
      totalReviews: 0,
    };

    const business = this.businessRepository.create({
      ...createBusinessDto,
      metrics: defaultMetrics,
      status: BusinessStatus.PENDING,
      contractStartDate: createBusinessDto.contract.startDate,
      contractEndDate: createBusinessDto.contract.endDate,
      rating: 0,
      reviewCount: 0,
      isFeatured:
        createBusinessDto.promotionType === PromotionType.FEATURED ||
        createBusinessDto.promotionType === PromotionType.PREMIUM,
      isVerified: false,
      priority: createBusinessDto.priority || 5,
    });

    return await this.businessRepository.save(business);
  }

  async updateBusiness(
    id: string,
    updateBusinessDto: UpdatePromotedBusinessDto,
  ): Promise<PromotedBusinessEntity> {
    const business = await this.findBusinessById(id);

    Object.assign(business, updateBusinessDto);

    // Update contract dates if contract is updated
    if (updateBusinessDto.targeting) {
      // Recalculate any targeting-related metrics
    }

    return await this.businessRepository.save(business);
  }

  async deleteBusiness(id: string): Promise<void> {
    const business = await this.findBusinessById(id);
    await this.businessRepository.remove(business);
  }

  async findBusinessById(id: string): Promise<PromotedBusinessEntity> {
    const business = await this.businessRepository.findOne({
      where: { id },
    });

    if (!business) {
      throw new NotFoundException(`Business with ID ${id} not found`);
    }

    return business;
  }

  async getBusinesses(query: GetPromotedBusinessesDto): Promise<{
    businesses: PromotedBusinessResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      businessType,
      city,
      state,
      country,
      featured,
      activeOnly = true,
      minRating,
      maxDistance,
      latitude,
      longitude,
      sortBy = 'priority',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
      search,
      priceRange,
      hasOffers,
    } = query;

    let queryBuilder = this.businessRepository.createQueryBuilder('business');

    // Apply filters
    if (businessType) {
      queryBuilder.andWhere('business.businessType = :businessType', {
        businessType,
      });
    }

    if (activeOnly) {
      queryBuilder.andWhere('business.status = :status', {
        status: BusinessStatus.ACTIVE,
      });
      queryBuilder.andWhere('business.contractEndDate > :now', {
        now: new Date(),
      });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('business.isFeatured = :featured', { featured });
    }

    if (city) {
      queryBuilder.andWhere("business.location->>'city' ILIKE :city", {
        city: `%${city}%`,
      });
    }

    if (state) {
      queryBuilder.andWhere("business.location->>'state' ILIKE :state", {
        state: `%${state}%`,
      });
    }

    if (country) {
      queryBuilder.andWhere("business.location->>'country' ILIKE :country", {
        country: `%${country}%`,
      });
    }

    if (minRating) {
      queryBuilder.andWhere('business.rating >= :minRating', { minRating });
    }

    if (priceRange) {
      queryBuilder.andWhere('business.priceRange = :priceRange', {
        priceRange,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('business.businessName ILIKE :search', {
            search: `%${search}%`,
          })
            .orWhere('business.description ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('business.tagline ILIKE :search', {
              search: `%${search}%`,
            })
            .orWhere('business.categories && ARRAY[:search]', { search });
        }),
      );
    }

    if (hasOffers) {
      queryBuilder.andWhere(
        'business.offers IS NOT NULL AND jsonb_array_length(business.offers) > 0',
      );
    }

    // Distance filtering (if coordinates provided)
    if (latitude && longitude && maxDistance) {
      // Using Haversine formula for distance calculation
      queryBuilder.andWhere(
        `
        (6371 * acos(
          cos(radians(:latitude)) 
          * cos(radians(CAST(business.location->>'latitude' AS FLOAT))) 
          * cos(radians(CAST(business.location->>'longitude' AS FLOAT)) - radians(:longitude)) 
          + sin(radians(:latitude)) 
          * sin(radians(CAST(business.location->>'latitude' AS FLOAT)))
        )) <= :maxDistance
      `,
        { latitude, longitude, maxDistance },
      );
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        queryBuilder.orderBy('business.rating', sortOrder as 'ASC' | 'DESC');
        break;
      case 'distance':
        if (latitude && longitude) {
          queryBuilder.orderBy(
            `
            (6371 * acos(
              cos(radians(${latitude})) 
              * cos(radians(CAST(business.location->>'latitude' AS FLOAT))) 
              * cos(radians(CAST(business.location->>'longitude' AS FLOAT)) - radians(${longitude})) 
              + sin(radians(${latitude})) 
              * sin(radians(CAST(business.location->>'latitude' AS FLOAT)))
            ))
          `,
            sortOrder as 'ASC' | 'DESC',
          );
        } else {
          queryBuilder.orderBy('business.priority', 'DESC');
        }
        break;
      case 'priority':
        queryBuilder.orderBy('business.priority', sortOrder as 'ASC' | 'DESC');
        break;
      case 'name':
        queryBuilder.orderBy(
          'business.businessName',
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case 'created':
        queryBuilder.orderBy('business.createdAt', sortOrder as 'ASC' | 'DESC');
        break;
      default:
        queryBuilder.orderBy('business.priority', 'DESC');
    }

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [businesses, total] = await queryBuilder.getManyAndCount();

    // Calculate distance for each business if coordinates provided
    const businessesWithDistance = businesses.map((business) => {
      let distanceFromUser = 0;

      if (
        latitude &&
        longitude &&
        business.location.latitude &&
        business.location.longitude
      ) {
        distanceFromUser = this.calculateDistance(
          latitude,
          longitude,
          business.location.latitude,
          business.location.longitude,
        );
      }

      return this.mapBusinessToResponseDto(business, distanceFromUser);
    });

    return {
      businesses: businessesWithDistance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Home Page Methods
  async getHomePageBusinesses(
    userId?: string,
    latitude?: number,
    longitude?: number,
  ): Promise<HomePageBusinessesResponseDto> {
    // Get featured gyms
    const featuredGyms = await this.getFeaturedBusinesses(
      BusinessType.GYM,
      5, // limit to 5
      latitude,
      longitude,
    );

    // Get featured nutrition restaurants
    const featuredNutritionRestaurants = await this.getFeaturedBusinesses(
      BusinessType.NUTRITION_RESTAURANT,
      5, // limit to 5
      latitude,
      longitude,
    );

    // Get totals
    const totalGyms = await this.getBusinessCount(BusinessType.GYM);
    const totalNutritionRestaurants = await this.getBusinessCount(
      BusinessType.NUTRITION_RESTAURANT,
    );

    // Track views if user is provided
    if (userId) {
      await this.trackHomePageViews(
        userId,
        featuredGyms,
        featuredNutritionRestaurants,
      );
    }

    return {
      featuredGyms,
      featuredNutritionRestaurants,
      totalGyms,
      totalNutritionRestaurants,
      userLocation: latitude && longitude ? { latitude, longitude } : undefined,
    };
  }

  private async getFeaturedBusinesses(
    businessType: BusinessType,
    limit: number,
    latitude?: number,
    longitude?: number,
  ): Promise<PromotedBusinessResponseDto[]> {
    let queryBuilder = this.businessRepository
      .createQueryBuilder('business')
      .where('business.businessType = :businessType', { businessType })
      .andWhere('business.status = :status', { status: BusinessStatus.ACTIVE })
      .andWhere('business.contractEndDate > :now', { now: new Date() });

    // Prioritize featured businesses, then by priority, then by rating
    queryBuilder
      .orderBy('business.isFeatured', 'DESC')
      .addOrderBy('business.priority', 'DESC')
      .addOrderBy('business.rating', 'DESC');

    // If location provided, also consider distance
    if (latitude && longitude) {
      queryBuilder.addOrderBy(
        `
        (6371 * acos(
          cos(radians(${latitude})) 
          * cos(radians(CAST(business.location->>'latitude' AS FLOAT))) 
          * cos(radians(CAST(business.location->>'longitude' AS FLOAT)) - radians(${longitude})) 
          + sin(radians(${latitude})) 
          * sin(radians(CAST(business.location->>'latitude' AS FLOAT)))
        ))
      `,
        'ASC',
      );
    }

    queryBuilder.limit(limit);

    const businesses = await queryBuilder.getMany();

    return businesses.map((business) => {
      let distanceFromUser = 0;

      if (
        latitude &&
        longitude &&
        business.location.latitude &&
        business.location.longitude
      ) {
        distanceFromUser = this.calculateDistance(
          latitude,
          longitude,
          business.location.latitude,
          business.location.longitude,
        );
      }

      return this.mapBusinessToResponseDto(business, distanceFromUser);
    });
  }

  private async getBusinessCount(businessType: BusinessType): Promise<number> {
    return await this.businessRepository
      .createQueryBuilder('business')
      .where('business.businessType = :businessType', { businessType })
      .andWhere('business.status = :status', { status: BusinessStatus.ACTIVE })
      .andWhere('business.contractEndDate > :now', { now: new Date() })
      .getCount();
  }

  private async trackHomePageViews(
    userId: string,
    featuredGyms: PromotedBusinessResponseDto[],
    featuredNutritionRestaurants: PromotedBusinessResponseDto[],
  ): Promise<void> {
    const allBusinesses = [...featuredGyms, ...featuredNutritionRestaurants];

    for (const business of allBusinesses) {
      await this.createInteraction(
        {
          businessId: business.id,
          interactionType: InteractionType.VIEW,
          metadata: {
            sourceSection:
              business.businessType === BusinessType.GYM
                ? 'gym_section'
                : 'nutrition_section',
            deviceType: 'mobile', // This would come from request headers in real implementation
          },
        },
        userId,
      );
    }
  }

  // Interaction Methods
  async createInteraction(
    createInteractionDto: CreateInteractionDto,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<BusinessUserInteractionEntity> {
    // Verify business exists
    const business = await this.findBusinessById(
      createInteractionDto.businessId,
    );

    const interaction = this.interactionRepository.create({
      businessId: createInteractionDto.businessId,
      userId,
      interactionType: createInteractionDto.interactionType,
      metadata: createInteractionDto.metadata,
      sessionId: createInteractionDto.sessionId,
      ipAddress,
      userAgent,
    });

    const savedInteraction = await this.interactionRepository.save(interaction);

    // Update business metrics asynchronously
    await this.updateBusinessMetrics(createInteractionDto.businessId);

    return savedInteraction;
  }

  async getBusinessInteractions(
    businessId: string,
    interactionType?: InteractionType,
    limit: number = 100,
  ): Promise<BusinessUserInteractionEntity[]> {
    const queryBuilder = this.interactionRepository
      .createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.user', 'user')
      .where('interaction.businessId = :businessId', { businessId });

    if (interactionType) {
      queryBuilder.andWhere('interaction.interactionType = :interactionType', {
        interactionType,
      });
    }

    return await queryBuilder
      .orderBy('interaction.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Analytics Methods
  async getBusinessAnalytics(
    businessId: string,
    days: number = 30,
  ): Promise<any> {
    const business = await this.findBusinessById(businessId);
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get interaction counts by type
    const interactionStats = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select('interaction.interactionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('interaction.businessId = :businessId', { businessId })
      .andWhere('interaction.createdAt >= :fromDate', { fromDate })
      .groupBy('interaction.interactionType')
      .getRawMany();

    // Get daily interaction trends
    const dailyTrends = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select('DATE(interaction.createdAt)', 'date')
      .addSelect('interaction.interactionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('interaction.businessId = :businessId', { businessId })
      .andWhere('interaction.createdAt >= :fromDate', { fromDate })
      .groupBy('DATE(interaction.createdAt), interaction.interactionType')
      .orderBy('date', 'ASC')
      .getRawMany();

    // Calculate conversion metrics
    const totalViews = business.metrics.views;
    const totalClicks = business.metrics.clicks;
    const totalConversions =
      business.metrics.calls +
      business.metrics.websiteVisits +
      business.metrics.directionsRequested;

    return {
      business: {
        id: business.id,
        name: business.businessName,
        type: business.businessType,
        status: business.status,
      },
      period: {
        days,
        fromDate,
        toDate: new Date(),
      },
      metrics: {
        totalViews,
        totalClicks,
        totalConversions,
        clickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
        conversionRate:
          totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        rating: business.rating,
        reviewCount: business.reviewCount,
      },
      interactionStats,
      dailyTrends,
      contract: {
        startDate: business.contractStartDate,
        endDate: business.contractEndDate,
        daysRemaining: business.daysUntilExpiry,
        monthlyFee: business.contract.monthlyFee,
        totalRevenue: business.totalRevenueToDate,
      },
    };
  }

  // Business Status Management
  async activateBusiness(id: string): Promise<PromotedBusinessEntity> {
    const business = await this.findBusinessById(id);
    business.status = BusinessStatus.ACTIVE;
    return await this.businessRepository.save(business);
  }

  async suspendBusiness(id: string): Promise<PromotedBusinessEntity> {
    const business = await this.findBusinessById(id);
    business.status = BusinessStatus.SUSPENDED;
    return await this.businessRepository.save(business);
  }

  async expireBusiness(id: string): Promise<PromotedBusinessEntity> {
    const business = await this.findBusinessById(id);
    business.status = BusinessStatus.EXPIRED;
    return await this.businessRepository.save(business);
  }

  // Contract Management
  async renewContract(
    id: string,
    newEndDate: Date,
  ): Promise<PromotedBusinessEntity> {
    const business = await this.findBusinessById(id);
    business.contractEndDate = newEndDate;
    business.status = BusinessStatus.ACTIVE;
    return await this.businessRepository.save(business);
  }

  async getExpiringContracts(
    days: number = 30,
  ): Promise<PromotedBusinessEntity[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.businessRepository
      .createQueryBuilder('business')
      .where('business.contractEndDate <= :futureDate', { futureDate })
      .andWhere('business.contractEndDate > :now', { now: new Date() })
      .andWhere('business.status = :status', { status: BusinessStatus.ACTIVE })
      .orderBy('business.contractEndDate', 'ASC')
      .getMany();
  }

  // Utility Methods
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async updateBusinessMetrics(businessId: string): Promise<void> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30); // Last 30 days

    const metrics = await this.interactionRepository
      .createQueryBuilder('interaction')
      .select([
        'SUM(CASE WHEN interaction.interactionType = :view THEN 1 ELSE 0 END) as views',
        'SUM(CASE WHEN interaction.interactionType = :click THEN 1 ELSE 0 END) as clicks',
        'SUM(CASE WHEN interaction.interactionType = :call THEN 1 ELSE 0 END) as calls',
        'SUM(CASE WHEN interaction.interactionType = :website THEN 1 ELSE 0 END) as websiteVisits',
        'SUM(CASE WHEN interaction.interactionType = :directions THEN 1 ELSE 0 END) as directionsRequested',
        'SUM(CASE WHEN interaction.interactionType = :offerRedeem THEN 1 ELSE 0 END) as offersRedeemed',
      ])
      .where('interaction.businessId = :businessId', { businessId })
      .andWhere('interaction.createdAt >= :fromDate', { fromDate })
      .setParameters({
        view: InteractionType.VIEW,
        click: InteractionType.CLICK,
        call: InteractionType.CALL,
        website: InteractionType.WEBSITE_VISIT,
        directions: InteractionType.DIRECTIONS,
        offerRedeem: InteractionType.OFFER_REDEEM,
      })
      .getRawOne();

    const business = await this.findBusinessById(businessId);

    const updatedMetrics: BusinessMetrics = {
      views: parseInt(metrics.views) || 0,
      clicks: parseInt(metrics.clicks) || 0,
      calls: parseInt(metrics.calls) || 0,
      websiteVisits: parseInt(metrics.websiteVisits) || 0,
      directionsRequested: parseInt(metrics.directionsRequested) || 0,
      offersRedeemed: parseInt(metrics.offersRedeemed) || 0,
      clickThroughRate:
        metrics.views > 0 ? (metrics.clicks / metrics.views) * 100 : 0,
      conversionRate:
        metrics.clicks > 0
          ? ((metrics.calls +
              metrics.websiteVisits +
              metrics.directionsRequested) /
              metrics.clicks) *
            100
          : 0,
      averageRating: business.rating,
      totalReviews: business.reviewCount,
    };

    business.metrics = updatedMetrics;
    await this.businessRepository.save(business);
  }

  // Scheduled Tasks
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkExpiringContracts(): Promise<void> {
    const expiringBusinesses = await this.getExpiringContracts(7); // 7 days warning

    for (const business of expiringBusinesses) {
      // Here you would typically send notifications to business owners
      // and platform administrators about expiring contracts
      console.log(
        `Contract expiring for business: ${business.businessName} on ${business.contractEndDate}`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateExpiredBusinesses(): Promise<void> {
    const expiredBusinesses = await this.businessRepository
      .createQueryBuilder('business')
      .where('business.contractEndDate < :now', { now: new Date() })
      .andWhere('business.status = :status', { status: BusinessStatus.ACTIVE })
      .getMany();

    for (const business of expiredBusinesses) {
      business.status = BusinessStatus.EXPIRED;
      await this.businessRepository.save(business);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async updateAllBusinessMetrics(): Promise<void> {
    const activeBusinesses = await this.businessRepository
      .createQueryBuilder('business')
      .where('business.status = :status', { status: BusinessStatus.ACTIVE })
      .getMany();

    for (const business of activeBusinesses) {
      await this.updateBusinessMetrics(business.id);
    }
  }

  // Utility Methods
  private mapBusinessToResponseDto(
    business: PromotedBusinessEntity,
    distanceFromUser: number = 0,
  ): PromotedBusinessResponseDto {
    return {
      id: business.id,
      businessName: business.businessName,
      description: business.description,
      tagline: business.tagline,
      businessType: business.businessType,
      status: business.status,
      promotionType: business.promotionType,
      location: business.location,
      contact: business.contact,
      businessHours: business.businessHours,
      images: business.images,
      features: business.features,
      offers: business.offers,
      targeting: business.targeting,
      priority: business.priority,
      isFeatured: business.isFeatured,
      rating: business.rating,
      reviewCount: business.reviewCount,
      priceRange: business.priceRange,
      categories: business.categories,
      certifications: business.certifications,
      isVerified: business.isVerified,
      contractStartDate: business.contractStartDate,
      contractEndDate: business.contractEndDate,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      // Computed properties
      isActive: business.isActive,
      isContractExpiring: business.isContractExpiring,
      daysUntilExpiry: business.daysUntilExpiry,
      clickThroughRate: business.clickThroughRate,
      conversionRate: business.conversionRate,
      isOpenNow: business.isOpenNow,
      hasActiveOffers: business.hasActiveOffers,
      distanceFromUser,
      popularityScore: business.popularityScore,
    };
  }
}
