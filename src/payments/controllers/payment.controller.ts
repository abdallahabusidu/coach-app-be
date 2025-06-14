import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { PaymentService } from '../services/payment.service';
import {
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '../entities/payment.entity';
import {
  CreatePaymentDto,
  AppleIAPValidationDto,
  GooglePlayValidationDto,
  StripePaymentDto,
  PaymentResponseDto,
  PaymentListResponseDto,
  PaymentAnalyticsDto,
} from '../dtos/payment.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new payment',
    description:
      'Initialize a new payment for subscription or one-time purchase',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data',
  })
  async createPayment(
    @CurrentUser() user: any,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.createPayment(user.id, createPaymentDto);
  }

  @Post('apple-iap/validate')
  @ApiOperation({
    summary: 'Validate Apple In-App Purchase',
    description: 'Validate Apple IAP receipt and process payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Apple IAP validated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Apple receipt',
  })
  async validateAppleIAP(
    @CurrentUser() user: any,
    @Body() validationDto: AppleIAPValidationDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.validateAppleIAP(user.id, validationDto);
  }

  @Post('google-play/validate')
  @ApiOperation({
    summary: 'Validate Google Play Purchase',
    description: 'Validate Google Play purchase token and process payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google Play purchase validated successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Google Play purchase',
  })
  async validateGooglePlayPurchase(
    @CurrentUser() user: any,
    @Body() validationDto: GooglePlayValidationDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.validateGooglePlayPurchase(
      user.id,
      validationDto,
    );
  }

  @Post('stripe/process')
  @ApiOperation({
    summary: 'Process Stripe payment',
    description: 'Validate and process Stripe payment intent',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stripe payment processed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Stripe payment processing failed',
  })
  async processStripePayment(
    @CurrentUser() user: any,
    @Body() stripeDto: StripePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentService.processStripePayment(user.id, stripeDto);
  }

  @Get('my-payments')
  @ApiOperation({
    summary: 'Get user payments',
    description: 'Get paginated list of user payments with filtering',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payments retrieved successfully',
    type: PaymentListResponseDto,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: PaymentMethod,
    description: 'Filter by payment method',
  })
  @ApiQuery({
    name: 'paymentType',
    required: false,
    enum: PaymentType,
    description: 'Filter by payment type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Filter from date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Filter to date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async getUserPayments(
    @CurrentUser() user: any,
    @Query('status') status?: PaymentStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaymentListResponseDto> {
    const filters: any = {
      status,
      paymentMethod,
      paymentType,
      page,
      limit,
    };

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    return this.paymentService.getUserPayments(user.id, filters);
  }

  @Get('analytics')
  @ApiOperation({
    summary: 'Get payment analytics (Admin only)',
    description: 'Get comprehensive payment analytics and metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Analytics retrieved successfully',
    type: PaymentAnalyticsDto,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Analytics start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Analytics end date',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getPaymentAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaymentAnalyticsDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.paymentService.getPaymentAnalytics(start, end);
  }

  @Get('coach-earnings/:coachId')
  @ApiOperation({
    summary: 'Get coach earnings (Coach/Admin only)',
    description: 'Get payment earnings for a specific coach',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coach earnings retrieved successfully',
    type: PaymentListResponseDto,
  })
  @ApiParam({ name: 'coachId', description: 'Coach ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: Date,
    description: 'Filter from date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: Date,
    description: 'Filter to date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getCoachEarnings(
    @CurrentUser() user: any,
    @Param('coachId') coachId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaymentListResponseDto> {
    // Coaches can only view their own earnings, admins can view any
    if (user.role === UserRole.COACH && user.id !== coachId) {
      throw new UnauthorizedException('Cannot access other coach earnings');
    }

    const filters: any = {
      page,
      limit,
    };

    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    // Get payments where this coach receives revenue
    const queryBuilder = this.paymentService['paymentRepository']
      .createQueryBuilder('payment')
      .where('payment.coachId = :coachId', { coachId })
      .andWhere('payment.status = :status', {
        status: PaymentStatus.COMPLETED,
      });

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'payment.completedAt BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    const totalCount = await queryBuilder.getCount();
    const page_num = filters.page || 1;
    const limit_num = filters.limit || 20;
    const offset = (page_num - 1) * limit_num;

    queryBuilder
      .orderBy('payment.completedAt', 'DESC')
      .skip(offset)
      .take(limit_num);

    const payments = await queryBuilder.getMany();

    const paymentDtos = payments.map((payment) =>
      this.paymentService['transformPaymentToDto'](payment),
    );

    const totalPages = Math.ceil(totalCount / limit_num);

    return {
      payments: paymentDtos,
      total: totalCount,
      page: page_num,
      limit: limit_num,
      totalPages,
      hasNext: page_num < totalPages,
      hasPrevious: page_num > 1,
    };
  }

  @Get('revenue-summary')
  @ApiOperation({
    summary: 'Get revenue summary (Admin only)',
    description: 'Get revenue breakdown by payment method, product type, etc.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Revenue summary retrieved successfully',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['today', 'week', 'month', 'quarter', 'year'],
    description: 'Time period',
  })
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueSummary(
    @Query('period')
    period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month',
  ): Promise<{
    totalRevenue: number;
    revenueByMethod: Record<string, number>;
    revenueByType: Record<string, number>;
    transactionCount: number;
    averageTransactionValue: number;
    period: string;
  }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(
          now.getFullYear(),
          Math.floor(now.getMonth() / 3) * 3,
          1,
        );
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const analytics = await this.paymentService.getPaymentAnalytics(
      startDate,
      now,
    );

    return {
      totalRevenue: analytics.totalRevenue,
      revenueByMethod: analytics.revenueByPaymentMethod,
      revenueByType: {}, // Would be calculated from payment types
      transactionCount: analytics.totalPayments,
      averageTransactionValue: analytics.averageTransactionValue,
      period,
    };
  }

  @Get(':paymentId')
  @ApiOperation({
    summary: 'Get payment details',
    description: 'Get detailed information about a specific payment',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async getPayment(
    @CurrentUser() user: any,
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService['paymentRepository'].findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Users can only view their own payments, admins can view any
    if (user.role !== UserRole.ADMIN && payment.userId !== user.id) {
      throw new UnauthorizedException('Cannot access this payment');
    }

    return this.paymentService['transformPaymentToDto'](payment);
  }

  @Put(':paymentId/cancel')
  @ApiOperation({
    summary: 'Cancel a pending payment',
    description: 'Cancel a payment that is still pending',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment cancelled successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment cannot be cancelled',
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async cancelPayment(
    @CurrentUser() user: any,
    @Param('paymentId') paymentId: string,
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentService['paymentRepository'].findOne({
      where: { id: paymentId, userId: user.id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be cancelled');
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.failureReason = 'Cancelled by user';

    const savedPayment =
      await this.paymentService['paymentRepository'].save(payment);

    return this.paymentService['transformPaymentToDto'](savedPayment);
  }
}
