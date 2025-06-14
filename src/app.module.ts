import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CoachModule } from './coach/coach.module';
import { ClientModule } from './client/client.module';
import { CommonModule } from './common/common.module';
import { JwtAuthGuardGlobal } from './auth/guards/jwt-auth-global.guard';
import { FeatureModule } from './feature/feature.module';
import { TargetAudienceModule } from './target-audience/target-audience.module';
import { DiscountModule } from './discount/discount.module';
import { MealModule } from './meal/meal.module';
import { WorkoutModule } from './workout/workout.module';
import { TemplateModule } from './template/template.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notifications/notification.module';
import { SubscribedTraineesModule } from './subscribed-trainees/subscribed-trainees.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CommonModule,
    AuthModule,
    UserModule,
    CoachModule,
    ClientModule,
    FeatureModule,
    TargetAudienceModule,
    DiscountModule,
    MealModule,
    WorkoutModule,
    TemplateModule,
    DashboardModule,
    NotificationModule,
    SubscribedTraineesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuardGlobal,
    },
  ],
})
export class AppModule {}
