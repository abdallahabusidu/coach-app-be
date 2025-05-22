import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthResponseDto, TokenResponseDto } from '../dtos/auth-response.dto';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { RegisterDto } from '../dtos/register.dto';
import { UserEntity } from '../entities/user.entity'; // Corrected import path and name
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = new UserEntity();
  mockUser.id = '1';
  mockUser.email = 'test@example.com';

  const mockAuthResponseDto: AuthResponseDto = {
    user: mockUser,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  const mockTokenResponseDto: TokenResponseDto = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue(mockAuthResponseDto),
            login: jest.fn().mockResolvedValue(mockAuthResponseDto),
            generateAuthResponse: jest
              .fn()
              .mockResolvedValue(mockAuthResponseDto),
            refreshTokens: jest.fn().mockResolvedValue(mockTokenResponseDto),
          },
        },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser; // Attach mock user to request for guard
          return true;
        },
      })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return auth response', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890', // Added phone field
      };
      expect(await controller.register(registerDto)).toEqual(
        mockAuthResponseDto,
      );
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should login a user and return auth response', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password',
      };
      expect(await controller.login(loginDto)).toEqual(mockAuthResponseDto);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('loginWithGuard', () => {
    it('should login a user using guard and return auth response', async () => {
      const mockReq = { user: mockUser };
      expect(await controller.loginWithGuard(mockReq)).toEqual(
        mockAuthResponseDto,
      );
      expect(authService.generateAuthResponse).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens and return new token response', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refresh-token',
      };
      expect(await controller.refreshToken(refreshTokenDto)).toEqual(
        mockTokenResponseDto,
      );
      expect(authService.refreshTokens).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
    });
  });
});
