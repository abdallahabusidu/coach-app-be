import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsUUID,
  IsEmail,
  IsIn,
  IsArray,
  IsNotEmpty,
  IsDecimal,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  PaymentMethod,
  PaymentType,
  PaymentStatus,
  Currency,
} from '../entities/payment.entity';
import {
  SubscriptionPlan,
  BillingCycle,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { ProductType } from '../entities/product.entity';

// Payment DTOs
export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency', enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional({ description: 'Product ID for purchase' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Subscription ID for recurring payment' })
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Coach ID for revenue sharing' })
  @IsOptional()
  @IsUUID()
  coachId?: string;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Platform-specific product ID' })
  @IsOptional()
  @IsString()
  platformProductId?: string;

  @ApiPropertyOptional({ description: 'Payment metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class AppleIAPValidationDto {
  @ApiProperty({ description: 'Apple receipt data (base64)' })
  @IsString()
  @IsNotEmpty()
  receiptData: string;

  @ApiProperty({ description: 'Apple product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Original transaction ID' })
  @IsOptional()
  @IsString()
  originalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Whether this is a sandbox receipt' })
  @IsOptional()
  @IsBoolean()
  isTest?: boolean;
}

export class GooglePlayValidationDto {
  @ApiProperty({ description: 'Google Play purchase token' })
  @IsString()
  @IsNotEmpty()
  purchaseToken: string;

  @ApiProperty({ description: 'Google Play product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ description: 'Package name of the app' })
  @IsOptional()
  @IsString()
  packageName?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID' })
  @IsOptional()
  @IsString()
  orderId?: string;
}

export class StripePaymentDto {
  @ApiProperty({ description: 'Stripe payment intent ID' })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiPropertyOptional({ description: 'Client secret' })
  @IsOptional()
  @IsString()
  clientSecret?: string;
}

// Subscription DTOs
export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Subscription plan', enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Coach ID for coached subscriptions' })
  @IsOptional()
  @IsUUID()
  coachId?: string;

  @ApiPropertyOptional({ description: 'Coupon code for discount' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Auto-renewal setting' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Platform-specific subscription ID' })
  @IsOptional()
  @IsString()
  platformSubscriptionId?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'New subscription plan',
    enum: SubscriptionPlan,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  plan?: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'New billing cycle', enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Auto-renewal setting' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}

// Product DTOs
export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ description: 'Base price' })
  @IsNumber()
  @Min(0.01)
  basePrice: number;

  @ApiProperty({ description: 'Currency', enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiPropertyOptional({ description: 'Sale price' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  salePrice?: number;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: SubscriptionPlan,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Trial period in days' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  trialDays?: number;

  @ApiPropertyOptional({ description: 'Apple product ID' })
  @IsOptional()
  @IsString()
  appleProductId?: string;

  @ApiPropertyOptional({ description: 'Google product ID' })
  @IsOptional()
  @IsString()
  googleProductId?: string;

  @ApiPropertyOptional({ description: 'Store compliance flag' })
  @IsOptional()
  @IsBoolean()
  isStoreCompliant?: boolean;

  @ApiPropertyOptional({ description: 'Allowed payment methods' })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentMethod, { each: true })
  allowedPaymentMethods?: PaymentMethod[];

  @ApiPropertyOptional({ description: 'Product features' })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Coach revenue share percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  coachRevenueShare?: number;
}

// Response DTOs
export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment type', enum: PaymentType })
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Currency', enum: Currency })
  currency: Currency;

  @ApiProperty({ description: 'Platform fee' })
  platformFee: number;

  @ApiProperty({ description: 'Service fee' })
  serviceFee: number;

  @ApiProperty({ description: 'Net amount' })
  netAmount: number;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  externalTransactionId?: string;

  @ApiPropertyOptional({ description: 'Subscription ID' })
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Coach ID' })
  coachId?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Is recurring payment' })
  isRecurring: boolean;

  @ApiProperty({ description: 'Is test payment' })
  isTest: boolean;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Completion date' })
  completedAt?: Date;
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Coach ID' })
  coachId?: string;

  @ApiProperty({ description: 'Subscription plan', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty({ description: 'Billing cycle', enum: BillingCycle })
  billingCycle: BillingCycle;

  @ApiProperty({ description: 'Price per billing cycle' })
  price: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Start date' })
  startDate: Date;

  @ApiPropertyOptional({ description: 'End date' })
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Trial end date' })
  trialEndDate?: Date;

  @ApiPropertyOptional({ description: 'Next billing date' })
  nextBillingDate?: Date;

  @ApiProperty({ description: 'Auto-renewal status' })
  autoRenew: boolean;

  @ApiProperty({ description: 'Is in trial' })
  isTrial: boolean;

  @ApiPropertyOptional({ description: 'Features included' })
  features?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Current usage' })
  currentUsage?: Record<string, any>;

  @ApiProperty({ description: 'Days until expiry' })
  daysUntilExpiry: number;

  @ApiProperty({ description: 'Monthly value' })
  monthlyValue: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  id: string;

  @ApiProperty({ description: 'Product name' })
  name: string;

  @ApiProperty({ description: 'Product description' })
  description: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  type: ProductType;

  @ApiProperty({ description: 'Base price' })
  basePrice: number;

  @ApiProperty({ description: 'Current price' })
  currentPrice: number;

  @ApiProperty({ description: 'Currency', enum: Currency })
  currency: Currency;

  @ApiPropertyOptional({ description: 'Sale price' })
  salePrice?: number;

  @ApiProperty({ description: 'Is on sale' })
  isOnSale: boolean;

  @ApiProperty({ description: 'Discount percentage' })
  discountPercentage: number;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: SubscriptionPlan,
  })
  subscriptionPlan?: SubscriptionPlan;

  @ApiPropertyOptional({ description: 'Billing cycle', enum: BillingCycle })
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Trial days' })
  trialDays?: number;

  @ApiProperty({ description: 'Store compliance' })
  isStoreCompliant: boolean;

  @ApiProperty({ description: 'Requires app store payment' })
  requiresAppStorePayment: boolean;

  @ApiProperty({ description: 'Allowed payment methods' })
  allowedPaymentMethods: PaymentMethod[];

  @ApiPropertyOptional({ description: 'Features' })
  features?: Record<string, any>;

  @ApiProperty({ description: 'Sales count' })
  salesCount: number;

  @ApiProperty({ description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ description: 'Review count' })
  reviewCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

// List response DTOs
export class PaymentListResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] })
  payments: PaymentResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

export class SubscriptionListResponseDto {
  @ApiProperty({ type: [SubscriptionResponseDto] })
  subscriptions: SubscriptionResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

export class ProductListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

// Analytics DTOs
export class PaymentAnalyticsDto {
  @ApiProperty({ description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ description: 'Monthly recurring revenue' })
  monthlyRecurringRevenue: number;

  @ApiProperty({ description: 'Total payments' })
  totalPayments: number;

  @ApiProperty({ description: 'Successful payments' })
  successfulPayments: number;

  @ApiProperty({ description: 'Failed payments' })
  failedPayments: number;

  @ApiProperty({ description: 'Average transaction value' })
  averageTransactionValue: number;

  @ApiProperty({ description: 'Revenue by payment method' })
  revenueByPaymentMethod: Record<string, number>;

  @ApiProperty({ description: 'Monthly revenue trend' })
  monthlyRevenueTrend: Array<{
    month: string;
    revenue: number;
    paymentCount: number;
  }>;

  @ApiProperty({ description: 'Top products by revenue' })
  topProductsByRevenue: Array<{
    productId: string;
    productName: string;
    revenue: number;
    salesCount: number;
  }>;
}
