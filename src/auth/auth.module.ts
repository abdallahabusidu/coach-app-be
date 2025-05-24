import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { AuthController } from './controllers/auth.controller';
import { VerificationController } from './controllers/verification.controller';
import { UserEntity } from './entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './services/auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { PendingRegistrationService } from './services/pending-registration.service';
import { VerificationService } from './services/verification.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

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
    PasswordResetService,
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
