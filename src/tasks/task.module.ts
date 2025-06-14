import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './entities/task.entity';
import { TaskSubmissionEntity } from './entities/task-submission.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { TaskService } from './services/task.service';
import { TaskController } from './controllers/task.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, TaskSubmissionEntity, UserEntity]),
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
