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

export enum CoachBoostType {
  SEARCH_PRIORITY = 'search_priority',
  FEATURED_BADGE = 'featured_badge',
  HOME_RECOMMENDATIONS = 'home_recommendations',
  TOP_PLACEMENT = 'top_placement',
  PREMIUM_LISTING = 'premium_listing',
  SPONSORED_CONTENT = 'sponsored_content',
}

export enum CoachBoostStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  PENDING = 'pending',
}

export enum BoostDuration {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface BoostMetrics {
  impressions: number;
  clicks: number;
  profileViews: number;
  clientInquiries: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
  costPerClick: number;
  costPerConversion: number;
  totalSpent: number;
  totalRevenue: number;
  returnOnInvestment: number;
}

export interface BoostTargeting {
  locations?: string[]; // Target specific locations
  demographics?: {
    ageRange?: { min: number; max: number };
    gender?: 'male' | 'female' | 'all';
    fitnessLevel?: ('beginner' | 'intermediate' | 'advanced')[];
  };
  interests?: string[]; // Fitness interests/goals
  timeSlots?: {
    days: string[];
    hours: { start: number; end: number };
  };
  keywords?: string[]; // Search keywords to boost for
  budget?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
    total?: number;
  };
}

export interface BoostSettings {
  autoRenew: boolean;
  maxBudget: number;
  bidAmount: number;
  targetImpressions: number;
  targetClicks: number;
  pauseOnBudgetExhaustion: boolean;
  competitiveBidding: boolean;
  smartOptimization: boolean;
  adContent?: {
    headline?: string;
    description?: string;
    callToAction?: string;
    images?: string[];
    video?: string;
  };
}

@Entity('coach_boosts')
@Index(['coachId', 'status'])
@Index(['boostType', 'status'])
@Index(['startDate', 'endDate'])
@Index(['status', 'priority'])
export class CoachBoostEntity {
  @ApiProperty({ description: 'Unique identifier for the coach boost' })
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

  @ApiProperty({ description: 'Type of boost', enum: CoachBoostType })
  @Column({
    type: 'enum',
    enum: CoachBoostType,
    default: CoachBoostType.SEARCH_PRIORITY,
  })
  @Index()
  boostType: CoachBoostType;

  @ApiProperty({ description: 'Boost status', enum: CoachBoostStatus })
  @Column({
    type: 'enum',
    enum: CoachBoostStatus,
    default: CoachBoostStatus.PENDING,
  })
  @Index()
  status: CoachBoostStatus;

  @ApiProperty({ description: 'Boost duration type', enum: BoostDuration })
  @Column({
    type: 'enum',
    enum: BoostDuration,
    default: BoostDuration.MONTHLY,
  })
  duration: BoostDuration;

  @ApiProperty({ description: 'Boost start date' })
  @Column('timestamp with time zone')
  @Index()
  startDate: Date;

  @ApiProperty({ description: 'Boost end date' })
  @Column('timestamp with time zone')
  @Index()
  endDate: Date;

  @ApiProperty({ description: 'Total amount paid for boost' })
  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @ApiProperty({ description: 'Amount spent so far' })
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  amountSpent: number;

  @ApiProperty({ description: 'Remaining budget' })
  @Column('decimal', { precision: 10, scale: 2 })
  remainingBudget: number;

  @ApiProperty({
    description: 'Boost priority level (1-10, higher = more priority)',
  })
  @Column('int', { default: 5 })
  @Index()
  priority: number;

  @ApiProperty({ description: 'Currency code' })
  @Column({ length: 3, default: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Boost metrics and performance data' })
  @Column('jsonb')
  metrics: BoostMetrics;

  @ApiProperty({ description: 'Targeting and audience settings' })
  @Column('jsonb', { nullable: true })
  targeting: BoostTargeting | null;

  @ApiProperty({ description: 'Boost configuration settings' })
  @Column('jsonb')
  settings: BoostSettings;

  @ApiProperty({ description: 'Boost badge text to display' })
  @Column({ nullable: true })
  badgeText: string | null;

  @ApiProperty({ description: 'Custom badge color (hex)' })
  @Column({ nullable: true })
  badgeColor: string | null;

  @ApiProperty({ description: 'Special promotion text' })
  @Column({ type: 'text', nullable: true })
  promotionText: string | null;

  @ApiProperty({ description: 'Featured image URL for boost' })
  @Column({ nullable: true })
  featuredImageUrl: string | null;

  @ApiProperty({ description: 'Auto-renewal enabled' })
  @Column({ default: false })
  autoRenew: boolean;

  @ApiProperty({ description: 'Next renewal date' })
  @Column('timestamp with time zone', { nullable: true })
  nextRenewalDate: Date | null;

  @ApiProperty({ description: 'Cancellation date' })
  @Column('timestamp with time zone', { nullable: true })
  cancelledAt: Date | null;

  @ApiProperty({ description: 'Cancellation reason' })
  @Column({ type: 'text', nullable: true })
  cancellationReason: string | null;

  @ApiProperty({ description: 'Payment method used' })
  @Column({ nullable: true })
  paymentMethod: string | null;

  @ApiProperty({ description: 'Transaction ID from payment processor' })
  @Column({ nullable: true })
  transactionId: string | null;

  @ApiProperty({ description: 'Boost creation date' })
  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @ApiProperty({ description: 'Boost last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === CoachBoostStatus.ACTIVE &&
      this.startDate <= now &&
      this.endDate >= now &&
      this.remainingBudget > 0
    );
  }

  get isExpired(): boolean {
    return (
      this.status === CoachBoostStatus.EXPIRED || this.endDate < new Date()
    );
  }

  get daysRemaining(): number {
    if (this.isExpired) return 0;
    const now = new Date();
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  get hoursRemaining(): number {
    if (this.isExpired) return 0;
    const now = new Date();
    const timeDiff = this.endDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600));
  }

  get budgetUtilization(): number {
    if (Number(this.totalAmount) === 0) return 0;
    return (Number(this.amountSpent) / Number(this.totalAmount)) * 100;
  }

  get effectivenessScore(): number {
    const metrics = this.metrics;
    if (!metrics.impressions || metrics.impressions === 0) return 0;

    // Calculate effectiveness based on CTR, conversion rate, and ROI
    const ctrScore = Math.min(metrics.clickThroughRate * 10, 100); // CTR weight
    const conversionScore = Math.min(metrics.conversionRate * 20, 100); // Conversion weight
    const roiScore = Math.min(Math.max(metrics.returnOnInvestment, 0) / 5, 100); // ROI weight

    return Math.round(ctrScore * 0.3 + conversionScore * 0.4 + roiScore * 0.3);
  }

  get displayBadge(): string {
    if (!this.badgeText) {
      switch (this.boostType) {
        case CoachBoostType.SEARCH_PRIORITY:
          return 'Top Result';
        case CoachBoostType.FEATURED_BADGE:
          return 'Featured';
        case CoachBoostType.HOME_RECOMMENDATIONS:
          return 'Recommended';
        case CoachBoostType.TOP_PLACEMENT:
          return 'Premium';
        case CoachBoostType.PREMIUM_LISTING:
          return 'Premium+';
        case CoachBoostType.SPONSORED_CONTENT:
          return 'Sponsored';
        default:
          return 'Boosted';
      }
    }
    return this.badgeText;
  }

  get badgeDisplayColor(): string {
    return this.badgeColor || '#FFD700'; // Default gold color
  }

  get costEfficiency(): 'excellent' | 'good' | 'average' | 'poor' {
    const roi = this.metrics.returnOnInvestment;
    if (roi >= 300) return 'excellent'; // 3x ROI or better
    if (roi >= 200) return 'good'; // 2x ROI
    if (roi >= 100) return 'average'; // Break even
    return 'poor'; // Loss
  }

  get performanceTrend(): 'improving' | 'stable' | 'declining' {
    // This would be calculated based on historical data
    // For now, using effectiveness score as a proxy
    const score = this.effectivenessScore;
    if (score >= 80) return 'improving';
    if (score >= 60) return 'stable';
    return 'declining';
  }

  get shouldAutoOptimize(): boolean {
    return (
      this.settings.smartOptimization &&
      this.isActive &&
      this.effectivenessScore < 50 &&
      this.budgetUtilization > 25
    );
  }

  get competitiveAdvantage(): number {
    // Calculate how much advantage this boost provides over non-boosted coaches
    const baseScore = this.priority * 10;
    const metricsBonus = this.effectivenessScore * 0.5;
    const budgetBonus = Math.min(this.budgetUtilization * 0.3, 30);

    return Math.round(baseScore + metricsBonus + budgetBonus);
  }
}
