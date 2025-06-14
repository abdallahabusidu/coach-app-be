import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  FeedPostEntity,
  FeedPostStatus,
  FeedPostType,
  FeedPostVisibility,
} from '../entities/feed-post.entity';
import {
  FeedInteractionEntity,
  FeedInteractionType,
  FeedReactionType,
} from '../entities/feed-interaction.entity';
import { UserEntity, UserRole } from '../../auth/entities/user.entity';
import {
  CreateFeedPostDto,
  UpdateFeedPostDto,
  CreateFeedInteractionDto,
  FeedQueryDto,
  FeedPostResponseDto,
  FeedAnalyticsDto,
} from '../dtos/feed.dto';

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @InjectRepository(FeedPostEntity)
    private readonly feedPostRepository: Repository<FeedPostEntity>,

    @InjectRepository(FeedInteractionEntity)
    private readonly feedInteractionRepository: Repository<FeedInteractionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new feed post (Coach only)
   */
  async createFeedPost(
    coachId: string,
    createPostDto: CreateFeedPostDto,
  ): Promise<FeedPostResponseDto> {
    // Verify coach exists and has correct role
    const coach = await this.userRepository.findOne({
      where: { id: coachId, role: UserRole.COACH },
    });

    if (!coach) {
      throw new NotFoundException('Coach not found');
    }

    // Create initial engagement metrics
    const initialEngagement = {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      clickThroughRate: 0,
      engagementRate: 0,
      reachCount: 0,
      uniqueViews: 0,
    };

    // Create feed post
    const feedPost = new FeedPostEntity();
    feedPost.coach = coach;
    feedPost.coachId = coachId;
    feedPost.postType = createPostDto.postType;
    feedPost.title = createPostDto.title;
    feedPost.content = createPostDto.content;
    feedPost.summary = createPostDto.summary || null;
    feedPost.visibility =
      createPostDto.visibility || FeedPostVisibility.ALL_CLIENTS;
    feedPost.media = createPostDto.media || null;
    feedPost.challenge = createPostDto.challenge || null;
    feedPost.poll = createPostDto.poll || null;
    feedPost.liveSession = createPostDto.liveSession || null;
    feedPost.recipe = createPostDto.recipe || null;
    feedPost.workoutTip = createPostDto.workoutTip || null;
    feedPost.hashtags = createPostDto.hashtags || null;
    feedPost.targetAudience = createPostDto.targetAudience || null;
    feedPost.targetClientIds = createPostDto.targetClientIds || null;
    feedPost.requiredSubscriptionTier =
      createPostDto.requiredSubscriptionTier || null;
    feedPost.scheduledAt = createPostDto.scheduledAt
      ? new Date(createPostDto.scheduledAt)
      : null;
    feedPost.expiresAt = createPostDto.expiresAt
      ? new Date(createPostDto.expiresAt)
      : null;
    feedPost.priority = createPostDto.priority || 5;
    feedPost.isPinned = createPostDto.isPinned || false;
    feedPost.allowComments = createPostDto.allowComments !== false;
    feedPost.allowLikes = createPostDto.allowLikes !== false;
    feedPost.allowShares = createPostDto.allowShares !== false;
    feedPost.engagement = initialEngagement;
    feedPost.metadata = createPostDto.metadata || null;
    feedPost.externalUrl = createPostDto.externalUrl || null;
    feedPost.ctaText = createPostDto.ctaText || null;
    feedPost.ctaUrl = createPostDto.ctaUrl || null;

    // Set status and publication date
    if (feedPost.scheduledAt && feedPost.scheduledAt > new Date()) {
      feedPost.status = FeedPostStatus.SCHEDULED;
      feedPost.publishedAt = null;
    } else {
      feedPost.status = FeedPostStatus.PUBLISHED;
      feedPost.publishedAt = new Date();
    }

    // Generate URL slug
    feedPost.slug = this.generateSlug(feedPost.title);

    const savedPost = await this.feedPostRepository.save(feedPost);

    this.logger.log(`Feed post created: ${savedPost.id} by coach ${coachId}`);
    return this.transformPostToDto(savedPost, coachId);
  }

  /**
   * Update an existing feed post
   */
  async updateFeedPost(
    coachId: string,
    postId: string,
    updatePostDto: UpdateFeedPostDto,
  ): Promise<FeedPostResponseDto> {
    const feedPost = await this.feedPostRepository.findOne({
      where: { id: postId, coachId },
      relations: ['coach'],
    });

    if (!feedPost) {
      throw new NotFoundException('Feed post not found');
    }

    // Update fields
    if (updatePostDto.title !== undefined) feedPost.title = updatePostDto.title;
    if (updatePostDto.content !== undefined)
      feedPost.content = updatePostDto.content;
    if (updatePostDto.summary !== undefined)
      feedPost.summary = updatePostDto.summary;
    if (updatePostDto.visibility !== undefined)
      feedPost.visibility = updatePostDto.visibility;
    if (updatePostDto.media !== undefined) feedPost.media = updatePostDto.media;
    if (updatePostDto.hashtags !== undefined)
      feedPost.hashtags = updatePostDto.hashtags;
    if (updatePostDto.targetAudience !== undefined)
      feedPost.targetAudience = updatePostDto.targetAudience;
    if (updatePostDto.targetClientIds !== undefined)
      feedPost.targetClientIds = updatePostDto.targetClientIds;
    if (updatePostDto.priority !== undefined)
      feedPost.priority = updatePostDto.priority;
    if (updatePostDto.isPinned !== undefined)
      feedPost.isPinned = updatePostDto.isPinned;
    if (updatePostDto.allowComments !== undefined)
      feedPost.allowComments = updatePostDto.allowComments;
    if (updatePostDto.allowLikes !== undefined)
      feedPost.allowLikes = updatePostDto.allowLikes;
    if (updatePostDto.allowShares !== undefined)
      feedPost.allowShares = updatePostDto.allowShares;

    // Regenerate slug if title changed
    if (updatePostDto.title) {
      feedPost.slug = this.generateSlug(updatePostDto.title);
    }

    const savedPost = await this.feedPostRepository.save(feedPost);
    return this.transformPostToDto(savedPost, coachId);
  }

  /**
   * Delete a feed post
   */
  async deleteFeedPost(coachId: string, postId: string): Promise<void> {
    const feedPost = await this.feedPostRepository.findOne({
      where: { id: postId, coachId },
    });

    if (!feedPost) {
      throw new NotFoundException('Feed post not found');
    }

    // Soft delete by setting status to deleted
    feedPost.status = FeedPostStatus.DELETED;
    await this.feedPostRepository.save(feedPost);

    this.logger.log(`Feed post deleted: ${postId} by coach ${coachId}`);
  }

  /**
   * Get coach's own feed posts
   */
  async getCoachFeedPosts(
    coachId: string,
    query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    const queryBuilder = this.feedPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.coach', 'coach')
      .where('post.coachId = :coachId', { coachId })
      .andWhere('post.status != :deletedStatus', {
        deletedStatus: FeedPostStatus.DELETED,
      });

    // Apply filters
    this.applyFeedFilters(queryBuilder, query);

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination and sorting
    this.applyPaginationAndSorting(queryBuilder, query);

    const posts = await queryBuilder.getMany();
    const postDtos = await Promise.all(
      posts.map((post) => this.transformPostToDto(post, coachId)),
    );

    return {
      posts: postDtos,
      total: totalCount,
    };
  }

  /**
   * Get personalized feed for a trainee/client
   */
  async getPersonalizedFeed(
    userId: string,
    query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    // Get user and their coaches
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get coaches that this user is subscribed to or working with
    const coachIds = await this.getUserCoachIds(userId);

    if (coachIds.length === 0) {
      return { posts: [], total: 0 };
    }

    const queryBuilder = this.feedPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.coach', 'coach')
      .where('post.coachId IN (:...coachIds)', { coachIds })
      .andWhere('post.status = :publishedStatus', {
        publishedStatus: FeedPostStatus.PUBLISHED,
      })
      .andWhere('(post.expiresAt IS NULL OR post.expiresAt > :now)', {
        now: new Date(),
      });

    // Filter by visibility
    queryBuilder.andWhere(
      '(post.visibility = :allClients OR ' +
        '(post.visibility = :specificClients AND :userId = ANY(post.targetClientIds)) OR ' +
        'post.visibility = :public)',
      {
        allClients: FeedPostVisibility.ALL_CLIENTS,
        specificClients: FeedPostVisibility.SPECIFIC_CLIENTS,
        public: FeedPostVisibility.PUBLIC,
        userId,
      },
    );

    // Apply filters
    this.applyFeedFilters(queryBuilder, query);

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply personalized sorting (pinned first, then by engagement and recency)
    if (!query.sortBy) {
      queryBuilder
        .orderBy('post.isPinned', 'DESC')
        .addOrderBy('post.priority', 'DESC')
        .addOrderBy('post.publishedAt', 'DESC');
    } else {
      this.applyPaginationAndSorting(queryBuilder, query);
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const posts = await queryBuilder.getMany();
    const postDtos = await Promise.all(
      posts.map((post) => this.transformPostToDto(post, userId)),
    );

    return {
      posts: postDtos,
      total: totalCount,
    };
  }

  /**
   * Get public feed (for non-authenticated users or discovery)
   */
  async getPublicFeed(
    query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    const queryBuilder = this.feedPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.coach', 'coach')
      .where('post.status = :publishedStatus', {
        publishedStatus: FeedPostStatus.PUBLISHED,
      })
      .andWhere('post.visibility = :publicVisibility', {
        publicVisibility: FeedPostVisibility.PUBLIC,
      })
      .andWhere('(post.expiresAt IS NULL OR post.expiresAt > :now)', {
        now: new Date(),
      });

    // Apply filters
    this.applyFeedFilters(queryBuilder, query);

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination and sorting
    this.applyPaginationAndSorting(queryBuilder, query);

    const posts = await queryBuilder.getMany();
    const postDtos = await Promise.all(
      posts.map((post) => this.transformPostToDto(post, null)),
    );

    return {
      posts: postDtos,
      total: totalCount,
    };
  }

  /**
   * Get trending feed posts
   */
  async getTrendingFeed(
    query: FeedQueryDto,
  ): Promise<{ posts: FeedPostResponseDto[]; total: number }> {
    const queryBuilder = this.feedPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.coach', 'coach')
      .where('post.status = :publishedStatus', {
        publishedStatus: FeedPostStatus.PUBLISHED,
      })
      .andWhere('post.visibility IN (:...visibilities)', {
        visibilities: [
          FeedPostVisibility.PUBLIC,
          FeedPostVisibility.ALL_CLIENTS,
        ],
      })
      .andWhere('post.publishedAt > :recentDate', {
        recentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      });

    // Calculate trending score (engagement rate * recency factor)
    queryBuilder
      .addSelect(
        `(
          CAST(post.engagement->>'likes' AS INTEGER) + 
          CAST(post.engagement->>'comments' AS INTEGER) * 2 + 
          CAST(post.engagement->>'shares' AS INTEGER) * 3
        ) / GREATEST(CAST(post.engagement->>'views' AS INTEGER), 1) * 
        (1 + (EXTRACT(EPOCH FROM NOW() - post.publishedAt) / 86400))`,
        'trendingScore',
      )
      .orderBy('trendingScore', 'DESC');

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    const posts = await queryBuilder.getMany();
    const totalCount = await queryBuilder.getCount();

    const postDtos = await Promise.all(
      posts.map((post) => this.transformPostToDto(post, null)),
    );

    return {
      posts: postDtos,
      total: totalCount,
    };
  }

  /**
   * Get single feed post by ID
   */
  async getFeedPost(
    postId: string,
    userId?: string,
  ): Promise<FeedPostResponseDto> {
    const post = await this.feedPostRepository.findOne({
      where: { id: postId },
      relations: ['coach'],
    });

    if (!post) {
      throw new NotFoundException('Feed post not found');
    }

    // Check if user can view this post
    if (!this.canUserViewPost(post, userId)) {
      throw new ForbiddenException(
        'You do not have permission to view this post',
      );
    }

    // Track view if user is provided
    if (userId) {
      await this.trackInteraction(postId, userId, {
        interactionType: FeedInteractionType.VIEW,
      });
    }

    return this.transformPostToDto(post, userId);
  }

  /**
   * Create interaction with a feed post
   */
  async createInteraction(
    postId: string,
    userId: string,
    createInteractionDto: CreateFeedInteractionDto,
  ): Promise<{ success: boolean; message: string }> {
    const post = await this.feedPostRepository.findOne({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('Feed post not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user can interact with this post
    if (!this.canUserViewPost(post, userId)) {
      throw new ForbiddenException(
        'You do not have permission to interact with this post',
      );
    }

    // Validate interaction based on post settings
    if (
      createInteractionDto.interactionType === FeedInteractionType.LIKE &&
      !post.allowLikes
    ) {
      throw new BadRequestException('Likes are not allowed on this post');
    }

    if (
      createInteractionDto.interactionType === FeedInteractionType.COMMENT &&
      !post.allowComments
    ) {
      throw new BadRequestException('Comments are not allowed on this post');
    }

    if (
      createInteractionDto.interactionType === FeedInteractionType.SHARE &&
      !post.allowShares
    ) {
      throw new BadRequestException('Shares are not allowed on this post');
    }

    await this.trackInteraction(postId, userId, createInteractionDto);
    return { success: true, message: 'Interaction recorded successfully' };
  }

  /**
   * Get feed analytics for a coach
   */
  async getFeedAnalytics(coachId: string): Promise<FeedAnalyticsDto> {
    const posts = await this.feedPostRepository.find({
      where: { coachId },
    });

    const totalPosts = posts.length;
    const publishedPosts = posts.filter(
      (p) => p.status === FeedPostStatus.PUBLISHED,
    ).length;
    const draftPosts = posts.filter(
      (p) => p.status === FeedPostStatus.DRAFT,
    ).length;
    const scheduledPosts = posts.filter(
      (p) => p.status === FeedPostStatus.SCHEDULED,
    ).length;

    const totalViews = posts.reduce(
      (sum, post) => sum + post.engagement.views,
      0,
    );
    const totalLikes = posts.reduce(
      (sum, post) => sum + post.engagement.likes,
      0,
    );
    const totalComments = posts.reduce(
      (sum, post) => sum + post.engagement.comments,
      0,
    );
    const totalShares = posts.reduce(
      (sum, post) => sum + post.engagement.shares,
      0,
    );

    const averageEngagementRate =
      publishedPosts > 0
        ? posts
            .filter((p) => p.status === FeedPostStatus.PUBLISHED)
            .reduce((sum, post) => sum + post.engagementRate, 0) /
          publishedPosts
        : 0;

    // Calculate most popular post type
    const postTypeCounts = posts.reduce(
      (acc, post) => {
        acc[post.postType] = (acc[post.postType] || 0) + 1;
        return acc;
      },
      {} as Record<FeedPostType, number>,
    );

    const mostPopularPostType = Object.entries(postTypeCounts).reduce(
      (max, [type, count]) =>
        count > max.count ? { type: type as FeedPostType, count } : max,
      { type: FeedPostType.TEXT, count: 0 },
    ).type;

    // Get top hashtags
    const hashtagCounts = posts.reduce(
      (acc, post) => {
        if (post.hashtags) {
          post.hashtags.forEach((hashtag) => {
            if (!acc[hashtag]) {
              acc[hashtag] = { usage: 0, engagement: 0 };
            }
            acc[hashtag].usage += 1;
            acc[hashtag].engagement +=
              post.engagement.likes +
              post.engagement.comments +
              post.engagement.shares;
          });
        }
        return acc;
      },
      {} as Record<string, { usage: number; engagement: number }>,
    );

    const topHashtags = Object.entries(hashtagCounts)
      .map(([hashtag, data]) => ({ hashtag, ...data }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);

    // Get recent posts performance
    const recentPosts = posts
      .filter((p) => p.status === FeedPostStatus.PUBLISHED)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    const recentPostsPerformance = recentPosts.map((post) => ({
      postId: post.id,
      title: post.title,
      views: post.engagement.views,
      engagementRate: post.engagementRate,
      createdAt: post.createdAt,
    }));

    // Generate engagement over time (last 30 days)
    const engagementOverTime = this.generateEngagementOverTime(posts, 30);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      averageEngagementRate,
      mostPopularPostType,
      topHashtags,
      recentPostsPerformance,
      engagementOverTime,
    };
  }

  /**
   * Publish scheduled posts (cron job)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async publishScheduledPosts(): Promise<void> {
    const now = new Date();
    const scheduledPosts = await this.feedPostRepository.find({
      where: {
        status: FeedPostStatus.SCHEDULED,
        scheduledAt: In([`<= ${now.toISOString()}`]),
      },
    });

    for (const post of scheduledPosts) {
      post.status = FeedPostStatus.PUBLISHED;
      post.publishedAt = now;
      await this.feedPostRepository.save(post);
    }

    if (scheduledPosts.length > 0) {
      this.logger.log(`Published ${scheduledPosts.length} scheduled posts`);
    }
  }

  /**
   * Clean up expired posts (cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredPosts(): Promise<void> {
    const now = new Date();
    const expiredPosts = await this.feedPostRepository.find({
      where: {
        status: FeedPostStatus.PUBLISHED,
        expiresAt: In([`< ${now.toISOString()}`]),
      },
    });

    for (const post of expiredPosts) {
      post.status = FeedPostStatus.ARCHIVED;
      await this.feedPostRepository.save(post);
    }

    if (expiredPosts.length > 0) {
      this.logger.log(`Archived ${expiredPosts.length} expired posts`);
    }
  }

  /**
   * Helper methods
   */
  private async getUserCoachIds(userId: string): Promise<string[]> {
    // This would typically query subscribed-trainees or client-coach relationships
    // For now, returning empty array - implement based on your relationship structure

    // Example implementation:
    // const relationships = await this.subscribedTraineesRepository.find({
    //   where: { traineeId: userId, status: 'active' }
    // });
    // return relationships.map(rel => rel.coachId);

    return [];
  }

  private canUserViewPost(post: FeedPostEntity, userId?: string): boolean {
    if (!userId) {
      return post.visibility === FeedPostVisibility.PUBLIC;
    }

    switch (post.visibility) {
      case FeedPostVisibility.PUBLIC:
        return true;
      case FeedPostVisibility.ALL_CLIENTS:
        // Check if user is a client of this coach
        return true; // Implement coach-client relationship check
      case FeedPostVisibility.SPECIFIC_CLIENTS:
        return post.targetClientIds?.includes(userId) || false;
      case FeedPostVisibility.PREMIUM_ONLY:
        // Check if user has premium subscription
        return true; // Implement subscription check
      default:
        return false;
    }
  }

  private async trackInteraction(
    postId: string,
    userId: string,
    interactionDto: CreateFeedInteractionDto,
  ): Promise<void> {
    // Check if interaction already exists for non-tracking interactions
    if (
      ![FeedInteractionType.VIEW, FeedInteractionType.CLICK].includes(
        interactionDto.interactionType,
      )
    ) {
      const existingInteraction = await this.feedInteractionRepository.findOne({
        where: {
          postId,
          userId,
          interactionType: interactionDto.interactionType,
        },
      });

      if (existingInteraction) {
        // Update existing interaction instead of creating new one
        if (interactionDto.reactionType) {
          existingInteraction.reactionType = interactionDto.reactionType;
        }
        if (interactionDto.commentText) {
          existingInteraction.commentText = interactionDto.commentText;
        }
        if (interactionDto.metadata) {
          existingInteraction.metadata = interactionDto.metadata;
        }
        await this.feedInteractionRepository.save(existingInteraction);
        return;
      }
    }

    // Create new interaction
    const interaction = new FeedInteractionEntity();
    interaction.postId = postId;
    interaction.userId = userId;
    interaction.interactionType = interactionDto.interactionType;
    interaction.reactionType = interactionDto.reactionType || null;
    interaction.commentText = interactionDto.commentText || null;
    interaction.pollOptionId = interactionDto.pollOptionId || null;
    interaction.metadata = interactionDto.metadata || null;

    await this.feedInteractionRepository.save(interaction);

    // Update post engagement metrics
    await this.updatePostEngagementMetrics(postId);
  }

  private async updatePostEngagementMetrics(postId: string): Promise<void> {
    const post = await this.feedPostRepository.findOne({
      where: { id: postId },
    });
    if (!post) return;

    // Count interactions
    const interactions = await this.feedInteractionRepository.find({
      where: { postId },
    });

    const metrics = {
      views: interactions.filter(
        (i) => i.interactionType === FeedInteractionType.VIEW,
      ).length,
      likes: interactions.filter(
        (i) => i.interactionType === FeedInteractionType.LIKE,
      ).length,
      comments: interactions.filter(
        (i) => i.interactionType === FeedInteractionType.COMMENT,
      ).length,
      shares: interactions.filter(
        (i) => i.interactionType === FeedInteractionType.SHARE,
      ).length,
      saves: interactions.filter(
        (i) => i.interactionType === FeedInteractionType.SAVE,
      ).length,
      clickThroughRate: 0, // Calculate based on clicks vs views
      engagementRate: 0, // Will be calculated
      reachCount: 0, // Unique users who saw the post
      uniqueViews: new Set(
        interactions
          .filter((i) => i.interactionType === FeedInteractionType.VIEW)
          .map((i) => i.userId),
      ).size,
    };

    // Calculate engagement rate
    const totalEngagements = metrics.likes + metrics.comments + metrics.shares;
    metrics.engagementRate =
      metrics.views > 0 ? (totalEngagements / metrics.views) * 100 : 0;

    post.engagement = metrics;
    await this.feedPostRepository.save(post);
  }

  private async transformPostToDto(
    post: FeedPostEntity,
    userId?: string,
  ): Promise<FeedPostResponseDto> {
    let userInteractions = {
      hasLiked: false,
      hasCommented: false,
      hasShared: false,
      hasSaved: false,
      reactionType: undefined as FeedReactionType | undefined,
    };

    if (userId) {
      const interactions = await this.feedInteractionRepository.find({
        where: { postId: post.id, userId },
      });

      userInteractions.hasLiked = interactions.some(
        (i) => i.interactionType === FeedInteractionType.LIKE,
      );
      userInteractions.hasCommented = interactions.some(
        (i) => i.interactionType === FeedInteractionType.COMMENT,
      );
      userInteractions.hasShared = interactions.some(
        (i) => i.interactionType === FeedInteractionType.SHARE,
      );
      userInteractions.hasSaved = interactions.some(
        (i) => i.interactionType === FeedInteractionType.SAVE,
      );

      const likeInteraction = interactions.find(
        (i) => i.interactionType === FeedInteractionType.LIKE,
      );
      if (likeInteraction) {
        userInteractions.reactionType =
          likeInteraction.reactionType || undefined;
      }
    }

    return {
      id: post.id,
      coachId: post.coachId,
      coachName:
        post.coach?.firstName + ' ' + post.coach?.lastName || 'Unknown Coach',
      coachProfilePicture: undefined, // TODO: Add profile picture field to UserEntity
      postType: post.postType,
      status: post.status,
      visibility: post.visibility,
      title: post.title,
      content: post.content,
      summary: post.summary || undefined,
      media: post.media || undefined,
      challenge: post.challenge || undefined,
      poll: post.poll || undefined,
      liveSession: post.liveSession || undefined,
      recipe: post.recipe || undefined,
      workoutTip: post.workoutTip || undefined,
      hashtags: post.hashtags || undefined,
      targetAudience: post.targetAudience || undefined,
      priority: post.priority,
      isPinned: post.isPinned,
      allowComments: post.allowComments,
      allowLikes: post.allowLikes,
      allowShares: post.allowShares,
      engagement: {
        views: post.engagement.views,
        likes: post.engagement.likes,
        comments: post.engagement.comments,
        shares: post.engagement.shares,
        saves: post.engagement.saves,
        engagementRate: post.engagement.engagementRate,
      },
      userInteractions,
      externalUrl: post.externalUrl || undefined,
      ctaText: post.ctaText || undefined,
      ctaUrl: post.ctaUrl || undefined,
      scheduledAt: post.scheduledAt || undefined,
      publishedAt: post.publishedAt || undefined,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      computed: {
        isPublished: post.isPublished,
        isScheduled: post.isScheduled,
        isExpired: post.isExpired,
        isActive: post.isActive,
        engagementRate: post.engagementRate,
        readTime: post.readTime,
        hasMedia: post.hasMedia,
        isInteractive: post.isInteractive,
        popularityScore: post.popularityScore,
        isTrending: post.isTrending,
        ageInHours: post.ageInHours,
      },
    };
  }

  private applyFeedFilters(
    queryBuilder: SelectQueryBuilder<FeedPostEntity>,
    query: FeedQueryDto,
  ): void {
    if (query.postType) {
      queryBuilder.andWhere('post.postType = :postType', {
        postType: query.postType,
      });
    }

    if (query.coachId) {
      queryBuilder.andWhere('post.coachId = :coachId', {
        coachId: query.coachId,
      });
    }

    if (query.hashtags && query.hashtags.length > 0) {
      queryBuilder.andWhere('post.hashtags && :hashtags', {
        hashtags: query.hashtags,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search OR post.summary ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.pinnedOnly) {
      queryBuilder.andWhere('post.isPinned = true');
    }

    if (query.trendingOnly) {
      queryBuilder.andWhere('post.publishedAt > :recentDate', {
        recentDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      });
    }
  }

  private applyPaginationAndSorting(
    queryBuilder: SelectQueryBuilder<FeedPostEntity>,
    query: FeedQueryDto,
  ): void {
    // Apply sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';

    switch (sortBy) {
      case 'popularity':
        queryBuilder.orderBy(
          `(CAST(post.engagement->>'likes' AS INTEGER) + CAST(post.engagement->>'comments' AS INTEGER) * 2 + CAST(post.engagement->>'shares' AS INTEGER) * 3)`,
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case 'engagement':
        queryBuilder.orderBy(
          `CAST(post.engagement->>'engagementRate' AS DECIMAL)`,
          sortOrder as 'ASC' | 'DESC',
        );
        break;
      case 'trending':
        queryBuilder.orderBy(
          `(CAST(post.engagement->>'likes' AS INTEGER) + CAST(post.engagement->>'comments' AS INTEGER)) / GREATEST(EXTRACT(EPOCH FROM (NOW() - post.publishedAt)) / 3600, 1)`,
          'DESC',
        );
        break;
      default:
        queryBuilder.orderBy(`post.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100)
      .replace(/-+$/, '');
  }

  private generateEngagementOverTime(
    posts: FeedPostEntity[],
    days: number,
  ): Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const dateRange: Date[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dateRange.push(new Date(d));
    }

    return dateRange.map((date) => {
      const dayPosts = posts.filter((post) => {
        const postDate = new Date(post.publishedAt || post.createdAt);
        return postDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toISOString().split('T')[0],
        views: dayPosts.reduce((sum, post) => sum + post.engagement.views, 0),
        likes: dayPosts.reduce((sum, post) => sum + post.engagement.likes, 0),
        comments: dayPosts.reduce(
          (sum, post) => sum + post.engagement.comments,
          0,
        ),
        shares: dayPosts.reduce((sum, post) => sum + post.engagement.shares, 0),
      };
    });
  }
}
