import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan, BillingCycle } from './subscription.entity';
import { PaymentMethod, Currency } from './payment.entity';

export enum ProductType {
  SUBSCRIPTION = 'subscription',
  COACHING_PACKAGE = 'coaching_package',
  WORKOUT_PLAN = 'workout_plan',
  NUTRITION_PLAN = 'nutrition_plan',
  PERSONAL_TRAINING = 'personal_training',
  GROUP_CLASS = 'group_class',
  EQUIPMENT = 'equipment',
  SUPPLEMENT = 'supplement',
  COURSE = 'course',
  CONSULTATION = 'consultation',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
  ARCHIVED = 'archived',
}

@Entity('products')
@Index(['type', 'status'])
@Index(['status', 'isStoreCompliant'])
export class ProductEntity {
  @ApiProperty({ description: 'Unique identifier for the product' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Product name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Product description' })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  @Column({
    type: 'enum',
    enum: ProductType,
  })
  @Index()
  type: ProductType;

  @ApiProperty({ description: 'Product status', enum: ProductStatus })
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @Index()
  status: ProductStatus;

  @ApiProperty({ description: 'Base price in USD' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @ApiProperty({ description: 'Currency code', enum: Currency })
  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @ApiProperty({ description: 'Sale price (if on sale)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice?: number;

  @ApiProperty({
    description: 'Subscription plan (if subscription product)',
    enum: SubscriptionPlan,
  })
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    nullable: true,
  })
  subscriptionPlan?: SubscriptionPlan;

  @ApiProperty({
    description: 'Billing cycle (if subscription)',
    enum: BillingCycle,
  })
  @Column({
    type: 'enum',
    enum: BillingCycle,
    nullable: true,
  })
  billingCycle?: BillingCycle;

  @ApiProperty({ description: 'Trial period in days' })
  @Column({ nullable: true })
  trialDays?: number;

  @ApiProperty({ description: 'Apple App Store product ID' })
  @Column({ nullable: true, unique: true })
  appleProductId?: string;

  @ApiProperty({ description: 'Google Play product ID' })
  @Column({ nullable: true, unique: true })
  googleProductId?: string;

  @ApiProperty({ description: 'Stripe price ID' })
  @Column({ nullable: true })
  stripePriceId?: string;

  @ApiProperty({ description: 'PayPal plan ID' })
  @Column({ nullable: true })
  paypalPlanId?: string;

  @ApiProperty({ description: 'Whether product is compliant with app stores' })
  @Column({ default: true })
  @Index()
  isStoreCompliant: boolean;

  @ApiProperty({ description: 'Allowed payment methods' })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
    array: true,
    default: [PaymentMethod.APPLE_IAP, PaymentMethod.GOOGLE_PLAY],
  })
  allowedPaymentMethods: PaymentMethod[];

  @ApiProperty({ description: 'Product features included' })
  @Column('jsonb', { nullable: true })
  features?: {
    maxCoaches?: number;
    unlimitedMessaging?: boolean;
    customWorkouts?: boolean;
    nutritionPlanning?: boolean;
    progressTracking?: boolean;
    liveVideo?: boolean;
    prioritySupport?: boolean;
    duration?: number; // for packages/courses
    sessions?: number; // for training packages
    equipment?: string[]; // for equipment bundles
    supplements?: string[]; // for supplement packages
  };

  @ApiProperty({ description: 'Product limitations' })
  @Column('jsonb', { nullable: true })
  limitations?: {
    monthlyMessages?: number;
    monthlyWorkouts?: number;
    storageGB?: number;
    videoMinutes?: number;
    apiCalls?: number;
    maxUsers?: number;
  };

  @ApiProperty({ description: 'Pricing tiers for different markets' })
  @Column('jsonb', { nullable: true })
  pricingTiers?: Array<{
    country: string;
    currency: string;
    price: number;
    salePrice?: number;
  }>;

  @ApiProperty({ description: 'Product images' })
  @Column('jsonb', { nullable: true })
  images?: {
    thumbnail: string;
    gallery: string[];
    icon: string;
  };

  @ApiProperty({ description: 'SEO metadata' })
  @Column('jsonb', { nullable: true })
  seo?: {
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  };

  @ApiProperty({ description: 'Product categories/tags' })
  @Column('simple-array', { nullable: true })
  categories?: string[];

  @ApiProperty({ description: 'Target audience' })
  @Column('simple-array', { nullable: true })
  targetAudience?: string[];

  @ApiProperty({ description: 'Coach revenue share percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 70.0 })
  coachRevenueShare: number;

  @ApiProperty({ description: 'Platform fee percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 30.0 })
  platformFee: number;

  @ApiProperty({ description: 'Minimum coach level required' })
  @Column({ nullable: true })
  minimumCoachLevel?: string;

  @ApiProperty({ description: 'Product launch date' })
  @Column({ type: 'timestamp', nullable: true })
  launchDate?: Date;

  @ApiProperty({ description: 'Product discontinue date' })
  @Column({ type: 'timestamp', nullable: true })
  discontinueDate?: Date;

  @ApiProperty({ description: 'Total sales count' })
  @Column({ default: 0 })
  salesCount: number;

  @ApiProperty({ description: 'Average rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @ApiProperty({ description: 'Total reviews count' })
  @Column({ default: 0 })
  reviewCount: number;

  @ApiProperty({ description: 'Product metadata' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    weight?: number; // for physical products
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
    shippingRequired?: boolean;
    downloadable?: boolean;
    virtualProduct?: boolean;
    ageRestriction?: number;
    prerequisites?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration?: number; // in minutes
    language?: string;
    instructor?: string;
    certification?: boolean;
  };

  @ApiProperty({ description: 'Product creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Product last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get currentPrice(): number {
    return this.salePrice || this.basePrice;
  }

  get isOnSale(): boolean {
    return !!this.salePrice && this.salePrice < this.basePrice;
  }

  get discountPercentage(): number {
    if (!this.isOnSale) return 0;
    return Math.round(
      ((this.basePrice - this.salePrice!) / this.basePrice) * 100,
    );
  }

  get isSubscription(): boolean {
    return this.type === ProductType.SUBSCRIPTION;
  }

  get requiresAppStorePayment(): boolean {
    return (
      this.isStoreCompliant &&
      (this.type === ProductType.SUBSCRIPTION ||
        this.type === ProductType.WORKOUT_PLAN ||
        this.type === ProductType.NUTRITION_PLAN ||
        this.type === ProductType.COURSE)
    );
  }
}
