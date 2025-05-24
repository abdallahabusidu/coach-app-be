import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealService } from './services/meal.service';
import { MealController } from './controllers/meal.controller';
import { MealEntity } from './entities/meal.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MealEntity]),
    AuthModule, // Import AuthModule for guards and decorators
  ],
  controllers: [MealController],
  providers: [MealService],
  exports: [MealService], // Export service for potential use in other modules
})
export class MealModule {}
