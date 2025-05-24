import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get('JWT_ACCESS_SECRET') ||
        configService.get('JWT_SECRET') ||
        'access-secret-key',
    });
  }

  async validate(payload: any) {
    try {
      // Ensure this is an access token, not a refresh token
      if (payload.type !== 'access_token') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Validate the user exists and is active
      const user = await this.authService.validateUser(payload.sub);

      // Return user data for request
      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
