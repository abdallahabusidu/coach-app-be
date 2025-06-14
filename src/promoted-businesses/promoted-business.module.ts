import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { PromotedBusinessEntity } from './entities/promoted-business.entity';
import { BusinessUserInteractionEntity } from './entities/business-user-interaction.entity';
import { UserEntity } from '../auth/entities/user.entity';

// Services
import { PromotedBusinessService } from './services/promoted-business.service';

// Controllers
import { PromotedBusinessController } from './controllers/promoted-business.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PromotedBusinessEntity,
      BusinessUserInteractionEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(), // For scheduled tasks like contract expiry checks
  ],
  providers: [PromotedBusinessService],
  controllers: [PromotedBusinessController],
  exports: [PromotedBusinessService],
})
export class PromotedBusinessModule {}
