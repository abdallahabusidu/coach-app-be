import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { PaymentEntity } from './entities/payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { ProductEntity } from './entities/product.entity';
import { UserEntity } from '../auth/entities/user.entity';

// Services
import { PaymentService } from './services/payment.service';
import { SubscriptionService } from './services/subscription.service';
import { ProductService } from './services/product.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { ProductController } from './controllers/product.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      SubscriptionEntity,
      ProductEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(), // For subscription cron jobs
  ],
  providers: [PaymentService, SubscriptionService, ProductService],
  controllers: [PaymentController, SubscriptionController, ProductController],
  exports: [PaymentService, SubscriptionService, ProductService],
})
export class PaymentsModule {}
