import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealService } from './services/meal.service';
import { MealPlanService } from './services/meal-plan.service';
import { NutritionLogService } from './services/nutrition-log.service';
import { MealController } from './controllers/meal.controller';
import { MealPlanController } from './controllers/meal-plan.controller';
import { NutritionLogController } from './controllers/nutrition-log.controller';
import { MealEntity } from './entities/meal.entity';
import { MealPlanEntity } from './entities/meal-plan.entity';
import { NutritionLogEntity } from './entities/nutrition-log.entity';
import { MealAssignmentEntity } from './entities/meal-assignment.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MealEntity,
      MealPlanEntity,
      NutritionLogEntity,
      MealAssignmentEntity,
      UserEntity,
    ]),
    AuthModule, // Import AuthModule for guards and decorators
  ],
  controllers: [
    MealController,
    MealPlanController,
    NutritionLogController,
  ],
  providers: [
    MealService,
    MealPlanService,
    NutritionLogService,
  ],
  exports: [
    MealService,
    MealPlanService,
    NutritionLogService,
  ], // Export services for potential use in other modules
})
export class MealModule {}
