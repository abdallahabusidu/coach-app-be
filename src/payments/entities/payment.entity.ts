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

export enum PaymentMethod {
  APPLE_IAP = 'apple_iap',
  GOOGLE_PLAY = 'google_play',
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
}

export enum PaymentType {
  SUBSCRIPTION = 'subscription',
  ONE_TIME = 'one_time',
  PACKAGE_PURCHASE = 'package_purchase',
  PHYSICAL_PRODUCT = 'physical_product',
  SERVICE_FEE = 'service_fee',
  COACH_PAYOUT = 'coach_payout',
  REFUND = 'refund',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
  DISPUTED = 'disputed',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
}

@Entity('payments')
@Index(['userId', 'status'])
@Index(['paymentMethod', 'createdAt'])
export class PaymentEntity {
  @ApiProperty({ description: 'Unique identifier for the payment' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User making the payment' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: UserEntity;

  @ApiProperty({ description: 'User ID' })
  @Column()
  @Index()
  userId: string;

  @ApiProperty({ description: 'Payment method used', enum: PaymentMethod })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Type of payment', enum: PaymentType })
  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Currency code', enum: Currency })
  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @ApiProperty({ description: 'Platform fee (Apple/Google 30%)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @ApiProperty({ description: 'App service fee' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @ApiProperty({ description: 'Net amount after fees' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  netAmount: number;

  @ApiProperty({ description: 'External payment provider transaction ID' })
  @Column({ nullable: true })
  @Index()
  externalTransactionId: string;

  @ApiProperty({ description: 'Apple App Store product ID' })
  @Column({ nullable: true })
  appleProductId?: string;

  @ApiProperty({ description: 'Google Play product ID' })
  @Column({ nullable: true })
  googleProductId?: string;

  @ApiProperty({ description: 'Apple receipt data for validation' })
  @Column('text', { nullable: true })
  appleReceiptData?: string;

  @ApiProperty({ description: 'Google Play purchase token' })
  @Column('text', { nullable: true })
  googlePurchaseToken?: string;

  @ApiProperty({ description: 'Stripe payment intent ID' })
  @Column({ nullable: true })
  stripePaymentIntentId?: string;

  @ApiProperty({ description: 'PayPal order ID' })
  @Column({ nullable: true })
  paypalOrderId?: string;

  @ApiProperty({ description: 'Related subscription ID' })
  @Column({ nullable: true })
  subscriptionId?: string;

  @ApiProperty({ description: 'Related package ID' })
  @Column({ nullable: true })
  packageId?: string;

  @ApiProperty({ description: 'Related coach ID for revenue sharing' })
  @Column({ nullable: true })
  @Index()
  coachId?: string;

  @ApiProperty({ description: 'Payment description' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ description: 'Payment metadata' })
  @Column('jsonb', { nullable: true })
  metadata?: {
    platform?: 'ios' | 'android' | 'web';
    deviceType?: string;
    appVersion?: string;
    countryCode?: string;
    originalTransactionId?: string;
    purchaseDate?: string;
    expirationDate?: string;
    autoRenewing?: boolean;
    trialPeriod?: boolean;
    introductoryPrice?: boolean;
    cancellationReason?: string;
    userAgent?: string;
    ipAddress?: string;
  };

  @ApiProperty({ description: 'Receipt validation details' })
  @Column('jsonb', { nullable: true })
  validationData?: {
    isValid: boolean;
    validatedAt: Date;
    validationSource: 'apple' | 'google' | 'stripe' | 'paypal';
    originalResponse: any;
    errors?: string[];
  };

  @ApiProperty({ description: 'Refund information' })
  @Column('jsonb', { nullable: true })
  refundData?: {
    refundedAt: Date;
    refundAmount: number;
    refundReason: string;
    refundMethod: string;
    refundTransactionId: string;
    partialRefund: boolean;
  };

  @ApiProperty({ description: 'Billing address' })
  @Column('jsonb', { nullable: true })
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @ApiProperty({ description: 'Tax information' })
  @Column('jsonb', { nullable: true })
  taxInfo?: {
    taxAmount: number;
    taxRate: number;
    taxRegion: string;
    taxId?: string;
  };

  @ApiProperty({ description: 'Failure reason if payment failed' })
  @Column('text', { nullable: true })
  failureReason?: string;

  @ApiProperty({ description: 'Number of retry attempts' })
  @Column({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Next retry date for failed payments' })
  @Column({ type: 'timestamp', nullable: true })
  nextRetryAt?: Date;

  @ApiProperty({ description: 'Whether payment is recurring subscription' })
  @Column({ default: false })
  isRecurring: boolean;

  @ApiProperty({ description: 'Whether this is a test/sandbox payment' })
  @Column({ default: false })
  isTest: boolean;

  @ApiProperty({ description: 'Payment processing fee' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFee: number;

  @ApiProperty({ description: 'When payment was completed' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'When payment expires (for pending)' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Payment creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Payment last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
