import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscribedTraineesController } from './controllers/subscribed-trainees.controller';
import { TraineeProfileController } from './controllers/trainee-profile.controller';
import { SubscriptionRequestController } from './controllers/subscription-request.controller';
import { CoachDiscoveryController } from './controllers/coach-discovery.controller';
import { SubscribedTraineesService } from './services/subscribed-trainees.service';
import { TraineeProfileService } from './services/trainee-profile.service';
import { SubscriptionRequestService } from './services/subscription-request.service';
import { MessagePermissionService } from '../messages/services/message-permission.service';
import { UserEntity } from '../auth/entities/user.entity';
import { ClientProfileEntity as TraineeProfileEntity } from '../client/entities/client-profile.entity';
import { TraineeProgressEntity } from '../dashboard/entities/trainee-progress.entity';
import { PackageEntity } from '../coach/entities/package.entity';
import { CoachProfileEntity } from '../coach/entities/coach-profile.entity';
import { SubscriptionRequestEntity } from './entities/subscription-request.entity';
import { CsvImportService } from './services/csv-import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      TraineeProfileEntity,
      TraineeProgressEntity,
      PackageEntity,
      CoachProfileEntity,
      SubscriptionRequestEntity,
    ]),
  ],
  controllers: [
    SubscribedTraineesController,
    TraineeProfileController,
    SubscriptionRequestController,
    CoachDiscoveryController,
  ],
  providers: [
    SubscribedTraineesService,
    TraineeProfileService,
    SubscriptionRequestService,
    MessagePermissionService,
    CsvImportService,
  ],
  exports: [
    SubscribedTraineesService,
    TraineeProfileService,
    SubscriptionRequestService,
    MessagePermissionService,
    CsvImportService,
  ],
})
export class SubscribedTraineesModule {}
