import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum BusinessType {
  GYM = 'gym',
  NUTRITION_RESTAURANT = 'nutrition_restaurant',
  SUPPLEMENT_STORE = 'supplement_store',
  SPORTS_EQUIPMENT = 'sports_equipment',
  WELLNESS_CENTER = 'wellness_center',
  HEALTH_CLINIC = 'health_clinic',
  FITNESS_APPAREL = 'fitness_apparel',
}

export enum BusinessStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum PromotionType {
  FEATURED = 'featured',
  BANNER = 'banner',
  SPONSORED = 'sponsored',
  PREMIUM = 'premium',
  STANDARD = 'standard',
}

export interface BusinessLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
}

export interface BusinessContact {
  phone: string;
  email: string;
  website?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    tiktok?: string;
  };
}

export interface BusinessHours {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface BusinessOffers {
  id: string;
  title: string;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  originalPrice?: number;
  discountedPrice?: number;
  validFrom: Date;
  validUntil: Date;
  promoCode?: string;
  termsAndConditions?: string[];
  maxRedemptions?: number;
  currentRedemptions: number;
}

export interface BusinessMetrics {
  views: number;
  clicks: number;
  calls: number;
  websiteVisits: number;
  directionsRequested: number;
  offersRedeemed: number;
  clickThroughRate: number;
  conversionRate: number;
  averageRating: number;
  totalReviews: number;
}

export interface BusinessImages {
  logo: string;
  banner?: string;
  gallery?: string[];
  menuImages?: string[];
  facilityImages?: string[];
}

export interface BusinessFeatures {
  // Gym Features
  hasPersonalTraining?: boolean;
  hasGroupClasses?: boolean;
  hasSwimmingPool?: boolean;
  hasSauna?: boolean;
  has24HourAccess?: boolean;
  hasChildcare?: boolean;
  hasNutritionCounseling?: boolean;

  // Restaurant Features
  hasDelivery?: boolean;
  hasPickup?: boolean;
  hasCateringService?: boolean;
  hasVeganOptions?: boolean;
  hasGlutenFreeOptions?: boolean;
  hasKetoDiet?: boolean;
  hasMealPrep?: boolean;
  hasNutritionInfo?: boolean;

  // General Features
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  acceptsCreditCards?: boolean;
  hasWifi?: boolean;
  petFriendly?: boolean;
}

export interface BusinessTargeting {
  targetAudience: string[];
  ageGroups: string[];
  fitnessLevels: string[];
  dietaryPreferences: string[];
  geographicRadius: number; // in km
  interests: string[];
}

export interface BusinessContract {
  contractId: string;
  startDate: Date;
  endDate: Date;
  monthlyFee: number;
  setupFee?: number;
  paymentMethod: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  autoRenewal: boolean;
  contractTerms: string;
  signedDate: Date;
  signedBy: string;
  renewalNotificationDays: number;
}

@Entity('promoted_businesses')
@Index(['businessType', 'status'])
@Index(['promotionType', 'status'])
@Index(['contractEndDate'])
@Index(['priority'])
export class PromotedBusinessEntity {
  @ApiProperty({ description: 'Unique identifier for the promoted business' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Business name' })
  @Column()
  businessName: string;

  @ApiProperty({ description: 'Business description' })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'Short tagline or slogan' })
  @Column({ nullable: true })
  tagline: string | null;

  @ApiProperty({ description: 'Type of business', enum: BusinessType })
  @Column({
    type: 'enum',
    enum: BusinessType,
  })
  @Index()
  businessType: BusinessType;

  @ApiProperty({ description: 'Business status', enum: BusinessStatus })
  @Column({
    type: 'enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })
  @Index()
  status: BusinessStatus;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  @Column({
    type: 'enum',
    enum: PromotionType,
    default: PromotionType.STANDARD,
  })
  @Index()
  promotionType: PromotionType;

  @ApiProperty({ description: 'Business location details' })
  @Column('jsonb')
  location: BusinessLocation;

  @ApiProperty({ description: 'Business contact information' })
  @Column('jsonb')
  contact: BusinessContact;

  @ApiProperty({ description: 'Business operating hours' })
  @Column('jsonb')
  businessHours: BusinessHours;

  @ApiProperty({ description: 'Business images and media' })
  @Column('jsonb')
  images: BusinessImages;

  @ApiProperty({ description: 'Business features and amenities' })
  @Column('jsonb')
  features: BusinessFeatures;

  @ApiProperty({ description: 'Current offers and promotions' })
  @Column('jsonb', { nullable: true })
  offers: BusinessOffers[] | null;

  @ApiProperty({ description: 'Targeting and audience settings' })
  @Column('jsonb')
  targeting: BusinessTargeting;

  @ApiProperty({ description: 'Contract details' })
  @Column('jsonb')
  contract: BusinessContract;

  @ApiProperty({ description: 'Business metrics and analytics' })
  @Column('jsonb')
  metrics: BusinessMetrics;

  @ApiProperty({ description: 'Priority level for display ordering (1-10)' })
  @Column('int', { default: 5 })
  @Index()
  priority: number;

  @ApiProperty({ description: 'Is business currently featured' })
  @Column({ default: false })
  isFeatured: boolean;

  @ApiProperty({ description: 'Business rating (1-5)' })
  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty({ description: 'Number of reviews' })
  @Column('int', { default: 0 })
  reviewCount: number;

  @ApiProperty({ description: 'Price range indicator (1-4, $ to $$$$)' })
  @Column('int', { nullable: true })
  priceRange: number | null;

  @ApiProperty({ description: 'Business categories/tags' })
  @Column('simple-array', { nullable: true })
  categories: string[] | null;

  @ApiProperty({ description: 'Special certifications or badges' })
  @Column('simple-array', { nullable: true })
  certifications: string[] | null;

  @ApiProperty({ description: 'Business verification status' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Contract start date' })
  @Column('timestamp with time zone')
  contractStartDate: Date;

  @ApiProperty({ description: 'Contract end date' })
  @Column('timestamp with time zone')
  @Index()
  contractEndDate: Date;

  @ApiProperty({ description: 'Last payment date' })
  @Column('timestamp with time zone', { nullable: true })
  lastPaymentDate: Date | null;

  @ApiProperty({ description: 'Next payment due date' })
  @Column('timestamp with time zone', { nullable: true })
  nextPaymentDate: Date | null;

  @ApiProperty({ description: 'Business creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Business last update date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Business city' })
  @Column()
  city: string;

  // Computed properties
  get isActive(): boolean {
    return (
      this.status === BusinessStatus.ACTIVE && this.contractEndDate > new Date()
    );
  }

  get isContractExpiring(): boolean {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.contractEndDate <= thirtyDaysFromNow;
  }

  get isContractExpired(): boolean {
    return this.contractEndDate < new Date();
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const timeDiff = this.contractEndDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  get monthlyRevenue(): number {
    return this.contract.monthlyFee;
  }

  get totalRevenueToDate(): number {
    const now = new Date();
    const monthsDiff = this.monthsBetweenDates(this.contractStartDate, now);
    return monthsDiff * this.contract.monthlyFee;
  }

  get clickThroughRate(): number {
    return this.metrics.views > 0
      ? (this.metrics.clicks / this.metrics.views) * 100
      : 0;
  }

  get conversionRate(): number {
    return this.metrics.clicks > 0
      ? ((this.metrics.calls + this.metrics.websiteVisits) /
          this.metrics.clicks) *
          100
      : 0;
  }

  get isOpenNow(): boolean {
    const now = new Date();
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = days[now.getDay()] as keyof BusinessHours;
    const dayHours = this.businessHours[currentDay];

    if (!dayHours || dayHours.closed) {
      return false;
    }

    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  }

  get averageRating(): number {
    return this.rating;
  }

  get popularityScore(): number {
    const weights = {
      views: 1,
      clicks: 3,
      calls: 5,
      websiteVisits: 4,
      directionsRequested: 6,
      rating: 20,
      reviewCount: 2,
    };

    return (
      this.metrics.views * weights.views +
      this.metrics.clicks * weights.clicks +
      this.metrics.calls * weights.calls +
      this.metrics.websiteVisits * weights.websiteVisits +
      this.metrics.directionsRequested * weights.directionsRequested +
      this.rating * weights.rating +
      this.reviewCount * weights.reviewCount
    );
  }

  get displayPrice(): string {
    if (!this.priceRange) return 'N/A';
    return '$'.repeat(this.priceRange);
  }

  get hasActiveOffers(): boolean {
    if (!this.offers || this.offers.length === 0) return false;

    const now = new Date();
    return this.offers.some(
      (offer) =>
        now >= offer.validFrom &&
        now <= offer.validUntil &&
        (!offer.maxRedemptions ||
          offer.currentRedemptions < offer.maxRedemptions),
    );
  }

  get activeOffers(): BusinessOffers[] {
    if (!this.offers) return [];

    const now = new Date();
    return this.offers.filter(
      (offer) =>
        now >= offer.validFrom &&
        now <= offer.validUntil &&
        (!offer.maxRedemptions ||
          offer.currentRedemptions < offer.maxRedemptions),
    );
  }

  get distanceFromUser(): number {
    // This would be calculated based on user's location
    // For now, returning 0 as placeholder
    return 0;
  }

  get isNearby(): boolean {
    return this.distanceFromUser <= this.targeting.geographicRadius;
  }

  private monthsBetweenDates(startDate: Date, endDate: Date): number {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
    return months - startDate.getMonth() + endDate.getMonth();
  }
}
