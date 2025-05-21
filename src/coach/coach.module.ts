import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoachController } from './controllers/coach.controller';
import { CoachService } from './services/coach.service';
import { UserEntity } from '../auth/entities/user.entity';
import { CoachProfileEntity } from './entities/coach-profile.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, CoachProfileEntity]),
    AuthModule,
    UserModule,
  ],
  controllers: [CoachController],
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}
