import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsUrl,
} from 'class-validator';
import {
  FeedPostType,
  FeedPostStatus,
  FeedPostVisibility,
  FeedPostMedia,
  FeedPostChallenge,
  FeedPostPoll,
  FeedPostLiveSession,
  FeedPostRecipe,
  FeedPostWorkoutTip,
} from '../entities/feed-post.entity';
import {
  FeedInteractionType,
  FeedReactionType,
} from '../entities/feed-interaction.entity';

export class CreateFeedPostDto {
  @ApiProperty({ description: 'Type of feed post', enum: FeedPostType })
  @IsEnum(FeedPostType)
  postType: FeedPostType;

  @ApiProperty({ description: 'Post title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Post content/description' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Post summary/excerpt', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    description: 'Post visibility',
    enum: FeedPostVisibility,
    required: false,
  })
  @IsOptional()
  @IsEnum(FeedPostVisibility)
  visibility?: FeedPostVisibility;

  @ApiProperty({
    description: 'Media attachments',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  media?: FeedPostMedia[];

  @ApiProperty({
    description: 'Challenge details',
    type: Object,
    required: false,
  })
  @IsOptional()
  challenge?: FeedPostChallenge;

  @ApiProperty({ description: 'Poll details', type: Object, required: false })
  @IsOptional()
  poll?: FeedPostPoll;

  @ApiProperty({
    description: 'Live session details',
    type: Object,
    required: false,
  })
  @IsOptional()
  liveSession?: FeedPostLiveSession;

  @ApiProperty({ description: 'Recipe details', type: Object, required: false })
  @IsOptional()
  recipe?: FeedPostRecipe;

  @ApiProperty({
    description: 'Workout tip details',
    type: Object,
    required: false,
  })
  @IsOptional()
  workoutTip?: FeedPostWorkoutTip;

  @ApiProperty({ description: 'Hashtags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiProperty({
    description: 'Target audience tags',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @ApiProperty({
    description: 'Specific client IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetClientIds?: string[];

  @ApiProperty({ description: 'Required subscription tier', required: false })
  @IsOptional()
  @IsString()
  requiredSubscriptionTier?: string;

  @ApiProperty({ description: 'Scheduled publication date', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Post expiration date', required: false })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ description: 'Post priority (1-10)', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Pin post to top of feed', required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: 'Allow comments', required: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiProperty({ description: 'Allow likes', required: false })
  @IsOptional()
  @IsBoolean()
  allowLikes?: boolean;

  @ApiProperty({ description: 'Allow shares', required: false })
  @IsOptional()
  @IsBoolean()
  allowShares?: boolean;

  @ApiProperty({ description: 'External URL for link posts', required: false })
  @IsOptional()
  @IsUrl()
  externalUrl?: string;

  @ApiProperty({ description: 'Call-to-action button text', required: false })
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiProperty({ description: 'Call-to-action button URL', required: false })
  @IsOptional()
  @IsUrl()
  ctaUrl?: string;

  @ApiProperty({ description: 'Post metadata', type: Object, required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateFeedPostDto {
  @ApiProperty({ description: 'Post title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Post content/description', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'Post summary/excerpt', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    description: 'Post visibility',
    enum: FeedPostVisibility,
    required: false,
  })
  @IsOptional()
  @IsEnum(FeedPostVisibility)
  visibility?: FeedPostVisibility;

  @ApiProperty({
    description: 'Media attachments',
    type: [Object],
    required: false,
  })
  @IsOptional()
  @IsArray()
  media?: FeedPostMedia[];

  @ApiProperty({ description: 'Hashtags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiProperty({
    description: 'Target audience tags',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @ApiProperty({
    description: 'Specific client IDs',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetClientIds?: string[];

  @ApiProperty({ description: 'Post priority (1-10)', required: false })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiProperty({ description: 'Pin post to top of feed', required: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiProperty({ description: 'Allow comments', required: false })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiProperty({ description: 'Allow likes', required: false })
  @IsOptional()
  @IsBoolean()
  allowLikes?: boolean;

  @ApiProperty({ description: 'Allow shares', required: false })
  @IsOptional()
  @IsBoolean()
  allowShares?: boolean;
}

export class CreateFeedInteractionDto {
  @ApiProperty({
    description: 'Type of interaction',
    enum: FeedInteractionType,
  })
  @IsEnum(FeedInteractionType)
  interactionType: FeedInteractionType;

  @ApiProperty({
    description: 'Reaction type for likes',
    enum: FeedReactionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(FeedReactionType)
  reactionType?: FeedReactionType;

  @ApiProperty({ description: 'Comment text', required: false })
  @IsOptional()
  @IsString()
  commentText?: string;

  @ApiProperty({ description: 'Poll option ID', required: false })
  @IsOptional()
  @IsString()
  pollOptionId?: string;

  @ApiProperty({
    description: 'Additional metadata',
    type: Object,
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class FeedQueryDto {
  @ApiProperty({ description: 'Page number', required: false })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiProperty({
    description: 'Filter by post type',
    enum: FeedPostType,
    required: false,
  })
  @IsOptional()
  @IsEnum(FeedPostType)
  postType?: FeedPostType;

  @ApiProperty({ description: 'Filter by coach ID', required: false })
  @IsOptional()
  @IsString()
  coachId?: string;

  @ApiProperty({
    description: 'Filter by hashtags',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Sort by field', required: false })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'popularity' | 'engagement' | 'trending';

  @ApiProperty({ description: 'Sort order', required: false })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiProperty({ description: 'Show only pinned posts', required: false })
  @IsOptional()
  @IsBoolean()
  pinnedOnly?: boolean;

  @ApiProperty({ description: 'Show only trending posts', required: false })
  @IsOptional()
  @IsBoolean()
  trendingOnly?: boolean;
}

export class FeedPostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Coach ID' })
  coachId: string;

  @ApiProperty({ description: 'Coach name' })
  coachName: string;

  @ApiProperty({ description: 'Coach profile picture' })
  coachProfilePicture?: string;

  @ApiProperty({ description: 'Post type', enum: FeedPostType })
  postType: FeedPostType;

  @ApiProperty({ description: 'Post status', enum: FeedPostStatus })
  status: FeedPostStatus;

  @ApiProperty({ description: 'Post visibility', enum: FeedPostVisibility })
  visibility: FeedPostVisibility;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post summary' })
  summary?: string;

  @ApiProperty({ description: 'Media attachments' })
  media?: FeedPostMedia[];

  @ApiProperty({ description: 'Challenge details' })
  challenge?: FeedPostChallenge;

  @ApiProperty({ description: 'Poll details' })
  poll?: FeedPostPoll;

  @ApiProperty({ description: 'Live session details' })
  liveSession?: FeedPostLiveSession;

  @ApiProperty({ description: 'Recipe details' })
  recipe?: FeedPostRecipe;

  @ApiProperty({ description: 'Workout tip details' })
  workoutTip?: FeedPostWorkoutTip;

  @ApiProperty({ description: 'Hashtags' })
  hashtags?: string[];

  @ApiProperty({ description: 'Target audience' })
  targetAudience?: string[];

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiProperty({ description: 'Is pinned' })
  isPinned: boolean;

  @ApiProperty({ description: 'Allow comments' })
  allowComments: boolean;

  @ApiProperty({ description: 'Allow likes' })
  allowLikes: boolean;

  @ApiProperty({ description: 'Allow shares' })
  allowShares: boolean;

  @ApiProperty({ description: 'Engagement metrics' })
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    engagementRate: number;
  };

  @ApiProperty({ description: 'User interactions with this post' })
  userInteractions: {
    hasLiked: boolean;
    hasCommented: boolean;
    hasShared: boolean;
    hasSaved: boolean;
    reactionType?: FeedReactionType;
  };

  @ApiProperty({ description: 'External URL' })
  externalUrl?: string;

  @ApiProperty({ description: 'Call-to-action text' })
  ctaText?: string;

  @ApiProperty({ description: 'Call-to-action URL' })
  ctaUrl?: string;

  @ApiProperty({ description: 'Scheduled publication date' })
  scheduledAt?: Date;

  @ApiProperty({ description: 'Publication date' })
  publishedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Computed properties' })
  computed: {
    isPublished: boolean;
    isScheduled: boolean;
    isExpired: boolean;
    isActive: boolean;
    engagementRate: number;
    readTime: number;
    hasMedia: boolean;
    isInteractive: boolean;
    popularityScore: number;
    isTrending: boolean;
    ageInHours: number;
  };
}

export class FeedAnalyticsDto {
  @ApiProperty({ description: 'Total posts count' })
  totalPosts: number;

  @ApiProperty({ description: 'Published posts count' })
  publishedPosts: number;

  @ApiProperty({ description: 'Draft posts count' })
  draftPosts: number;

  @ApiProperty({ description: 'Scheduled posts count' })
  scheduledPosts: number;

  @ApiProperty({ description: 'Total views across all posts' })
  totalViews: number;

  @ApiProperty({ description: 'Total likes across all posts' })
  totalLikes: number;

  @ApiProperty({ description: 'Total comments across all posts' })
  totalComments: number;

  @ApiProperty({ description: 'Total shares across all posts' })
  totalShares: number;

  @ApiProperty({ description: 'Average engagement rate' })
  averageEngagementRate: number;

  @ApiProperty({ description: 'Most popular post type' })
  mostPopularPostType: FeedPostType;

  @ApiProperty({ description: 'Best performing hashtags' })
  topHashtags: Array<{
    hashtag: string;
    usage: number;
    engagement: number;
  }>;

  @ApiProperty({ description: 'Recent posts performance' })
  recentPostsPerformance: Array<{
    postId: string;
    title: string;
    views: number;
    engagementRate: number;
    createdAt: Date;
  }>;

  @ApiProperty({ description: 'Engagement over time' })
  engagementOverTime: Array<{
    date: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
}
