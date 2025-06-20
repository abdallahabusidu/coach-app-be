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

export enum ClientSubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING = 'pending',
  PAST_DUE = 'past_due',
  PAUSED = 'paused',
}

export enum ClientSubscriptionPlan {
  BASIC_COACHING = 'basic_coaching',
  PREMIUM_COACHING = 'premium_coaching',
  ELITE_COACHING = 'elite_coaching',
  CUSTOM_PLAN = 'custom_plan',
}

export enum BillingCycle {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface ClientPlanFeatures {
  // Communication
  monthlyMessages: number; // -1 for unlimited
  videoCallMinutes: number; // per month, -1 for unlimited
  voiceCallMinutes: number; // per month
  groupSessionAccess: boolean;
  prioritySupport: boolean;

  // Workout & Training
  customWorkoutPlans: boolean;
  workoutPlanUpdates: number; // per month, -1 for unlimited
  exerciseVideoLibrary: boolean;
  formCheckVideos: number; // per month
  liveWorkoutSessions: number; // per month

  // Nutrition
  nutritionPlanning: boolean;
  mealPlanUpdates: number; // per month
  nutritionTracking: boolean;
  supplementGuidance: boolean;

  // Progress Tracking
  progressPhotoReviews: number; // per month
  bodyCompositionTracking: boolean;
  performanceMetrics: boolean;
  goalSetting: boolean;

  // Additional Services
  habitCoaching: boolean;
  mindsetCoaching: boolean;
  lifestyleEducation: boolean;
  injuryPrevention: boolean;

  // Platform Features
  mobileAppAccess: boolean;
  webAppAccess: boolean;
  offlineContentAccess: boolean;
  dataExport: boolean;
}

export interface ClientUsageTracking {
  messagesReceived: number;
  videoMinutesUsed: number;
  voiceMinutesUsed: number;
  workoutPlansReceived: number;
  formChecksReceived: number;
  progressPhotosSubmitted: number;
  lastActivityDate: Date;

  // Engagement Metrics
  loginFrequency: number; // days per month
  workoutCompletionRate: number; // percentage
  responseRate: number; // to coach messages
  overallEngagement: number; // composite score
}

export interface ClientSubscriptionMetadata {
  coachingGoals: string[];
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredCommunication: 'text' | 'voice' | 'video' | 'mixed';
  timeZone: string;
  signupSource: string;
  referralCode?: string;
  specialRequirements?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  customFields?: Record<string, any>;
}

@Entity('client_subscriptions')
@Index(['clientId', 'status'])
@Index(['coachId', 'status'])
@Index(['status', 'nextBillingDate'])
@Index(['createdAt'])
export class ClientSubscriptionEntity {
  @ApiProperty({ description: 'Unique identifier for the client subscription' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Client user' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  client: UserEntity;

  @ApiProperty({ description: 'Client user ID' })
  @Column('uuid')
  @Index()
  clientId: string;

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
    enum: ClientSubscriptionPlan,
  })
  @Column({
    type: 'enum',
    enum: ClientSubscriptionPlan,
    default: ClientSubscriptionPlan.BASIC_COACHING,
  })
  @Index()
  plan: ClientSubscriptionPlan;

  @ApiProperty({
    description: 'Subscription status',
    enum: ClientSubscriptionStatus,
  })
  @Column({
    type: 'enum',
    enum: ClientSubscriptionStatus,
    default: ClientSubscriptionStatus.TRIAL,
  })
  @Index()
  status: ClientSubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Subscription price per billing cycle (what client pays)',
  })
  @Column('decimal', { precision: 10, scale: 2 })
  clientPrice: number;

  @ApiProperty({
    description: 'Coach earnings per billing cycle (after platform commission)',
  })
  @Column('decimal', { precision: 10, scale: 2 })
  coachEarnings: number;

  @ApiProperty({ description: 'Platform commission per billing cycle' })
  @Column('decimal', { precision: 10, scale: 2 })
  platformCommission: number;

  @ApiProperty({ description: 'Platform commission percentage' })
  @Column('decimal', { precision: 5, scale: 2, default: 20.0 })
  platformCommissionRate: number;

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

  @ApiProperty({ description: 'Who cancelled the subscription' })
  @Column({
    type: 'enum',
    enum: ['client', 'coach', 'admin', 'system'],
    nullable: true,
  })
  cancelledBy: 'client' | 'coach' | 'admin' | 'system' | null;

  @ApiProperty({ description: 'Plan features included' })
  @Column('jsonb')
  features: ClientPlanFeatures;

  @ApiProperty({ description: 'Current usage tracking' })
  @Column('jsonb')
  currentUsage: ClientUsageTracking;

  @ApiProperty({ description: 'Client subscription metadata' })
  @Column('jsonb', { nullable: true })
  metadata: ClientSubscriptionMetadata | null;

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

  // Computed properties
  get isActive(): boolean {
    return this.status === ClientSubscriptionStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return (
      this.status === ClientSubscriptionStatus.EXPIRED ||
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
        return Number(this.clientPrice) / 12;
      case BillingCycle.QUARTERLY:
        return Number(this.clientPrice) / 3;
      case BillingCycle.WEEKLY:
        return Number(this.clientPrice) * 4.33; // Average weeks per month
      case BillingCycle.MONTHLY:
      default:
        return Number(this.clientPrice);
    }
  }

  get annualValue(): number {
    switch (this.billingCycle) {
      case BillingCycle.YEARLY:
        return Number(this.clientPrice);
      case BillingCycle.QUARTERLY:
        return Number(this.clientPrice) * 4;
      case BillingCycle.WEEKLY:
        return Number(this.clientPrice) * 52;
      case BillingCycle.MONTHLY:
      default:
        return Number(this.clientPrice) * 12;
    }
  }

  get coachMonthlyEarnings(): number {
    switch (this.billingCycle) {
      case BillingCycle.YEARLY:
        return Number(this.coachEarnings) / 12;
      case BillingCycle.QUARTERLY:
        return Number(this.coachEarnings) / 3;
      case BillingCycle.WEEKLY:
        return Number(this.coachEarnings) * 4.33;
      case BillingCycle.MONTHLY:
      default:
        return Number(this.coachEarnings);
    }
  }

  get platformMonthlyCommission(): number {
    switch (this.billingCycle) {
      case BillingCycle.YEARLY:
        return Number(this.platformCommission) / 12;
      case BillingCycle.QUARTERLY:
        return Number(this.platformCommission) / 3;
      case BillingCycle.WEEKLY:
        return Number(this.platformCommission) * 4.33;
      case BillingCycle.MONTHLY:
      default:
        return Number(this.platformCommission);
    }
  }

  get usagePercentages(): Record<string, number> {
    const features = this.features;
    const usage = this.currentUsage;

    const percentages: Record<string, number> = {};

    if (features.monthlyMessages > 0) {
      percentages.messages = Math.round(
        (usage.messagesReceived / features.monthlyMessages) * 100,
      );
    }

    if (features.videoCallMinutes > 0) {
      percentages.videoMinutes = Math.round(
        (usage.videoMinutesUsed / features.videoCallMinutes) * 100,
      );
    }

    if (features.workoutPlanUpdates > 0) {
      percentages.workoutPlans = Math.round(
        (usage.workoutPlansReceived / features.workoutPlanUpdates) * 100,
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

  get engagementLevel(): 'low' | 'medium' | 'high' {
    const engagement = this.currentUsage.overallEngagement;
    if (engagement >= 80) return 'high';
    if (engagement >= 50) return 'medium';
    return 'low';
  }
}
