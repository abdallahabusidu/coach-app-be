import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UserEntity } from './entities/user.entity';
import { AuthController } from './controllers/auth.controller';
import { VerificationController } from './controllers/verification.controller';
import { AuthService } from './services/auth.service';
import { VerificationService } from './services/verification.service';
import { PendingRegistrationService } from './services/pending-registration.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { LocalStrategy } from './strategies/local.strategy';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    CommonModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get('JWT_ACCESS_SECRET') ||
          configService.get('JWT_SECRET') ||
          'access-secret-key',
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION') || '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController, VerificationController],
  providers: [
    AuthService,
    VerificationService,
    PendingRegistrationService,
    JwtStrategy,
    LocalStrategy,
    RolesGuard,
  ],
  exports: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    PassportModule,
    RolesGuard,
    JwtModule,
  ],
})
export class AuthModule {}
