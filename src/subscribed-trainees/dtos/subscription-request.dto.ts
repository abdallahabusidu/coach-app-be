import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsUUID,
  MinLength,
  MaxLength,
  IsEmail,
  IsIn,
} from 'class-validator';
import {
  RequestType,
  SubscriptionStatus,
} from '../entities/subscription-request.entity';

export class TraineeGoalsDto {
  @ApiProperty({ description: 'Primary fitness goals', type: [String] })
  @IsArray()
  @IsString({ each: true })
  primaryGoals: string[];

  @ApiPropertyOptional({ description: 'Target weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeight?: number;

  @ApiPropertyOptional({ description: 'Timeframe to achieve goals' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeframe?: string;

  @ApiPropertyOptional({ description: 'Fitness experience level' })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  experience?: 'beginner' | 'intermediate' | 'advanced';

  @ApiPropertyOptional({ description: 'Preferred workout frequency per week' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  workoutFrequency?: number;

  @ApiPropertyOptional({ description: 'Dietary restrictions', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryRestrictions?: string[];

  @ApiPropertyOptional({
    description: 'Medical conditions to consider',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalConditions?: string[];

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SubscriptionDetailsDto {
  @ApiPropertyOptional({ description: 'Preferred start date' })
  @IsOptional()
  @IsDateString()
  preferredStartDate?: string;

  @ApiPropertyOptional({ description: 'Subscription duration in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  duration?: number;

  @ApiPropertyOptional({ description: 'Preferred sessions per week' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(7)
  sessionsPerWeek?: number;

  @ApiPropertyOptional({
    description: 'Preferred schedule times',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSchedule?: string[];

  @ApiPropertyOptional({ description: 'Communication preference' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'as_needed'])
  communicationPreference?: 'daily' | 'weekly' | 'as_needed';

  @ApiPropertyOptional({ description: 'Budget range' })
  @IsOptional()
  @IsObject()
  budgetRange?: {
    min: number;
    max: number;
  };

  @ApiPropertyOptional({
    description: 'Additional services requested',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  additionalServices?: string[];
}

export class CoachTermsDto {
  @ApiPropertyOptional({ description: 'Monthly subscription fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;

  @ApiPropertyOptional({ description: 'One-time setup fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number;

  @ApiPropertyOptional({ description: 'Number of sessions included per month' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sessionsIncluded?: number;

  @ApiPropertyOptional({ description: 'Rate for additional sessions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  additionalSessionRate?: number;

  @ApiPropertyOptional({ description: 'Cancellation policy details' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationPolicy?: string;

  @ApiPropertyOptional({ description: 'Payment terms and conditions' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: 'Services to be provided',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicesToProvide?: string[];

  @ApiPropertyOptional({ description: 'Minimum commitment period in months' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  commitmentPeriod?: number;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  trialPeriod?: number;
}

export class CreateSubscriptionRequestDto {
  @ApiProperty({ description: 'Coach ID to send request to' })
  @IsUUID()
  coachId: string;

  @ApiPropertyOptional({
    description: 'Package ID if requesting specific package',
  })
  @IsOptional()
  @IsUUID()
  packageId?: string;

  @ApiProperty({ description: 'Type of request', enum: RequestType })
  @IsEnum(RequestType)
  requestType: RequestType;

  @ApiPropertyOptional({ description: 'Message to the coach' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  traineeMessage?: string;

  @ApiProperty({
    description: 'Trainee goals and objectives',
    type: TraineeGoalsDto,
  })
  @ValidateNested()
  @Type(() => TraineeGoalsDto)
  traineeGoals: TraineeGoalsDto;

  @ApiPropertyOptional({
    description: 'Subscription details and preferences',
    type: SubscriptionDetailsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionDetailsDto)
  subscriptionDetails?: SubscriptionDetailsDto;

  @ApiPropertyOptional({ description: 'Request priority level' })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Source of the request' })
  @IsOptional()
  @IsIn(['search', 'referral', 'social_media', 'advertisement', 'website'])
  source?: string;

  @ApiPropertyOptional({ description: 'Allow coach to message you' })
  @IsOptional()
  @IsBoolean()
  canMessage?: boolean;

  @ApiPropertyOptional({ description: 'Allow coach to view your profile' })
  @IsOptional()
  @IsBoolean()
  canViewProfile?: boolean;
}

export class RespondToRequestDto {
  @ApiProperty({ description: 'Response status', enum: SubscriptionStatus })
  @IsEnum([SubscriptionStatus.APPROVED, SubscriptionStatus.REJECTED])
  status: SubscriptionStatus.APPROVED | SubscriptionStatus.REJECTED;

  @ApiPropertyOptional({ description: 'Response message from coach' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coachResponse?: string;

  @ApiPropertyOptional({
    description: 'Coach terms and conditions',
    type: CoachTermsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoachTermsDto)
  coachTerms?: CoachTermsDto;

  @ApiPropertyOptional({ description: 'Subscription start date (if approved)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Subscription end date (if approved)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Monthly subscription fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyFee?: number;
}

export class CoachSearchDto {
  @ApiPropertyOptional({
    description: 'Search query for coach name or specialization',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  query?: string;

  @ApiPropertyOptional({
    description: 'Filter by specializations',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specializations?: string[];

  @ApiPropertyOptional({ description: 'Filter by experience level' })
  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  experienceLevel?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum rating' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price per month' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by location/city' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by gender preference' })
  @IsOptional()
  @IsIn(['male', 'female', 'any'])
  gender?: string;

  @ApiPropertyOptional({ description: 'Filter by availability' })
  @IsOptional()
  @IsBoolean()
  availableOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsIn(['rating', 'price', 'experience', 'created_at', 'name'])
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SubscriptionRequestResponseDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    specializations?: string[];
    rating?: number;
  };

  @ApiProperty({ description: 'Package information' })
  package?: {
    id: string;
    title: string;
    price: number;
    duration: number;
  };

  @ApiProperty({ description: 'Request type', enum: RequestType })
  requestType: RequestType;

  @ApiProperty({ description: 'Request status', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Trainee message' })
  traineeMessage?: string;

  @ApiProperty({ description: 'Coach response' })
  coachResponse?: string;

  @ApiProperty({ description: 'Trainee goals' })
  traineeGoals?: any;

  @ApiProperty({ description: 'Subscription details' })
  subscriptionDetails?: any;

  @ApiProperty({ description: 'Coach terms' })
  coachTerms?: any;

  @ApiProperty({ description: 'Start date' })
  startDate?: Date;

  @ApiProperty({ description: 'End date' })
  endDate?: Date;

  @ApiProperty({ description: 'Monthly fee' })
  monthlyFee?: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment status' })
  paymentStatus: string;

  @ApiProperty({ description: 'Priority level' })
  priority: string;

  @ApiProperty({ description: 'Request source' })
  source: string;

  @ApiProperty({ description: 'Can message' })
  canMessage: boolean;

  @ApiProperty({ description: 'Can view profile' })
  canViewProfile: boolean;

  @ApiProperty({ description: 'Message count' })
  messageCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Response date' })
  respondedAt?: Date;

  @ApiProperty({ description: 'Activation date' })
  activatedAt?: Date;

  @ApiProperty({ description: 'Days since request' })
  daysSinceRequest: number;

  @ApiProperty({ description: 'Is expired' })
  isExpired: boolean;
}

export class CoachSearchResponseDto {
  @ApiProperty({ description: 'Coach ID' })
  id: string;

  @ApiProperty({ description: 'Coach name' })
  name: string;

  @ApiProperty({ description: 'Coach email' })
  email: string;

  @ApiProperty({ description: 'Profile picture URL' })
  profilePicture?: string;

  @ApiProperty({ description: 'Coach bio/description' })
  bio?: string;

  @ApiProperty({ description: 'Specializations' })
  specializations: string[];

  @ApiProperty({ description: 'Years of experience' })
  yearsOfExperience?: number;

  @ApiProperty({ description: 'Average rating' })
  rating?: number;

  @ApiProperty({ description: 'Number of reviews' })
  reviewCount?: number;

  @ApiProperty({ description: 'Starting price per month' })
  startingPrice?: number;

  @ApiProperty({ description: 'Location/City' })
  location?: string;

  @ApiProperty({ description: 'Is currently accepting new clients' })
  isAcceptingClients: boolean;

  @ApiProperty({ description: 'Number of active clients' })
  activeClientCount: number;

  @ApiProperty({ description: 'Response time (in hours)' })
  averageResponseTime?: number;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate?: number;

  @ApiProperty({ description: 'Certifications' })
  certifications?: string[];

  @ApiProperty({ description: 'Languages spoken' })
  languages?: string[];

  @ApiProperty({ description: 'Available packages' })
  packages?: {
    id: string;
    title: string;
    price: number;
    duration: number;
    isPopular?: boolean;
  }[];

  @ApiProperty({ description: 'Has existing request from current user' })
  hasExistingRequest?: boolean;

  @ApiProperty({ description: 'Can send request to this coach' })
  canSendRequest: boolean;
}

export class SubscriptionRequestListResponseDto {
  @ApiProperty({ type: [SubscriptionRequestResponseDto] })
  requests: SubscriptionRequestResponseDto[];

  @ApiProperty({ description: 'Total number of requests' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Request summary' })
  summary: {
    pending: number;
    approved: number;
    rejected: number;
    active: number;
    total: number;
  };
}

export class CoachSearchListResponseDto {
  @ApiProperty({ type: [CoachSearchResponseDto] })
  coaches: CoachSearchResponseDto[];

  @ApiProperty({ description: 'Total number of coaches' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;

  @ApiProperty({ description: 'Search filters applied' })
  appliedFilters: {
    specializations?: string[];
    experienceLevel?: string;
    minRating?: number;
    maxPrice?: number;
    location?: string;
    availableOnly?: boolean;
  };
}
