import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './services/workout.service';
import { WorkoutPlanService } from './services/workout-plan.service';
import { WorkoutSessionService } from './services/workout-session.service';
import { WorkoutController } from './controllers/workout.controller';
import { WorkoutPlanController } from './controllers/workout-plan.controller';
import { WorkoutSessionController } from './controllers/workout-session.controller';
import { WorkoutEntity } from './entities/workout.entity';
import { WorkoutPlanEntity } from './entities/workout-plan.entity';
import { WorkoutSessionEntity } from './entities/workout-session.entity';
import { WorkoutAssignmentEntity } from './entities/workout-assignment.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkoutEntity,
      WorkoutPlanEntity,
      WorkoutSessionEntity,
      WorkoutAssignmentEntity,
      UserEntity,
    ]),
    AuthModule, // Import AuthModule for guards and decorators
    CommonModule, // Import CommonModule for FileUploadService
  ],
  controllers: [
    WorkoutController,
    WorkoutPlanController,
    WorkoutSessionController,
  ],
  providers: [WorkoutService, WorkoutPlanService, WorkoutSessionService],
  exports: [WorkoutService, WorkoutPlanService, WorkoutSessionService], // Export services for potential use in other modules
})
export class WorkoutModule {}
