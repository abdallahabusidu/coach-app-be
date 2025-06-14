import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import {
  PaymentEntity,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Currency,
} from '../entities/payment.entity';
import {
  SubscriptionEntity,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { ProductEntity } from '../entities/product.entity';
import { UserEntity } from '../../auth/entities/user.entity';
import {
  CreatePaymentDto,
  AppleIAPValidationDto,
  GooglePlayValidationDto,
  StripePaymentDto,
  PaymentResponseDto,
  PaymentListResponseDto,
  PaymentAnalyticsDto,
} from '../dtos/payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,

    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,

    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new payment record
   */
  async createPayment(
    userId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate product if provided
    let product: ProductEntity | undefined;
    if (createPaymentDto.productId) {
      product = await this.productRepository.findOne({
        where: { id: createPaymentDto.productId },
      });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Validate payment method is allowed for this product
      if (
        !product.allowedPaymentMethods.includes(createPaymentDto.paymentMethod)
      ) {
        throw new BadRequestException(
          `Payment method ${createPaymentDto.paymentMethod} not allowed for this product`,
        );
      }
    }

    // Calculate fees
    const { platformFee, serviceFee, netAmount } = this.calculateFees(
      createPaymentDto.amount,
      createPaymentDto.paymentMethod,
      createPaymentDto.paymentType,
    );

    // Set expiry for pending payments (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create payment record
    const payment = new PaymentEntity();
    payment.user = user;
    payment.userId = userId;
    payment.paymentMethod = createPaymentDto.paymentMethod;
    payment.paymentType = createPaymentDto.paymentType;
    payment.amount = createPaymentDto.amount;
    payment.currency = createPaymentDto.currency;
    payment.platformFee = platformFee;
    payment.serviceFee = serviceFee;
    payment.netAmount = netAmount;
    payment.subscriptionId = createPaymentDto.subscriptionId;
    payment.packageId = createPaymentDto.productId;
    payment.coachId = createPaymentDto.coachId;
    payment.description = createPaymentDto.description;
    payment.metadata = {
      ...createPaymentDto.metadata,
      platform: createPaymentDto.metadata?.platform as any,
    };
    payment.expiresAt = expiresAt;
    payment.isRecurring =
      createPaymentDto.paymentType === PaymentType.SUBSCRIPTION;
    payment.isTest = process.env.NODE_ENV !== 'production';

    const savedPayment = await this.paymentRepository.save(payment);
    return this.transformPaymentToDto(savedPayment);
  }

  /**
   * Validate Apple In-App Purchase
   */
  async validateAppleIAP(
    userId: string,
    validationDto: AppleIAPValidationDto,
  ): Promise<PaymentResponseDto> {
    try {
      // Validate with Apple's servers
      const validationResult = await this.validateAppleReceipt(
        validationDto.receiptData,
        validationDto.isTest,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException('Invalid Apple receipt');
      }

      // Find or create payment record
      let payment = await this.paymentRepository.findOne({
        where: {
          userId,
          appleProductId: validationDto.productId,
          externalTransactionId: validationDto.transactionId,
        },
      });

      if (!payment) {
        // Create new payment record
        const product = await this.productRepository.findOne({
          where: { appleProductId: validationDto.productId },
        });

        if (!product) {
          throw new NotFoundException('Product not found for Apple product ID');
        }

        const { platformFee, serviceFee, netAmount } = this.calculateFees(
          validationResult.amount,
          PaymentMethod.APPLE_IAP,
          PaymentType.SUBSCRIPTION,
        );

        payment = new PaymentEntity();
        payment.userId = userId;
        payment.paymentMethod = PaymentMethod.APPLE_IAP;
        payment.paymentType =
          product.type === 'subscription'
            ? PaymentType.SUBSCRIPTION
            : PaymentType.ONE_TIME;
        payment.amount = validationResult.amount;
        payment.currency = Currency.USD;
        payment.platformFee = platformFee;
        payment.serviceFee = serviceFee;
        payment.netAmount = netAmount;
        payment.externalTransactionId = validationDto.transactionId;
        payment.appleProductId = validationDto.productId;
        payment.appleReceiptData = validationDto.receiptData;
        payment.packageId = product.id;
        payment.isRecurring = product.type === 'subscription';
        payment.isTest = validationDto.isTest || false;
        payment.metadata = {
          platform: 'ios' as any,
          originalTransactionId: validationDto.originalTransactionId,
        };
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      payment.validationData = {
        isValid: true,
        validatedAt: new Date(),
        validationSource: 'apple',
        originalResponse: validationResult.rawResponse,
      };

      const savedPayment = await this.paymentRepository.save(payment);

      // Handle subscription activation if applicable
      if (payment.isRecurring) {
        await this.handleSubscriptionActivation(savedPayment);
      }

      this.logger.log(`Apple IAP validated successfully for user ${userId}`);
      return this.transformPaymentToDto(savedPayment);
    } catch (error) {
      this.logger.error(`Apple IAP validation failed: ${error.message}`);
      throw new BadRequestException(
        `Apple IAP validation failed: ${error.message}`,
      );
    }
  }

  /**
   * Validate Google Play Purchase
   */
  async validateGooglePlayPurchase(
    userId: string,
    validationDto: GooglePlayValidationDto,
  ): Promise<PaymentResponseDto> {
    try {
      // Validate with Google Play API
      const validationResult = await this.validateGooglePlayToken(
        validationDto.purchaseToken,
        validationDto.productId,
        validationDto.packageName,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException('Invalid Google Play purchase');
      }

      // Find or create payment record
      let payment = await this.paymentRepository.findOne({
        where: {
          userId,
          googleProductId: validationDto.productId,
          googlePurchaseToken: validationDto.purchaseToken,
        },
      });

      if (!payment) {
        // Create new payment record
        const product = await this.productRepository.findOne({
          where: { googleProductId: validationDto.productId },
        });

        if (!product) {
          throw new NotFoundException(
            'Product not found for Google product ID',
          );
        }

        const { platformFee, serviceFee, netAmount } = this.calculateFees(
          validationResult.amount,
          PaymentMethod.GOOGLE_PLAY,
          PaymentType.SUBSCRIPTION,
        );

        payment = new PaymentEntity();
        payment.userId = userId;
        payment.paymentMethod = PaymentMethod.GOOGLE_PLAY;
        payment.paymentType =
          product.type === 'subscription'
            ? PaymentType.SUBSCRIPTION
            : PaymentType.ONE_TIME;
        payment.amount = validationResult.amount;
        payment.currency = Currency.USD;
        payment.platformFee = platformFee;
        payment.serviceFee = serviceFee;
        payment.netAmount = netAmount;
        payment.externalTransactionId = validationDto.orderId;
        payment.googleProductId = validationDto.productId;
        payment.googlePurchaseToken = validationDto.purchaseToken;
        payment.packageId = product.id;
        payment.isRecurring = product.type === 'subscription';
        payment.isTest = validationResult.isTest || false;
        payment.metadata = {
          platform: 'android' as any,
        };
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      payment.validationData = {
        isValid: true,
        validatedAt: new Date(),
        validationSource: 'google',
        originalResponse: validationResult.rawResponse,
      };

      const savedPayment = await this.paymentRepository.save(payment);

      // Handle subscription activation if applicable
      if (payment.isRecurring) {
        await this.handleSubscriptionActivation(savedPayment);
      }

      this.logger.log(
        `Google Play purchase validated successfully for user ${userId}`,
      );
      return this.transformPaymentToDto(savedPayment);
    } catch (error) {
      this.logger.error(`Google Play validation failed: ${error.message}`);
      throw new BadRequestException(
        `Google Play validation failed: ${error.message}`,
      );
    }
  }

  /**
   * Process Stripe payment
   */
  async processStripePayment(
    userId: string,
    stripeDto: StripePaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      // Find existing payment by Stripe payment intent
      const payment = await this.paymentRepository.findOne({
        where: {
          userId,
          stripePaymentIntentId: stripeDto.paymentIntentId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Validate with Stripe API
      const validationResult = await this.validateStripePayment(
        stripeDto.paymentIntentId,
      );

      if (!validationResult.isValid) {
        payment.status = PaymentStatus.FAILED;
        payment.failureReason = validationResult.failureReason;
        await this.paymentRepository.save(payment);
        throw new BadRequestException('Stripe payment validation failed');
      }

      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.completedAt = new Date();
      payment.validationData = {
        isValid: true,
        validatedAt: new Date(),
        validationSource: 'stripe',
        originalResponse: validationResult.rawResponse,
      };

      const savedPayment = await this.paymentRepository.save(payment);

      // Handle subscription activation if applicable
      if (payment.isRecurring) {
        await this.handleSubscriptionActivation(savedPayment);
      }

      this.logger.log(
        `Stripe payment processed successfully for user ${userId}`,
      );
      return this.transformPaymentToDto(savedPayment);
    } catch (error) {
      this.logger.error(`Stripe payment processing failed: ${error.message}`);
      throw new BadRequestException(
        `Stripe payment processing failed: ${error.message}`,
      );
    }
  }

  /**
   * Get user payments with pagination
   */
  async getUserPayments(
    userId: string,
    filters: {
      status?: PaymentStatus;
      paymentMethod?: PaymentMethod;
      paymentType?: PaymentType;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<PaymentListResponseDto> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.userId = :userId', { userId });

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('payment.status = :status', {
        status: filters.status,
      });
    }

    if (filters.paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', {
        paymentMethod: filters.paymentMethod,
      });
    }

    if (filters.paymentType) {
      queryBuilder.andWhere('payment.paymentType = :paymentType', {
        paymentType: filters.paymentType,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'payment.createdAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.orderBy('payment.createdAt', 'DESC').skip(offset).take(limit);

    const payments = await queryBuilder.getMany();

    const paymentDtos = payments.map((payment) =>
      this.transformPaymentToDto(payment),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return {
      payments: paymentDtos,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PaymentAnalyticsDto> {
    const whereClause: any = {
      status: PaymentStatus.COMPLETED,
    };

    if (startDate && endDate) {
      whereClause.completedAt = Between(startDate, endDate);
    }

    const payments = await this.paymentRepository.find({
      where: whereClause,
      relations: ['user'],
    });

    // Calculate metrics
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
    const failedPayments = await this.paymentRepository.count({
      where: { status: PaymentStatus.FAILED },
    });

    const averageTransactionValue =
      totalPayments > 0 ? totalRevenue / totalPayments : 0;

    // Revenue by payment method
    const revenueByPaymentMethod = payments.reduce(
      (acc, payment) => {
        const method = payment.paymentMethod;
        acc[method] = (acc[method] || 0) + Number(payment.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Monthly recurring revenue (subscriptions only)
    const subscriptionPayments = payments.filter((p) => p.isRecurring);
    const monthlyRecurringRevenue = subscriptionPayments.reduce((sum, p) => {
      // Convert to monthly value based on billing cycle
      return sum + Number(p.amount);
    }, 0);

    // Monthly revenue trend (last 12 months)
    const monthlyRevenueTrend = this.calculateMonthlyRevenueTrend(payments);

    // Top products by revenue
    const topProductsByRevenue = await this.getTopProductsByRevenue();

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      totalPayments,
      successfulPayments,
      failedPayments,
      averageTransactionValue,
      revenueByPaymentMethod,
      monthlyRevenueTrend,
      topProductsByRevenue,
    };
  }

  /**
   * Calculate fees based on payment method and type
   */
  private calculateFees(
    amount: number,
    paymentMethod: PaymentMethod,
    paymentType: PaymentType,
  ): {
    platformFee: number;
    serviceFee: number;
    netAmount: number;
  } {
    let platformFee = 0;
    let serviceFee = 0;

    switch (paymentMethod) {
      case PaymentMethod.APPLE_IAP:
      case PaymentMethod.GOOGLE_PLAY:
        platformFee = amount * 0.3; // 30% store fee
        break;
      case PaymentMethod.STRIPE:
        platformFee = amount * 0.029 + 0.3; // Stripe fee
        break;
      case PaymentMethod.PAYPAL:
        platformFee = amount * 0.035 + 0.3; // PayPal fee
        break;
      default:
        platformFee = 0;
    }

    // App service fee (5% on top of platform fee)
    serviceFee = amount * 0.05;

    const netAmount = amount - platformFee - serviceFee;

    return {
      platformFee: Number(platformFee.toFixed(2)),
      serviceFee: Number(serviceFee.toFixed(2)),
      netAmount: Number(netAmount.toFixed(2)),
    };
  }

  /**
   * Handle subscription activation after successful payment
   */
  private async handleSubscriptionActivation(
    payment: PaymentEntity,
  ): Promise<void> {
    if (!payment.subscriptionId) return;

    const subscription = await this.subscriptionRepository.findOne({
      where: { id: payment.subscriptionId },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.lastBillingDate = new Date();

      // Calculate next billing date
      const nextBilling = new Date();
      switch (subscription.billingCycle) {
        case 'monthly':
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          break;
        case 'quarterly':
          nextBilling.setMonth(nextBilling.getMonth() + 3);
          break;
        case 'yearly':
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
          break;
      }
      subscription.nextBillingDate = nextBilling;

      await this.subscriptionRepository.save(subscription);
    }
  }

  /**
   * Validate Apple receipt with Apple servers
   */
  private async validateAppleReceipt(
    receiptData: string,
    isTest: boolean = false,
  ): Promise<any> {
    // This would integrate with Apple's receipt validation service
    // For now, return a mock validation result
    return {
      isValid: true,
      amount: 9.99,
      rawResponse: { status: 0 },
    };
  }

  /**
   * Validate Google Play purchase token
   */
  private async validateGooglePlayToken(
    purchaseToken: string,
    productId: string,
    packageName?: string,
  ): Promise<any> {
    // This would integrate with Google Play Developer API
    // For now, return a mock validation result
    return {
      isValid: true,
      amount: 9.99,
      isTest: false,
      rawResponse: { purchaseState: 1 },
    };
  }

  /**
   * Validate Stripe payment
   */
  private async validateStripePayment(paymentIntentId: string): Promise<any> {
    // This would integrate with Stripe API
    // For now, return a mock validation result
    return {
      isValid: true,
      rawResponse: { status: 'succeeded' },
    };
  }

  /**
   * Calculate monthly revenue trend
   */
  private calculateMonthlyRevenueTrend(payments: PaymentEntity[]): Array<{
    month: string;
    revenue: number;
    paymentCount: number;
  }> {
    const monthlyData = new Map<string, { revenue: number; count: number }>();

    payments.forEach((payment) => {
      if (payment.completedAt) {
        const monthKey = payment.completedAt.toISOString().substring(0, 7); // YYYY-MM
        const existing = monthlyData.get(monthKey) || { revenue: 0, count: 0 };
        existing.revenue += Number(payment.amount);
        existing.count += 1;
        monthlyData.set(monthKey, existing);
      }
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      paymentCount: data.count,
    }));
  }

  /**
   * Get top products by revenue
   */
  private async getTopProductsByRevenue(): Promise<
    Array<{
      productId: string;
      productName: string;
      revenue: number;
      salesCount: number;
    }>
  > {
    // This would aggregate payment data by product
    // For now, return empty array
    return [];
  }

  /**
   * Transform payment entity to DTO
   */
  private transformPaymentToDto(payment: PaymentEntity): PaymentResponseDto {
    return {
      id: payment.id,
      userId: payment.userId,
      paymentMethod: payment.paymentMethod,
      paymentType: payment.paymentType,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      platformFee: Number(payment.platformFee),
      serviceFee: Number(payment.serviceFee),
      netAmount: Number(payment.netAmount),
      externalTransactionId: payment.externalTransactionId,
      subscriptionId: payment.subscriptionId,
      coachId: payment.coachId,
      description: payment.description,
      isRecurring: payment.isRecurring,
      isTest: payment.isTest,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
    };
  }
}
