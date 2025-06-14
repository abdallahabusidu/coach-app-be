import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { PackageEntity } from '../../coach/entities/package.entity';

export enum SubscriptionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  ACTIVE = 'active',
}

export enum RequestType {
  SUBSCRIPTION = 'subscription',
  PACKAGE_PURCHASE = 'package_purchase',
  CONSULTATION = 'consultation',
}

@Entity('subscription_requests')
@Index(['traineeId', 'coachId', 'status'], {
  unique: true,
  where: "status IN ('pending', 'approved', 'active')",
})
export class SubscriptionRequestEntity {
  @ApiProperty({
    description: 'Unique identifier for the subscription request',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Trainee making the request' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Coach receiving the request' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Package being requested (optional)' })
  @ManyToOne(() => PackageEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  package?: PackageEntity;

  @ApiProperty({ description: 'Package ID' })
  @Column({ nullable: true })
  packageId?: string;

  @ApiProperty({ description: 'Type of request', enum: RequestType })
  @Column({
    type: 'enum',
    enum: RequestType,
    default: RequestType.SUBSCRIPTION,
  })
  @Index()
  requestType: RequestType;

  @ApiProperty({
    description: 'Current status of the request',
    enum: SubscriptionStatus,
  })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @Index()
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Message from trainee to coach' })
  @Column('text', { nullable: true })
  traineeMessage?: string;

  @ApiProperty({ description: 'Coach response message' })
  @Column('text', { nullable: true })
  coachResponse?: string;

  @ApiProperty({ description: 'Trainee goals and objectives' })
  @Column('jsonb', { nullable: true })
  traineeGoals?: {
    primaryGoals: string[];
    targetWeight?: number;
    timeframe?: string;
    experience?: 'beginner' | 'intermediate' | 'advanced';
    workoutFrequency?: number;
    dietaryRestrictions?: string[];
    medicalConditions?: string[];
    notes?: string;
  };

  @ApiProperty({ description: 'Subscription details and preferences' })
  @Column('jsonb', { nullable: true })
  subscriptionDetails?: {
    preferredStartDate?: Date;
    duration?: number; // months
    sessionsPerWeek?: number;
    preferredSchedule?: string[];
    communicationPreference?: 'daily' | 'weekly' | 'as_needed';
    budgetRange?: {
      min: number;
      max: number;
    };
    additionalServices?: string[];
  };

  @ApiProperty({ description: 'Coach terms and conditions for approval' })
  @Column('jsonb', { nullable: true })
  coachTerms?: {
    monthlyFee?: number;
    setupFee?: number;
    sessionsIncluded?: number;
    additionalSessionRate?: number;
    cancellationPolicy?: string;
    paymentTerms?: string;
    servicesToProvide?: string[];
    commitmentPeriod?: number; // months
    trialPeriod?: number; // days
  };

  @ApiProperty({ description: 'Subscription start date (when approved)' })
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @ApiProperty({ description: 'Subscription end date' })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @ApiProperty({ description: 'Monthly subscription fee' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  monthlyFee?: number;

  @ApiProperty({ description: 'Currency code' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Payment status' })
  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @ApiProperty({ description: 'Request priority level' })
  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  })
  priority: string;

  @ApiProperty({ description: 'Source of the request' })
  @Column({
    type: 'enum',
    enum: ['search', 'referral', 'social_media', 'advertisement', 'website'],
    default: 'search',
  })
  source: string;

  @ApiProperty({ description: 'Coach rating at time of request' })
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  coachRatingAtRequest?: number;

  @ApiProperty({ description: 'Whether the trainee can message the coach' })
  @Column({ default: true })
  canMessage: boolean;

  @ApiProperty({ description: 'Whether the coach can view trainee profile' })
  @Column({ default: true })
  canViewProfile: boolean;

  @ApiProperty({ description: 'Auto-approval settings' })
  @Column('jsonb', { nullable: true })
  autoApprovalSettings?: {
    enabled: boolean;
    maxTrainees?: number;
    requiredExperience?: string[];
    budgetMinimum?: number;
  };

  @ApiProperty({ description: 'Request metadata' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referralCode?: string;
    campaignId?: string;
    deviceType?: string;
    appVersion?: string;
  };

  @ApiProperty({ description: 'Request creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Request last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'When the request was approved/rejected' })
  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @ApiProperty({ description: 'When the subscription was activated' })
  @Column({ type: 'timestamp', nullable: true })
  activatedAt?: Date;

  @ApiProperty({ description: 'Last interaction timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastInteractionAt?: Date;

  @ApiProperty({ description: 'Number of messages exchanged' })
  @Column({ default: 0 })
  messageCount: number;

  @ApiProperty({ description: 'Request expiry date (auto-rejection)' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Follow-up reminders sent' })
  @Column({ default: 0 })
  remindersSent: number;

  @ApiProperty({ description: 'Whether this is a renewal request' })
  @Column({ default: false })
  isRenewal: boolean;

  @ApiProperty({ description: 'Previous subscription ID for renewals' })
  @Column({ nullable: true })
  previousSubscriptionId?: string;
}
