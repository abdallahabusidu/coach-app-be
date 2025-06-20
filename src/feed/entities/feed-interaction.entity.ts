import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { FeedPostEntity } from './feed-post.entity';

export enum FeedInteractionType {
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
  SAVE = 'save',
  VIEW = 'view',
  CLICK = 'click',
  POLL_VOTE = 'poll_vote',
  CHALLENGE_JOIN = 'challenge_join',
  LIVE_SESSION_JOIN = 'live_session_join',
  REPORT = 'report',
  HIDE = 'hide',
}

export enum FeedReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  FIRE = 'fire',
  HEART = 'heart',
  MUSCLE = 'muscle',
  CLAP = 'clap',
}

@Entity('feed_interactions')
@Index(['postId', 'userId'])
@Index(['userId', 'interactionType'])
@Index(['postId', 'interactionType'])
@Index(['createdAt'])
@Unique(['postId', 'userId', 'interactionType'])
export class FeedInteractionEntity {
  @ApiProperty({ description: 'Unique identifier for the interaction' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Feed post being interacted with' })
  @ManyToOne(() => FeedPostEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  post: FeedPostEntity;

  @ApiProperty({ description: 'Feed post ID' })
  @Column('uuid')
  @Index()
  postId: string;

  @ApiProperty({ description: 'User performing the interaction' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @ApiProperty({ description: 'User ID performing interaction' })
  @Column('uuid')
  @Index()
  userId: string;

  @ApiProperty({
    description: 'Type of interaction',
    enum: FeedInteractionType,
  })
  @Column({
    type: 'enum',
    enum: FeedInteractionType,
  })
  @Index()
  interactionType: FeedInteractionType;

  @ApiProperty({
    description: 'Reaction type for like interactions',
    enum: FeedReactionType,
  })
  @Column({
    type: 'enum',
    enum: FeedReactionType,
    nullable: true,
  })
  reactionType: FeedReactionType | null;

  @ApiProperty({ description: 'Comment text (if comment interaction)' })
  @Column('text', { nullable: true })
  commentText: string | null;

  @ApiProperty({ description: 'Poll option ID (if poll vote interaction)' })
  @Column({ nullable: true })
  pollOptionId: string | null;

  @ApiProperty({ description: 'Additional interaction metadata' })
  @Column('jsonb', { nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'IP address of the user (for analytics)' })
  @Column({ nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'User agent string (for analytics)' })
  @Column({ nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Device type (mobile, desktop, tablet)' })
  @Column({ nullable: true })
  deviceType: string | null;

  @ApiProperty({ description: 'Interaction creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Interaction last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isReaction(): boolean {
    return (
      this.interactionType === FeedInteractionType.LIKE &&
      this.reactionType !== null
    );
  }

  get isComment(): boolean {
    return (
      this.interactionType === FeedInteractionType.COMMENT &&
      this.commentText !== null
    );
  }

  get isEngagement(): boolean {
    return [
      FeedInteractionType.LIKE,
      FeedInteractionType.COMMENT,
      FeedInteractionType.SHARE,
      FeedInteractionType.SAVE,
    ].includes(this.interactionType);
  }

  get isTracking(): boolean {
    return [FeedInteractionType.VIEW, FeedInteractionType.CLICK].includes(
      this.interactionType,
    );
  }

  get displayText(): string {
    switch (this.interactionType) {
      case FeedInteractionType.LIKE:
        return this.reactionType
          ? `reacted with ${this.reactionType}`
          : 'liked';
      case FeedInteractionType.COMMENT:
        return 'commented';
      case FeedInteractionType.SHARE:
        return 'shared';
      case FeedInteractionType.SAVE:
        return 'saved';
      case FeedInteractionType.POLL_VOTE:
        return 'voted in poll';
      case FeedInteractionType.CHALLENGE_JOIN:
        return 'joined challenge';
      case FeedInteractionType.LIVE_SESSION_JOIN:
        return 'joined live session';
      default:
        return this.interactionType;
    }
  }
}
