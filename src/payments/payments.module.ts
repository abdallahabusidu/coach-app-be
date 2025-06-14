import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { PaymentEntity } from './entities/payment.entity';
import { SubscriptionEntity } from './entities/subscription.entity';
import { ProductEntity } from './entities/product.entity';
import { CoachSubscriptionEntity } from './entities/coach-subscription.entity';
import { ClientSubscriptionEntity } from './entities/client-subscription.entity';
import { UserEntity } from '../auth/entities/user.entity';

// Services
import { PaymentService } from './services/payment.service';
import { SubscriptionService } from './services/subscription.service';
import { ProductService } from './services/product.service';
import { CoachSubscriptionService } from './services/coach-subscription.service';
import { ClientSubscriptionService } from './services/client-subscription.service';

// Controllers
import { PaymentController } from './controllers/payment.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { ProductController } from './controllers/product.controller';
import { CoachSubscriptionController } from './controllers/coach-subscription.controller';
import { ClientSubscriptionController } from './controllers/client-subscription.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentEntity,
      SubscriptionEntity,
      ProductEntity,
      CoachSubscriptionEntity,
      ClientSubscriptionEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(), // For subscription cron jobs
  ],
  providers: [
    PaymentService,
    SubscriptionService,
    ProductService,
    CoachSubscriptionService,
    ClientSubscriptionService,
  ],
  controllers: [
    PaymentController,
    SubscriptionController,
    ProductController,
    CoachSubscriptionController,
    ClientSubscriptionController,
  ],
  exports: [
    PaymentService,
    SubscriptionService,
    ProductService,
    CoachSubscriptionService,
    ClientSubscriptionService,
  ],
})
export class PaymentsModule {}
