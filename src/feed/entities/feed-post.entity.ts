import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';

export enum FeedPostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  WORKOUT_TIP = 'workout_tip',
  NUTRITION_TIP = 'nutrition_tip',
  MOTIVATION = 'motivation',
  SUCCESS_STORY = 'success_story',
  ANNOUNCEMENT = 'announcement',
  CHALLENGE = 'challenge',
  POLL = 'poll',
  LIVE_SESSION = 'live_session',
  RECIPE = 'recipe',
  EXERCISE_DEMO = 'exercise_demo',
  PROGRESS_UPDATE = 'progress_update',
}

export enum FeedPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  SCHEDULED = 'scheduled',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum FeedPostVisibility {
  ALL_CLIENTS = 'all_clients',
  SPECIFIC_CLIENTS = 'specific_clients',
  SUBSCRIPTION_TIER = 'subscription_tier',
  PUBLIC = 'public',
  PREMIUM_ONLY = 'premium_only',
}

export interface FeedPostMedia {
  type: 'image' | 'video' | 'document' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number; // for videos/audio in seconds
  size?: number; // file size in bytes
  dimensions?: {
    width: number;
    height: number;
  };
  caption?: string;
  altText?: string;
}

export interface FeedPostChallenge {
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'habit' | 'mindset';
  duration: number; // in days
  startDate: Date;
  endDate: Date;
  rewards?: string[];
  rules?: string[];
  trackingMetrics?: string[];
}

export interface FeedPostPoll {
  question: string;
  options: Array<{
    id: string;
    text: string;
    voteCount: number;
  }>;
  allowMultipleChoices: boolean;
  expiresAt?: Date;
  totalVotes: number;
}

export interface FeedPostLiveSession {
  title: string;
  description: string;
  type: 'workout' | 'nutrition' | 'q_and_a' | 'motivation';
  scheduledAt: Date;
  duration: number; // in minutes
  maxParticipants?: number;
  currentParticipants: number;
  meetingLink?: string;
  isRecorded: boolean;
  recordingUrl?: string;
}

export interface FeedPostRecipe {
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    notes?: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
    duration?: number;
    temperature?: string;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietaryTags?: string[]; // vegan, gluten-free, etc.
}

export interface FeedPostWorkoutTip {
  title: string;
  targetMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  instructions?: string[];
  commonMistakes?: string[];
  variations?: string[];
  safetyTips?: string[];
}

export interface FeedPostEngagement {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clickThroughRate: number;
  engagementRate: number;
  reachCount: number;
  uniqueViews: number;
}

@Entity('feed_posts')
@Index(['coachId', 'status'])
@Index(['postType', 'status'])
@Index(['createdAt'])
@Index(['scheduledAt'])
@Index(['visibility'])
export class FeedPostEntity {
  @ApiProperty({ description: 'Unique identifier for the feed post' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Coach who created the post' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach user ID' })
  @Column('uuid')
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Type of feed post', enum: FeedPostType })
  @Column({
    type: 'enum',
    enum: FeedPostType,
    default: FeedPostType.TEXT,
  })
  @Index()
  postType: FeedPostType;

  @ApiProperty({ description: 'Post status', enum: FeedPostStatus })
  @Column({
    type: 'enum',
    enum: FeedPostStatus,
    default: FeedPostStatus.DRAFT,
  })
  @Index()
  status: FeedPostStatus;

  @ApiProperty({ description: 'Post visibility', enum: FeedPostVisibility })
  @Column({
    type: 'enum',
    enum: FeedPostVisibility,
    default: FeedPostVisibility.ALL_CLIENTS,
  })
  visibility: FeedPostVisibility;

  @ApiProperty({ description: 'Post title' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Post content/description' })
  @Column('text')
  content: string;

  @ApiProperty({ description: 'Post summary/excerpt' })
  @Column({ nullable: true })
  summary: string | null;

  @ApiProperty({ description: 'Media attachments' })
  @Column('jsonb', { nullable: true })
  media: FeedPostMedia[] | null;

  @ApiProperty({ description: 'Challenge details (if challenge post)' })
  @Column('jsonb', { nullable: true })
  challenge: FeedPostChallenge | null;

  @ApiProperty({ description: 'Poll details (if poll post)' })
  @Column('jsonb', { nullable: true })
  poll: FeedPostPoll | null;

  @ApiProperty({ description: 'Live session details (if live session post)' })
  @Column('jsonb', { nullable: true })
  liveSession: FeedPostLiveSession | null;

  @ApiProperty({ description: 'Recipe details (if recipe post)' })
  @Column('jsonb', { nullable: true })
  recipe: FeedPostRecipe | null;

  @ApiProperty({ description: 'Workout tip details (if workout tip post)' })
  @Column('jsonb', { nullable: true })
  workoutTip: FeedPostWorkoutTip | null;

  @ApiProperty({ description: 'Hashtags for categorization and discovery' })
  @Column('simple-array', { nullable: true })
  hashtags: string[] | null;

  @ApiProperty({ description: 'Target audience tags' })
  @Column('simple-array', { nullable: true })
  targetAudience: string[] | null;

  @ApiProperty({
    description: 'Specific client IDs (if targeted to specific clients)',
  })
  @Column('simple-array', { nullable: true })
  targetClientIds: string[] | null;

  @ApiProperty({ description: 'Required subscription tier to view' })
  @Column({ nullable: true })
  requiredSubscriptionTier: string | null;

  @ApiProperty({ description: 'Scheduled publication date' })
  @Column('timestamp with time zone', { nullable: true })
  scheduledAt: Date | null;

  @ApiProperty({ description: 'Actual publication date' })
  @Column('timestamp with time zone', { nullable: true })
  publishedAt: Date | null;

  @ApiProperty({ description: 'Post expiration date (for temporary posts)' })
  @Column('timestamp with time zone', { nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Post priority for feed ordering (1-10)' })
  @Column('int', { default: 5 })
  priority: number;

  @ApiProperty({ description: 'Is this post pinned to top of feed' })
  @Column({ default: false })
  isPinned: boolean;

  @ApiProperty({ description: 'Allow comments on this post' })
  @Column({ default: true })
  allowComments: boolean;

  @ApiProperty({ description: 'Allow likes on this post' })
  @Column({ default: true })
  allowLikes: boolean;

  @ApiProperty({ description: 'Allow shares on this post' })
  @Column({ default: true })
  allowShares: boolean;

  @ApiProperty({ description: 'Post engagement metrics' })
  @Column('jsonb')
  engagement: FeedPostEngagement;

  @ApiProperty({ description: 'Post metadata and analytics' })
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'SEO-friendly URL slug' })
  @Column({ nullable: true })
  slug: string | null;

  @ApiProperty({ description: 'External URL for link posts' })
  @Column({ nullable: true })
  externalUrl: string | null;

  @ApiProperty({ description: 'Call-to-action button text' })
  @Column({ nullable: true })
  ctaText: string | null;

  @ApiProperty({ description: 'Call-to-action button URL' })
  @Column({ nullable: true })
  ctaUrl: string | null;

  @ApiProperty({ description: 'Post creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Post last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isPublished(): boolean {
    return (
      this.status === FeedPostStatus.PUBLISHED && this.publishedAt !== null
    );
  }

  get isScheduled(): boolean {
    return (
      this.status === FeedPostStatus.SCHEDULED && this.scheduledAt !== null
    );
  }

  get isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt < new Date();
  }

  get isActive(): boolean {
    return this.isPublished && !this.isExpired;
  }

  get engagementRate(): number {
    const totalEngagements =
      this.engagement.likes + this.engagement.comments + this.engagement.shares;
    return this.engagement.views > 0
      ? (totalEngagements / this.engagement.views) * 100
      : 0;
  }

  get readTime(): number {
    // Estimate reading time based on content length (average 200 words per minute)
    const wordCount = this.content.split(' ').length;
    return Math.ceil(wordCount / 200);
  }

  get hasMedia(): boolean {
    return this.media !== null && this.media.length > 0;
  }

  get isInteractive(): boolean {
    return (
      this.poll !== null || this.challenge !== null || this.liveSession !== null
    );
  }

  get canBeViewed(): boolean {
    const now = new Date();

    // Check if post is published and not expired
    if (!this.isPublished || this.isExpired) {
      return false;
    }

    // Check if scheduled post is ready
    if (this.isScheduled && this.scheduledAt && this.scheduledAt > now) {
      return false;
    }

    return true;
  }

  get popularityScore(): number {
    const weights = {
      views: 1,
      likes: 3,
      comments: 5,
      shares: 8,
      saves: 10,
    };

    return (
      this.engagement.views * weights.views +
      this.engagement.likes * weights.likes +
      this.engagement.comments * weights.comments +
      this.engagement.shares * weights.shares +
      this.engagement.saves * weights.saves
    );
  }

  get contentLength(): 'short' | 'medium' | 'long' {
    const length = this.content.length;
    if (length < 500) return 'short';
    if (length < 1500) return 'medium';
    return 'long';
  }

  get ageInHours(): number {
    const now = new Date();
    const publishDate = this.publishedAt || this.createdAt;
    return Math.floor(
      (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60),
    );
  }

  get isTrending(): boolean {
    // Consider trending if high engagement in recent hours
    const recentEngagement = this.engagementRate;
    const isRecent = this.ageInHours <= 24;

    return isRecent && recentEngagement >= 10; // 10% engagement rate threshold
  }

  get displayTitle(): string {
    return (
      this.title ||
      this.content.substring(0, 50) + (this.content.length > 50 ? '...' : '')
    );
  }
}
