import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribedTraineesController } from './controllers/subscribed-trainees.controller';
import { SubscribedTraineesService } from './services/subscribed-trainees.service';
import { UserEntity } from '../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../client/entities/client-profile.entity';
import { TraineeProgressEntity } from '../dashboard/entities/trainee-progress.entity';
import { PackageEntity } from '../coach/entities/package.entity';
import { CoachProfileEntity } from '../coach/entities/coach-profile.entity';
import { CsvImportService } from './services/csv-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TraineeProfileEntity,
      TraineeProgressEntity,
      PackageEntity,
      CoachProfileEntity,
    ]),
  ],
  controllers: [SubscribedTraineesController],
  providers: [SubscribedTraineesService, CsvImportService],
  exports: [SubscribedTraineesService, CsvImportService],
})
export class SubscribedTraineesModule {}
