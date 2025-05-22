import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity, UserRole } from '../entities/user.entity';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

// Mock UserEntity methods
const mockUserEntity = {
  validatePassword: jest.fn(),
  save: jest.fn(),
};

// Mock Repository
const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          execute: jest.fn(),
        })),
      })),
    })),
  })),
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<UserEntity>;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks(); // Add this line

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '1234567890',
      role: UserRole.CLIENT,
    };

    it('should register a new user and return tokens', async () => {
      const savedUser = {
        ...registerDto,
        id: 'uuid',
        ...mockUserEntity,
        // Ensure all properties expected by generateAuthResponse are present
        password: 'hashedPassword', // Add this if freshUser needs it
        refreshToken: null, // Add this
        refreshTokenExpires: null, // Add this
        isActive: true, // Add this
        role: UserRole.CLIENT, // Add this
      };
      mockUserRepository.findOne
        .mockResolvedValueOnce(null) // For the initial check in register
        .mockResolvedValueOnce(savedUser); // For the findOne in generateAuthResponse

      mockUserRepository.create.mockReturnValue({
        ...registerDto,
        ...mockUserEntity,
      });
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockJwtService.sign.mockReturnValue('mockToken');

      const result = await service.register(registerDto);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [{ email: registerDto.email }, { phone: registerDto.phone }],
      });
      expect(mockUserRepository.create).toHaveBeenCalledWith(registerDto);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...registerDto,
        ...mockUserEntity,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2); // accessToken and refreshToken
      // Check findOne call within generateAuthResponse
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { id: savedUser.id },
      });
      expect(result.user.email).toEqual(registerDto.email);
      expect(result.accessToken).toEqual('mockToken');
      expect(result.refreshToken).toEqual('mockToken');
    });

    it('should throw ConflictException if user already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 'uuid',
        ...registerDto,
      });
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const mockUser = {
      id: 'uuid',
      email: 'test@example.com',
      password: 'hashedPassword',
      isActive: true,
      ...mockUserEntity,
      // Ensure all properties expected by generateAuthResponse are present
      refreshToken: null,
      refreshTokenExpires: null,
      role: UserRole.CLIENT,
    };

    it('should login an existing user and return tokens', async () => {
      // mockJwtService.sign.mockClear(); // Moved to beforeEach with jest.clearAllMocks()
      mockUserRepository.findOne.mockResolvedValue(mockUser); // For login and generateAuthResponse
      mockUser.validatePassword.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mockToken');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        // This will be called twice now
        where: { email: loginDto.email },
      });
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.user.email).toEqual(loginDto.email);
      expect(result.accessToken).toEqual('mockToken');
      expect(result.refreshToken).toEqual('mockToken');
    });

    it('should throw UnauthorizedException for invalid credentials (user not found)', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid credentials (wrong password)', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      mockUser.validatePassword.mockResolvedValue(true);
      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findUserById', () => {
    it('should return a user if found', async () => {
      const userId = 'uuid';
      const mockUser = { id: userId, email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.findUserById(userId);
      expect(result).toEqual(mockUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.findUserById('uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if active', async () => {
      const userId = 'uuid';
      const mockActiveUser = {
        id: userId,
        isActive: true,
        email: 'test@example.com',
      };
      mockUserRepository.findOne.mockResolvedValue(mockActiveUser); // Mock findUserById behavior
      const result = await service.validateUser(userId);
      expect(result).toEqual(mockActiveUser);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const userId = 'uuid';
      const mockInactiveUser = {
        id: userId,
        isActive: false,
        email: 'test@example.com',
      };
      mockUserRepository.findOne.mockResolvedValue(mockInactiveUser); // Mock findUserById behavior
      await expect(service.validateUser(userId)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUserPassword', () => {
    const email = 'test@example.com';
    const password = 'password123';
    const mockUser = {
      id: 'uuid',
      email,
      password: 'hashedPassword',
      isActive: true,
      ...mockUserEntity,
    };

    it('should return user if password is valid and user is active', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(true);
      const result = await service.validateUserPassword(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.validateUserPassword(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is not valid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUser.validatePassword.mockResolvedValue(false);
      await expect(
        service.validateUserPassword(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      mockUser.validatePassword.mockResolvedValue(true);
      await expect(
        service.validateUserPassword(email, password),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', () => {
      const mockUser = {
        id: 'uuid',
        email: 'test@example.com',
        role: 'client',
      } as UserEntity;
      mockJwtService.sign.mockReturnValue('accessToken');
      const token = service.generateAccessToken(mockUser);
      expect(token).toEqual('accessToken');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        type: 'access_token',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate and store a refresh token', async () => {
      const mockUser = { id: 'uuid', email: 'test@example.com' } as UserEntity;
      mockJwtService.sign.mockReturnValue('refreshToken');
      const token = await service.generateRefreshToken(mockUser);
      expect(token).toEqual('refreshToken');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, type: 'refresh_token' },
        {
          secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
          expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
        },
      );
      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('generateAuthResponse', () => {
    it('should generate access and refresh tokens and return user data', async () => {
      const mockUser = {
        id: 'uuid',
        email: 'test@example.com',
        password: 'hashedPassword',
        refreshToken: 'oldToken',
        refreshTokenExpires: new Date(),
        isActive: true,
        role: UserRole.CLIENT,
        // Add any other UserEntity properties that are not methods
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890',
        isEmailVerified: false,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        isPhoneVerified: false,
        phoneVerificationCode: null,
        phoneVerificationExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Mock the methods if they are called or accessed
        validatePassword: jest.fn(),
        save: jest.fn(),
        hasId: jest.fn(),
        recover: jest.fn(),
        reload: jest.fn(),
        hashPassword: jest.fn().mockResolvedValue(undefined), // Added missing method
        hashPasswordIfChanged: jest.fn().mockResolvedValue(undefined), // Added missing method
      } as UserEntity; // Cast to UserEntity to satisfy type, but ensure all props are there

      const freshUser = { ...mockUser, refreshToken: 'newToken' };

      // Mock generateAccessToken
      jest
        .spyOn(service, 'generateAccessToken')
        .mockReturnValue('newAccessToken');
      // Mock generateRefreshToken
      jest
        .spyOn(service, 'generateRefreshToken')
        .mockResolvedValue('newRefreshToken');

      // Ensure the findOne call inside generateAuthResponse is mocked
      mockUserRepository.findOne.mockResolvedValue(freshUser);

      const response = await service.generateAuthResponse(mockUser);

      expect(response.accessToken).toEqual('newAccessToken');
      expect(response.refreshToken).toEqual('newRefreshToken');
      expect(response.user).toEqual(
        expect.not.objectContaining({
          password: 'hashedPassword',
          refreshToken: 'newToken',
        }),
      );
      expect(response.user.email).toEqual(mockUser.email);
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'validRefreshToken';
    const decodedPayload = { sub: 'uuid', type: 'refresh_token' };
    const mockUser = {
      id: 'uuid',
      email: 'test@example.com',
      refreshToken: refreshToken,
      refreshTokenExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // Expires in 1 day
      isActive: true,
    } as UserEntity;

    it('should refresh tokens successfully', async () => {
      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      jest
        .spyOn(service, 'generateAccessToken')
        .mockReturnValue('newAccessToken');
      jest
        .spyOn(service, 'generateRefreshToken')
        .mockResolvedValue('newRefreshToken');

      const result = await service.refreshTokens(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: decodedPayload.sub },
      });
      expect(service.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(service.generateRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(result.accessToken).toEqual('newAccessToken');
      expect(result.refreshToken).toEqual('newRefreshToken');
    });

    it('should throw UnauthorizedException for invalid token type', async () => {
      mockJwtService.verify.mockReturnValue({
        ...decodedPayload,
        type: 'access_token',
      });
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if stored token does not match', async () => {
      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        refreshToken: 'anotherToken',
      });
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      mockJwtService.verify.mockReturnValue(decodedPayload);
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        refreshTokenExpires: new Date(Date.now() - 10000),
      }); // Expired
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Refresh token expired'),
      );
    });

    it('should throw UnauthorizedException if jwtService.verify throws an error', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Verification failed');
      });
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid refresh token'),
      );
    });
  });
});
