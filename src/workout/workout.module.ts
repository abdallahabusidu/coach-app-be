import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './services/workout.service';
import { WorkoutController } from './controllers/workout.controller';
import { WorkoutEntity } from './entities/workout.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkoutEntity]),
    AuthModule, // Import AuthModule for guards and decorators
    CommonModule, // Import CommonModule for FileUploadService
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService], // Export service for potential use in other modules
})
export class WorkoutModule {}
