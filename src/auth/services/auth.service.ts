import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from '../dtos/login.dto';
import { RegisterDto } from '../dtos/register.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user exists with email or phone
    const existingUser = await this.userRepository.findOne({
      where: [{ email: registerDto.email }, { phone: registerDto.phone }],
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    // Create new user
    const user = this.userRepository.create(registerDto);

    // Save user
    await this.userRepository.save(user);

    // Generate auth response with tokens
    return await this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Generate auth response with tokens
    return await this.generateAuthResponse(user);
  }

  async findUserById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async validateUser(userId: string): Promise<UserEntity> {
    const user = await this.findUserById(userId);

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }

  async validateUserPassword(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }

  generateAccessToken(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access_token',
    };

    return this.jwtService.sign(payload);
  }

  async generateRefreshToken(user: UserEntity): Promise<string> {
    const payload = {
      sub: user.id,
      type: 'refresh_token',
    };

    // Create refresh token with longer expiration
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    // Store the refresh token and its expiration in the database
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // Default 7 days

    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await this.userRepository.save(user);

    return refreshToken;
  }

  async generateAuthResponse(user: UserEntity): Promise<{
    user: Partial<UserEntity>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Create a safe user response object without sensitive data
    const { password, refreshToken: userRefreshToken, ...userResponse } = user;

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });

      if (payload.type !== 'refresh_token') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Find the user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpires < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      } // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
