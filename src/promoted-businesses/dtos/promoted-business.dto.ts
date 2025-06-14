import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsDateString,
  IsEmail,
  IsUrl,
  ValidateNested,
  Min,
  Max,
  IsObject,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  BusinessType,
  BusinessStatus,
  PromotionType,
  BusinessLocation,
  BusinessContact,
  BusinessHours,
  BusinessOffers,
  BusinessFeatures,
  BusinessTargeting,
  BusinessContract,
  BusinessImages,
} from '../entities/promoted-business.entity';
import { InteractionType } from '../entities/business-user-interaction.entity';

// Location DTOs
export class BusinessLocationDto implements BusinessLocation {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  address: string;

  @ApiProperty({ description: 'City name' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State or province' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Country name' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'ZIP or postal code' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Google Place ID' })
  @IsOptional()
  @IsString()
  googlePlaceId?: string;
}

// Contact DTOs
export class SocialMediaDto {
  @ApiPropertyOptional({ description: 'Instagram handle' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'Facebook page' })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ description: 'Twitter handle' })
  @IsOptional()
  @IsString()
  twitter?: string;

  @ApiPropertyOptional({ description: 'TikTok handle' })
  @IsOptional()
  @IsString()
  tiktok?: string;
}

export class BusinessContactDto implements BusinessContact {
  @ApiProperty({ description: 'Business phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'Business email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Business website URL' })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({ description: 'Social media handles' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto;
}

// Business Hours DTOs
export class DayHoursDto {
  @ApiPropertyOptional({ description: 'Opening time (HH:MM)' })
  @IsOptional()
  @IsString()
  open?: string;

  @ApiPropertyOptional({ description: 'Closing time (HH:MM)' })
  @IsOptional()
  @IsString()
  close?: string;

  @ApiPropertyOptional({ description: 'Is the business closed on this day' })
  @IsOptional()
  @IsBoolean()
  closed?: boolean;
}

export class BusinessHoursDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  monday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  tuesday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  wednesday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  thursday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  friday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  saturday?: DayHoursDto;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DayHoursDto)
  sunday?: DayHoursDto;
}

// Business Images DTOs
export class BusinessImagesDto implements BusinessImages {
  @ApiProperty({ description: 'Business logo URL' })
  @IsUrl()
  logo: string;

  @ApiPropertyOptional({ description: 'Business banner image URL' })
  @IsOptional()
  @IsUrl()
  banner?: string;

  @ApiPropertyOptional({ description: 'Gallery image URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({ description: 'Menu image URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  menuImages?: string[];

  @ApiPropertyOptional({ description: 'Facility image URLs' })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  facilityImages?: string[];
}

// Business Features DTOs
export class BusinessFeaturesDto implements BusinessFeatures {
  // Gym Features
  @ApiPropertyOptional({ description: 'Has personal training services' })
  @IsOptional()
  @IsBoolean()
  hasPersonalTraining?: boolean;

  @ApiPropertyOptional({ description: 'Has group fitness classes' })
  @IsOptional()
  @IsBoolean()
  hasGroupClasses?: boolean;

  @ApiPropertyOptional({ description: 'Has swimming pool' })
  @IsOptional()
  @IsBoolean()
  hasSwimmingPool?: boolean;

  @ApiPropertyOptional({ description: 'Has sauna facilities' })
  @IsOptional()
  @IsBoolean()
  hasSauna?: boolean;

  @ApiPropertyOptional({ description: 'Has 24-hour access' })
  @IsOptional()
  @IsBoolean()
  has24HourAccess?: boolean;

  @ApiPropertyOptional({ description: 'Has childcare services' })
  @IsOptional()
  @IsBoolean()
  hasChildcare?: boolean;

  @ApiPropertyOptional({ description: 'Has nutrition counseling' })
  @IsOptional()
  @IsBoolean()
  hasNutritionCounseling?: boolean;

  // Restaurant Features
  @ApiPropertyOptional({ description: 'Offers delivery service' })
  @IsOptional()
  @IsBoolean()
  hasDelivery?: boolean;

  @ApiPropertyOptional({ description: 'Offers pickup service' })
  @IsOptional()
  @IsBoolean()
  hasPickup?: boolean;

  @ApiPropertyOptional({ description: 'Offers catering service' })
  @IsOptional()
  @IsBoolean()
  hasCateringService?: boolean;

  @ApiPropertyOptional({ description: 'Has vegan options' })
  @IsOptional()
  @IsBoolean()
  hasVeganOptions?: boolean;

  @ApiPropertyOptional({ description: 'Has gluten-free options' })
  @IsOptional()
  @IsBoolean()
  hasGlutenFreeOptions?: boolean;

  @ApiPropertyOptional({ description: 'Has keto diet options' })
  @IsOptional()
  @IsBoolean()
  hasKetoDiet?: boolean;

  @ApiPropertyOptional({ description: 'Offers meal prep services' })
  @IsOptional()
  @IsBoolean()
  hasMealPrep?: boolean;

  @ApiPropertyOptional({ description: 'Provides nutrition information' })
  @IsOptional()
  @IsBoolean()
  hasNutritionInfo?: boolean;

  // General Features
  @ApiPropertyOptional({ description: 'Has parking available' })
  @IsOptional()
  @IsBoolean()
  hasParking?: boolean;

  @ApiPropertyOptional({ description: 'Is wheelchair accessible' })
  @IsOptional()
  @IsBoolean()
  isWheelchairAccessible?: boolean;

  @ApiPropertyOptional({ description: 'Accepts credit cards' })
  @IsOptional()
  @IsBoolean()
  acceptsCreditCards?: boolean;

  @ApiPropertyOptional({ description: 'Has WiFi available' })
  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @ApiPropertyOptional({ description: 'Is pet friendly' })
  @IsOptional()
  @IsBoolean()
  petFriendly?: boolean;
}

// Business Offers DTOs
export class BusinessOffersDto implements BusinessOffers {
  @ApiProperty({ description: 'Offer unique identifier' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Offer title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Offer description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Discount amount in currency' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Original price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'Discounted price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountedPrice?: number;

  @ApiProperty({ description: 'Offer valid from date' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  validFrom: Date;

  @ApiProperty({ description: 'Offer valid until date' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  validUntil: Date;

  @ApiPropertyOptional({ description: 'Promo code for the offer' })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  termsAndConditions?: string[];

  @ApiPropertyOptional({ description: 'Maximum number of redemptions' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRedemptions?: number;

  @ApiProperty({ description: 'Current number of redemptions' })
  @IsNumber()
  @Min(0)
  currentRedemptions: number;
}

// Business Targeting DTOs
export class BusinessTargetingDto implements BusinessTargeting {
  @ApiProperty({ description: 'Target audience segments' })
  @IsArray()
  @IsString({ each: true })
  targetAudience: string[];

  @ApiProperty({ description: 'Target age groups' })
  @IsArray()
  @IsString({ each: true })
  ageGroups: string[];

  @ApiProperty({ description: 'Target fitness levels' })
  @IsArray()
  @IsString({ each: true })
  fitnessLevels: string[];

  @ApiProperty({ description: 'Target dietary preferences' })
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences: string[];

  @ApiProperty({ description: 'Geographic radius in kilometers' })
  @IsNumber()
  @Min(1)
  @Max(100)
  geographicRadius: number;

  @ApiProperty({ description: 'Target interests' })
  @IsArray()
  @IsString({ each: true })
  interests: string[];
}

// Business Contract DTOs
export class BusinessContractDto implements BusinessContract {
  @ApiProperty({ description: 'Contract unique identifier' })
  @IsString()
  contractId: string;

  @ApiProperty({ description: 'Contract start date' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({ description: 'Contract end date' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiProperty({ description: 'Monthly fee amount' })
  @IsNumber()
  @Min(0)
  monthlyFee: number;

  @ApiPropertyOptional({ description: 'One-time setup fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number;

  @ApiProperty({ description: 'Payment method' })
  @IsString()
  paymentMethod: string;

  @ApiProperty({ description: 'Billing cycle' })
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  billingCycle: 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({ description: 'Auto-renewal enabled' })
  @IsBoolean()
  autoRenewal: boolean;

  @ApiProperty({ description: 'Contract terms and conditions' })
  @IsString()
  contractTerms: string;

  @ApiProperty({ description: 'Contract signed date' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  signedDate: Date;

  @ApiProperty({ description: 'Contract signed by' })
  @IsString()
  signedBy: string;

  @ApiProperty({ description: 'Renewal notification days in advance' })
  @IsNumber()
  @Min(1)
  @Max(90)
  renewalNotificationDays: number;
}

// Main Create DTOs
export class CreatePromotedBusinessDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: 'Business description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Business tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ description: 'Type of business', enum: BusinessType })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  @IsEnum(PromotionType)
  promotionType: PromotionType;

  @ApiProperty({ description: 'Business location', type: BusinessLocationDto })
  @ValidateNested()
  @Type(() => BusinessLocationDto)
  location: BusinessLocationDto;

  @ApiProperty({
    description: 'Business contact information',
    type: BusinessContactDto,
  })
  @ValidateNested()
  @Type(() => BusinessContactDto)
  contact: BusinessContactDto;

  @ApiProperty({ description: 'Business hours', type: BusinessHoursDto })
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours: BusinessHoursDto;

  @ApiProperty({ description: 'Business images', type: BusinessImagesDto })
  @ValidateNested()
  @Type(() => BusinessImagesDto)
  images: BusinessImagesDto;

  @ApiProperty({ description: 'Business features', type: BusinessFeaturesDto })
  @ValidateNested()
  @Type(() => BusinessFeaturesDto)
  features: BusinessFeaturesDto;

  @ApiPropertyOptional({
    description: 'Business offers',
    type: [BusinessOffersDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessOffersDto)
  offers?: BusinessOffersDto[];

  @ApiProperty({
    description: 'Business targeting',
    type: BusinessTargetingDto,
  })
  @ValidateNested()
  @Type(() => BusinessTargetingDto)
  targeting: BusinessTargetingDto;

  @ApiProperty({ description: 'Business contract', type: BusinessContractDto })
  @ValidateNested()
  @Type(() => BusinessContractDto)
  contract: BusinessContractDto;

  @ApiPropertyOptional({
    description: 'Priority level (1-10)',
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Price range (1-4)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priceRange?: number;

  @ApiPropertyOptional({ description: 'Business categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Business certifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];
}

// Update DTOs
export class UpdatePromotedBusinessDto {
  @ApiPropertyOptional({ description: 'Business name' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional({ description: 'Business description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiPropertyOptional({ description: 'Business status', enum: BusinessStatus })
  @IsOptional()
  @IsEnum(BusinessStatus)
  status?: BusinessStatus;

  @ApiPropertyOptional({ description: 'Promotion type', enum: PromotionType })
  @IsOptional()
  @IsEnum(PromotionType)
  promotionType?: PromotionType;

  @ApiPropertyOptional({
    description: 'Business location',
    type: BusinessLocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessLocationDto)
  location?: BusinessLocationDto;

  @ApiPropertyOptional({
    description: 'Business contact',
    type: BusinessContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessContactDto)
  contact?: BusinessContactDto;

  @ApiPropertyOptional({
    description: 'Business hours',
    type: BusinessHoursDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto;

  @ApiPropertyOptional({
    description: 'Business images',
    type: BusinessImagesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessImagesDto)
  images?: BusinessImagesDto;

  @ApiPropertyOptional({
    description: 'Business features',
    type: BusinessFeaturesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessFeaturesDto)
  features?: BusinessFeaturesDto;

  @ApiPropertyOptional({
    description: 'Business offers',
    type: [BusinessOffersDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BusinessOffersDto)
  offers?: BusinessOffersDto[];

  @ApiPropertyOptional({
    description: 'Business targeting',
    type: BusinessTargetingDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessTargetingDto)
  targeting?: BusinessTargetingDto;

  @ApiPropertyOptional({ description: 'Priority level (1-10)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({ description: 'Is featured' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Business rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Price range (1-4)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  priceRange?: number;

  @ApiPropertyOptional({ description: 'Business categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Business certifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Is verified' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

// Query DTOs
export class GetPromotedBusinessesDto {
  @ApiPropertyOptional({
    description: 'Business type filter',
    enum: BusinessType,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({ description: 'City filter' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State filter' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Country filter' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Featured businesses only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Active businesses only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  activeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => parseFloat(value))
  minRating?: number;

  @ApiPropertyOptional({ description: 'Maximum distance in km' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseFloat(value))
  maxDistance?: number;

  @ApiPropertyOptional({
    description: 'User latitude for distance calculation',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  latitude?: number;

  @ApiPropertyOptional({
    description: 'User longitude for distance calculation',
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: ['rating', 'distance', 'priority', 'name', 'created'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'rating' | 'distance' | 'priority' | 'name' | 'created';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Price range filter (1-4)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  @Transform(({ value }) => parseInt(value))
  priceRange?: number;

  @ApiPropertyOptional({ description: 'Has offers only' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  hasOffers?: boolean;
}

// Interaction DTOs
export class CreateInteractionDto {
  @ApiProperty({ description: 'Business ID' })
  @IsUUID()
  businessId: string;

  @ApiProperty({ description: 'Interaction type', enum: InteractionType })
  @IsEnum(InteractionType)
  interactionType: InteractionType;

  @ApiPropertyOptional({ description: 'Interaction metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

// Response DTOs
export class PromotedBusinessResponseDto {
  @ApiProperty({ description: 'Business ID' })
  id: string;

  @ApiProperty({ description: 'Business name' })
  businessName: string;

  @ApiProperty({ description: 'Business description' })
  description: string;

  @ApiPropertyOptional({ description: 'Business tagline' })
  tagline?: string;

  @ApiProperty({ description: 'Business type', enum: BusinessType })
  businessType: BusinessType;

  @ApiProperty({ description: 'Business status', enum: BusinessStatus })
  status: BusinessStatus;

  @ApiProperty({ description: 'Promotion type', enum: PromotionType })
  promotionType: PromotionType;

  @ApiProperty({ description: 'Business location' })
  location: BusinessLocation;

  @ApiProperty({ description: 'Business contact' })
  contact: BusinessContact;

  @ApiProperty({ description: 'Business hours' })
  businessHours: BusinessHours;

  @ApiProperty({ description: 'Business images' })
  images: BusinessImages;

  @ApiProperty({ description: 'Business features' })
  features: BusinessFeatures;

  @ApiPropertyOptional({ description: 'Current offers' })
  offers?: BusinessOffers[];

  @ApiProperty({ description: 'Business targeting' })
  targeting: BusinessTargeting;

  @ApiProperty({ description: 'Priority level' })
  priority: number;

  @ApiProperty({ description: 'Is featured' })
  isFeatured: boolean;

  @ApiProperty({ description: 'Business rating' })
  rating: number;

  @ApiProperty({ description: 'Review count' })
  reviewCount: number;

  @ApiPropertyOptional({ description: 'Price range' })
  priceRange?: number;

  @ApiPropertyOptional({ description: 'Business categories' })
  categories?: string[];

  @ApiPropertyOptional({ description: 'Business certifications' })
  certifications?: string[];

  @ApiProperty({ description: 'Is verified' })
  isVerified: boolean;

  @ApiProperty({ description: 'Contract start date' })
  contractStartDate: Date;

  @ApiProperty({ description: 'Contract end date' })
  contractEndDate: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  // Computed properties
  @ApiProperty({ description: 'Is currently active' })
  isActive: boolean;

  @ApiProperty({ description: 'Is contract expiring soon' })
  isContractExpiring: boolean;

  @ApiProperty({ description: 'Days until contract expiry' })
  daysUntilExpiry: number;

  @ApiProperty({ description: 'Click-through rate' })
  clickThroughRate: number;

  @ApiProperty({ description: 'Conversion rate' })
  conversionRate: number;

  @ApiProperty({ description: 'Is currently open' })
  isOpenNow: boolean;

  @ApiProperty({ description: 'Has active offers' })
  hasActiveOffers: boolean;

  @ApiPropertyOptional({ description: 'Distance from user (km)' })
  distanceFromUser?: number;

  @ApiProperty({ description: 'Popularity score' })
  popularityScore: number;
}

export class HomePageBusinessesResponseDto {
  @ApiProperty({
    description: 'Featured gyms',
    type: [PromotedBusinessResponseDto],
  })
  featuredGyms: PromotedBusinessResponseDto[];

  @ApiProperty({
    description: 'Featured nutrition restaurants',
    type: [PromotedBusinessResponseDto],
  })
  featuredNutritionRestaurants: PromotedBusinessResponseDto[];

  @ApiProperty({ description: 'Total number of gyms' })
  totalGyms: number;

  @ApiProperty({ description: 'Total number of nutrition restaurants' })
  totalNutritionRestaurants: number;

  @ApiProperty({ description: 'User location used for distance calculation' })
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}
