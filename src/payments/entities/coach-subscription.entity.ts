import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { PaymentEntity } from './payment.entity';

export enum CoachSubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING = 'pending',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
}

export enum CoachSubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ELITE = 'elite',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface CoachPlanFeatures {
  // Client Management
  maxActiveClients: number; // -1 for unlimited
  clientProgressTracking: boolean;
  groupCoaching: boolean;
  clientCommunicationTools: boolean;

  // Content Creation
  customWorkoutBuilder: boolean;
  nutritionPlanCreator: boolean;
  progressPhotoStorage: number; // GB
  videoExerciseLibrary: boolean;
  brandedContentTemplates: boolean;

  // Business Tools
  paymentProcessingIntegration: boolean;
  schedulingCalendar: boolean;
  revenueAnalytics: boolean;
  clientAcquisitionTools: boolean;
  marketingAutomation: boolean;
  whiteLabelApp: boolean;

  // Communication Limits
  monthlyMessages: number; // -1 for unlimited
  videoCallMinutes: number; // per month, -1 for unlimited
  groupChatRooms: number;
  pushNotifications: boolean;
  emailIntegration: boolean;

  // Analytics & Reporting
  basicAnalytics: boolean;
  advancedBusinessMetrics: boolean;
  clientRetentionReports: boolean;
  revenueForecastingReports: boolean;
  dataExportCapabilities: boolean;

  // AI and Advanced Features
  aiPoweredRecommendations: boolean;
  wearableIntegrations: boolean;
  nutritionTrackingIntegrations: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  dedicatedSuccessManager: boolean;

  // Storage and Performance
  storageGB: number;
  bandwidthGB: number;
  apiCallsPerMonth: number;
}

export interface CoachUsageTracking {
  activeClients: number;
  messagesUsed: number;
  videoMinutesUsed: number;
  storageUsedGB: number;
  apiCallsUsed: number;
  lastResetDate: Date;

  // Business Metrics
  monthlyRevenue: number;
  totalClients: number;
  clientRetentionRate: number;
  averageSessionDuration: number;
}

export interface CoachSubscriptionMetadata {
  signupSource: string;
  referralCode?: string;
  campaignId?: string;
  originalPlan?: string;
  upgradeHistory?: Array<{
    fromPlan: CoachSubscriptionPlan;
    toPlan: CoachSubscriptionPlan;
    date: Date;
    reason: string;
  }>;
  coachingSpecialty?: string[];
  businessType?: 'individual' | 'gym' | 'studio' | 'corporate';
  teamSize?: number;
  customFields?: Record<string, any>;
}

@Entity('coach_subscriptions')
@Index(['coachId', 'status'])
@Index(['status', 'nextBillingDate'])
@Index(['plan', 'status'])
@Index(['createdAt'])
export class CoachSubscriptionEntity {
  @ApiProperty({ description: 'Unique identifier for the coach subscription' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Coach user' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach user ID' })
  @Column('uuid')
  @Index()
  coachId: string;

  @ApiProperty({
    description: 'Subscription plan',
    enum: CoachSubscriptionPlan,
  })
  @Column({
    type: 'enum',
    enum: CoachSubscriptionPlan,
    default: CoachSubscriptionPlan.STARTER,
  })
  @Index()
  plan: CoachSubscriptionPlan;

  @ApiProperty({
    description: 'Subscription status',
    enum: CoachSubscriptionStatus,
  })
  @Column({
    type: 'enum',
    enum: CoachSubscriptionStatus,
    default: CoachSubscriptionStatus.TRIAL,
  })
  @Index()
  status: CoachSubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Subscription price per billing cycle' })
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Currency code (USD, EUR, etc.)' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Subscription start date' })
  @Column('timestamp with time zone')
  @Index()
  startDate: Date;

  @ApiProperty({ description: 'Subscription end date (if applicable)' })
  @Column('timestamp with time zone', { nullable: true })
  endDate: Date | null;

  @ApiProperty({ description: 'Trial end date' })
  @Column('timestamp with time zone', { nullable: true })
  trialEndDate: Date | null;

  @ApiProperty({ description: 'Next billing date' })
  @Column('timestamp with time zone', { nullable: true })
  @Index()
  nextBillingDate: Date | null;

  @ApiProperty({ description: 'Last successful billing date' })
  @Column('timestamp with time zone', { nullable: true })
  lastBillingDate: Date | null;

  @ApiProperty({ description: 'Current billing period start' })
  @Column('timestamp with time zone', { nullable: true })
  currentPeriodStart: Date | null;

  @ApiProperty({ description: 'Current billing period end' })
  @Column('timestamp with time zone', { nullable: true })
  currentPeriodEnd: Date | null;

  @ApiProperty({ description: 'Auto-renewal enabled' })
  @Column({ default: true })
  autoRenew: boolean;

  @ApiProperty({ description: 'Is currently in trial period' })
  @Column({ default: false })
  @Index()
  isTrial: boolean;

  @ApiProperty({ description: 'Trial period duration in days' })
  @Column({ nullable: true })
  trialDays: number | null;

  @ApiProperty({ description: 'Cancellation date' })
  @Column('timestamp with time zone', { nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ description: 'Cancellation reason' })
  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ description: 'Plan features included' })
  @Column('jsonb')
  features: CoachPlanFeatures;

  @ApiProperty({ description: 'Current usage tracking' })
  @Column('jsonb')
  currentUsage: CoachUsageTracking;

  @ApiProperty({ description: 'Platform revenue share percentage' })
  @Column('decimal', { precision: 5, scale: 2, default: 25.0 })
  platformFee: number;

  @ApiProperty({ description: 'Coach revenue share percentage' })
  @Column('decimal', { precision: 5, scale: 2, default: 75.0 })
  coachRevenueShare: number;

  @ApiProperty({ description: 'Subscription metadata' })
  @Column('jsonb', { nullable: true })
  metadata: CoachSubscriptionMetadata | null;

  // Platform-specific subscription IDs
  @ApiProperty({ description: 'Apple subscription ID' })
  @Column({ nullable: true })
  appleSubscriptionId: string | null;

  @ApiProperty({ description: 'Google subscription ID' })
  @Column({ nullable: true })
  googleSubscriptionId: string | null;

  @ApiProperty({ description: 'Stripe subscription ID' })
  @Column({ nullable: true })
  stripeSubscriptionId: string | null;

  @ApiProperty({ description: 'PayPal subscription ID' })
  @Column({ nullable: true })
  paypalSubscriptionId: string | null;

  @ApiProperty({ description: 'Failed payment attempts' })
  @Column({ default: 0 })
  failedPaymentAttempts: number;

  @ApiProperty({ description: 'Last failed payment date' })
  @Column('timestamp with time zone', { nullable: true })
  lastFailedPaymentDate: Date | null;

  @ApiProperty({ description: 'Subscription creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Subscription last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Related payments - will be added after updating PaymentEntity
  // @OneToMany(() => PaymentEntity, payment => payment.coachSubscription)
  // payments: PaymentEntity[];

  // Computed properties
  get isActive(): boolean {
    return this.status === CoachSubscriptionStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return (
      this.status === CoachSubscriptionStatus.EXPIRED ||
      (this.endDate && this.endDate < new Date())
    );
  }

  get daysUntilExpiry(): number {
    if (!this.endDate) return -1;
    const today = new Date();
    const timeDiff = this.endDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  get daysUntilNextBilling(): number {
    if (!this.nextBillingDate) return -1;
    const today = new Date();
    const timeDiff = this.nextBillingDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  get monthlyValue(): number {
    switch (this.billingCycle) {
      case BillingCycle.YEARLY:
        return Number(this.price) / 12;
      case BillingCycle.QUARTERLY:
        return Number(this.price) / 3;
      case BillingCycle.MONTHLY:
      default:
        return Number(this.price);
    }
  }

  get annualValue(): number {
    switch (this.billingCycle) {
      case BillingCycle.YEARLY:
        return Number(this.price);
      case BillingCycle.QUARTERLY:
        return Number(this.price) * 4;
      case BillingCycle.MONTHLY:
      default:
        return Number(this.price) * 12;
    }
  }

  get usagePercentages(): Record<string, number> {
    const features = this.features;
    const usage = this.currentUsage;

    const percentages: Record<string, number> = {};

    if (features.maxActiveClients > 0) {
      percentages.clients = Math.round(
        (usage.activeClients / features.maxActiveClients) * 100,
      );
    }

    if (features.monthlyMessages > 0) {
      percentages.messages = Math.round(
        (usage.messagesUsed / features.monthlyMessages) * 100,
      );
    }

    if (features.videoCallMinutes > 0) {
      percentages.videoMinutes = Math.round(
        (usage.videoMinutesUsed / features.videoCallMinutes) * 100,
      );
    }

    if (features.storageGB > 0) {
      percentages.storage = Math.round(
        (usage.storageUsedGB / features.storageGB) * 100,
      );
    }

    return percentages;
  }

  get isNearLimits(): boolean {
    const percentages = this.usagePercentages;
    return Object.values(percentages).some((percentage) => percentage >= 80);
  }

  get isOverLimits(): boolean {
    const percentages = this.usagePercentages;
    return Object.values(percentages).some((percentage) => percentage >= 100);
  }
}
