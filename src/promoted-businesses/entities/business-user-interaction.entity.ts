import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { PromotedBusinessEntity } from './promoted-business.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum InteractionType {
  VIEW = 'view',
  CLICK = 'click',
  CALL = 'call',
  WEBSITE_VISIT = 'website_visit',
  DIRECTIONS = 'directions',
  OFFER_VIEW = 'offer_view',
  OFFER_REDEEM = 'offer_redeem',
  SHARE = 'share',
  SAVE = 'save',
  REVIEW_CLICK = 'review_click',
  PHOTO_VIEW = 'photo_view',
  HOURS_CHECK = 'hours_check',
  LOCATION_CLICK = 'location_click',
}

export interface InteractionMetadata {
  // Device information
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  operatingSystem?: string;
  screenResolution?: string;

  // Location information
  userLatitude?: number;
  userLongitude?: number;
  distanceFromBusiness?: number;

  // Interaction context
  sourceSection?: 'gym_section' | 'nutrition_section' | 'featured' | 'search';
  clickPosition?: number; // Position in list
  sessionId?: string;
  referrer?: string;

  // Offer-specific metadata
  offerId?: string;
  offerTitle?: string;
  discountAmount?: number;

  // Additional context
  timeSpentOnPage?: number; // in seconds
  scrollDepth?: number; // percentage
  previousInteraction?: InteractionType;
  userIntent?: 'browsing' | 'searching' | 'comparing' | 'deciding';
}

@Entity('business_user_interactions')
@Index(['businessId', 'userId'])
@Index(['businessId', 'interactionType'])
@Index(['userId', 'interactionType'])
@Index(['createdAt'])
@Index(['sessionId'])
export class BusinessUserInteractionEntity {
  @ApiProperty({ description: 'Unique identifier for the interaction' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Business ID' })
  @Column('uuid')
  @Index()
  businessId: string;

  @ApiProperty({ description: 'User ID' })
  @Column('uuid')
  @Index()
  userId: string;

  @ApiProperty({ description: 'Type of interaction', enum: InteractionType })
  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  @Index()
  interactionType: InteractionType;

  @ApiProperty({ description: 'Additional interaction metadata' })
  @Column('jsonb', { nullable: true })
  metadata: InteractionMetadata | null;

  @ApiProperty({ description: 'IP address of the user' })
  @Column({ nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'User agent string' })
  @Column('text', { nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Session ID for tracking user journey' })
  @Column({ nullable: true })
  @Index()
  sessionId: string | null;

  @ApiProperty({ description: 'Interaction creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Interaction last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PromotedBusinessEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: PromotedBusinessEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  // Computed properties
  get isConversion(): boolean {
    return [
      InteractionType.CALL,
      InteractionType.WEBSITE_VISIT,
      InteractionType.DIRECTIONS,
      InteractionType.OFFER_REDEEM,
    ].includes(this.interactionType);
  }

  get isEngagement(): boolean {
    return [
      InteractionType.CLICK,
      InteractionType.OFFER_VIEW,
      InteractionType.SHARE,
      InteractionType.SAVE,
      InteractionType.REVIEW_CLICK,
      InteractionType.PHOTO_VIEW,
      InteractionType.HOURS_CHECK,
      InteractionType.LOCATION_CLICK,
    ].includes(this.interactionType);
  }

  get interactionValue(): number {
    // Assign values based on interaction importance
    const values = {
      [InteractionType.VIEW]: 1,
      [InteractionType.CLICK]: 2,
      [InteractionType.PHOTO_VIEW]: 2,
      [InteractionType.HOURS_CHECK]: 3,
      [InteractionType.LOCATION_CLICK]: 3,
      [InteractionType.OFFER_VIEW]: 4,
      [InteractionType.REVIEW_CLICK]: 4,
      [InteractionType.SHARE]: 5,
      [InteractionType.SAVE]: 6,
      [InteractionType.WEBSITE_VISIT]: 8,
      [InteractionType.DIRECTIONS]: 9,
      [InteractionType.CALL]: 10,
      [InteractionType.OFFER_REDEEM]: 15,
    };

    return values[this.interactionType] || 1;
  }

  get distanceFromBusiness(): number {
    return this.metadata?.distanceFromBusiness || 0;
  }

  get deviceType(): string {
    return this.metadata?.deviceType || 'unknown';
  }

  get sourceSection(): string {
    return this.metadata?.sourceSection || 'unknown';
  }

  get timeSpentOnPage(): number {
    return this.metadata?.timeSpentOnPage || 0;
  }

  get isHighValueInteraction(): boolean {
    return this.interactionValue >= 8;
  }

  get isFromMobile(): boolean {
    return this.metadata?.deviceType === 'mobile';
  }

  get isLocalUser(): boolean {
    return this.distanceFromBusiness <= 10; // Within 10km
  }
}
