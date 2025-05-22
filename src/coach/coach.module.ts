import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachController } from './controllers/coach.controller';
import { CoachService } from './services/coach.service';
import { UserEntity } from '../auth/entities/user.entity';
import { CoachProfileEntity } from './entities/coach-profile.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CommonModule } from '../common/common.module';
import { PackageEntity } from './entities/package.entity';
import { PackageService } from './services/package.service';
import { PackageController } from './controllers/package.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CoachProfileEntity, PackageEntity]),
    AuthModule,
    UserModule,
    CommonModule,
  ],
  controllers: [CoachController, PackageController],
  providers: [CoachService, PackageService],
  exports: [CoachService],
})
export class CoachModule {}
