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
import { PaymentEntity } from './payment.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  PENDING = 'pending',
  PAST_DUE = 'past_due',
}

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  WEEKLY = 'weekly',
}

@Entity('subscriptions')
@Index(['userId', 'status'])
@Index(['coachId', 'status'])
@Index(['status', 'nextBillingDate'])
export class SubscriptionEntity {
  @ApiProperty({ description: 'Unique identifier for the subscription' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Subscriber user' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @ApiProperty({ description: 'User ID' })
  @Column()
  @Index()
  userId: string;

  @ApiProperty({ description: 'Coach ID for revenue sharing' })
  @Column({ nullable: true })
  @Index()
  coachId?: string;

  @ApiProperty({ description: 'Subscription plan', enum: SubscriptionPlan })
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  @Index()
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    default: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Subscription price per billing cycle' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ description: 'Currency code' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Apple App Store subscription ID' })
  @Column({ nullable: true })
  appleSubscriptionId?: string;

  @ApiProperty({ description: 'Google Play subscription ID' })
  @Column({ nullable: true })
  googleSubscriptionId?: string;

  @ApiProperty({ description: 'Stripe subscription ID' })
  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @ApiProperty({ description: 'PayPal subscription ID' })
  @Column({ nullable: true })
  paypalSubscriptionId?: string;

  @ApiProperty({ description: 'Subscription start date' })
  @Column({ type: 'timestamp' })
  startDate: Date;

  @ApiProperty({ description: 'Subscription end date' })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @ApiProperty({ description: 'Trial end date' })
  @Column({ type: 'timestamp', nullable: true })
  trialEndDate?: Date;

  @ApiProperty({ description: 'Next billing date' })
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  nextBillingDate?: Date;

  @ApiProperty({ description: 'Last billing date' })
  @Column({ type: 'timestamp', nullable: true })
  lastBillingDate?: Date;

  @ApiProperty({ description: 'Current period start' })
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStart?: Date;

  @ApiProperty({ description: 'Current period end' })
  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEnd?: Date;

  @ApiProperty({ description: 'Cancellation date' })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Cancellation reason' })
  @Column('text', { nullable: true })
  cancellationReason?: string;

  @ApiProperty({ description: 'Whether subscription auto-renews' })
  @Column({ default: true })
  autoRenew: boolean;

  @ApiProperty({ description: 'Whether subscription is in trial period' })
  @Column({ default: false })
  isTrial: boolean;

  @ApiProperty({ description: 'Trial duration in days' })
  @Column({ nullable: true })
  trialDays?: number;

  @ApiProperty({ description: 'Coach revenue share percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 70.0 })
  coachRevenueShare: number;

  @ApiProperty({ description: 'Platform fee percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30.0 })
  platformFee: number;

  @ApiProperty({ description: 'Subscription features included' })
  @Column('jsonb', { nullable: true })
  features?: {
    maxCoaches: number;
    unlimitedMessaging: boolean;
    customWorkouts: boolean;
    nutritionPlanning: boolean;
    progressTracking: boolean;
    liveVideo: boolean;
    prioritySupport: boolean;
    apiAccess: boolean;
    dataExport: boolean;
    customBranding: boolean;
  };

  @ApiProperty({ description: 'Subscription usage limits' })
  @Column('jsonb', { nullable: true })
  usageLimits?: {
    monthlyMessages: number;
    monthlyWorkouts: number;
    storageGB: number;
    videoMinutes: number;
    apiCalls: number;
  };

  @ApiProperty({ description: 'Current usage tracking' })
  @Column('jsonb', { nullable: true })
  currentUsage?: {
    messagesUsed: number;
    workoutsUsed: number;
    storageUsed: number;
    videoMinutesUsed: number;
    apiCallsUsed: number;
    lastResetDate: Date;
  };

  @ApiProperty({ description: 'Discount information' })
  @Column('jsonb', { nullable: true })
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    duration: number; // billing cycles
    remaining: number;
    couponCode?: string;
    description?: string;
  };

  @ApiProperty({ description: 'Payment failure information' })
  @Column('jsonb', { nullable: true })
  paymentFailure?: {
    lastFailureDate: Date;
    failureCount: number;
    lastFailureReason: string;
    nextRetryDate: Date;
    maxRetries: number;
  };

  @ApiProperty({ description: 'Subscription metadata' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    signupSource: string;
    referralCode?: string;
    campaignId?: string;
    originalPlan?: string;
    upgradeHistory?: Array<{
      fromPlan: string;
      toPlan: string;
      date: Date;
      reason: string;
    }>;
    customFields?: Record<string, any>;
  };

  @ApiProperty({ description: 'Subscription creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Subscription last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties for calculations
  get isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  get isExpired(): boolean {
    return this.endDate ? new Date() > this.endDate : false;
  }

  get daysUntilExpiry(): number {
    if (!this.endDate) return -1;
    const diff = this.endDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  get isInTrial(): boolean {
    return this.isTrial && this.trialEndDate
      ? new Date() < this.trialEndDate
      : false;
  }

  get monthlyValue(): number {
    switch (this.billingCycle) {
      case BillingCycle.WEEKLY:
        return this.price * 4.33; // Average weeks per month
      case BillingCycle.MONTHLY:
        return this.price;
      case BillingCycle.QUARTERLY:
        return this.price / 3;
      case BillingCycle.YEARLY:
        return this.price / 12;
      default:
        return this.price;
    }
  }
}
