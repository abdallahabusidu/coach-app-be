import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardController } from './controllers/dashboard.controller';
import { DailyQuoteService } from './services/daily-quote.service';
import { DashboardStatsService } from './services/dashboard-stats.service';
import { QuoteEntity } from './entities/quote.entity';
import { TraineeProgressEntity } from './entities/trainee-progress.entity';
import { MessageEntity } from './entities/message.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CoachModule } from '../coach/coach.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QuoteEntity,
      TraineeProgressEntity,
      MessageEntity,
      UserEntity,
    ]),
    ScheduleModule.forRoot(), // Enable scheduled tasks for daily quote refresh
    AuthModule, // Import AuthModule for guards and decorators
    CoachModule, // Import CoachModule for CoachService
  ],
  controllers: [DashboardController],
  providers: [DailyQuoteService, DashboardStatsService],
  exports: [DailyQuoteService, DashboardStatsService], // Export services for potential use in other modules
})
export class DashboardModule {}
