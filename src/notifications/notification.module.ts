import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationService } from './services/notification.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { NotificationController } from './controllers/notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationTemplateService],
  exports: [NotificationService, NotificationTemplateService],
})
export class NotificationModule {}
