import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateController } from './controllers/template.controller';
import { TemplateService } from './services/template.service';
import { TemplateEntity } from './entities/template.entity';
import { TemplateAssignmentEntity } from './entities/template-assignment.entity';
import { TemplateRecommendationEntity } from './entities/template-recommendation.entity';
import { AuthModule } from '../auth/auth.module';
import { WorkoutEntity } from '../workout/entities/workout.entity';
import { MealEntity } from '../meal/entities/meal.entity';
import { UserEntity } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TemplateEntity,
      TemplateAssignmentEntity,
      TemplateRecommendationEntity,
      UserEntity,
      WorkoutEntity,
      MealEntity,
    ]),
    AuthModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
