import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      // Use the dedicated method for passport validation
      const user = await this.authService.validateUserPassword(email, password);

      // If validation passes, return the user (without password)
      delete user.password;
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
