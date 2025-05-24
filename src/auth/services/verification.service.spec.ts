import {
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../../common/services/email.service';
import { SmsService } from '../../common/services/sms.service';
import {
  RequestEmailVerificationDto,
  VerifyEmailDto,
} from '../dtos/verify-email.dto';
import {
  RequestPhoneVerificationDto,
  VerifyPhoneDto,
} from '../dtos/verify-phone.dto';
import { UserEntity } from '../entities/user.entity';
import { VerificationService } from './verification.service';

// Mock UserEntity
const mockUserEntity = {
  id: 'user-uuid',
  email: 'test@example.com',
  phone: '1234567890',
  firstName: 'Test',
  isEmailVerified: false,
  isPhoneVerified: false,
  emailVerificationToken: null,
  emailVerificationExpires: null,
  phoneVerificationCode: null,
  phoneVerificationExpires: null,
  save: jest.fn(),
};

// Mock Repository
const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

// Mock EmailService
const mockEmailService = {
  sendVerificationEmail: jest.fn(),
};

// Mock SmsService
const mockSmsService = {
  sendVerificationSms: jest.fn(),
};

// Mock Logger
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

describe('VerificationService', () => {
  let service: VerificationService;
  let userRepository: Repository<UserEntity>;
  let emailService: EmailService;
  let smsService: SmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: Logger, // Provide the actual Logger
          useClass: Logger, // Or useValue: mockLogger if you want to mock Logger methods
        },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    emailService = module.get<EmailService>(EmailService);
    smsService = module.get<SmsService>(SmsService);
    // jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);
    // jest.spyOn(Logger.prototype, 'error').mockImplementation(mockLogger.error);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmailVerificationToken', () => {
    it('should generate and save an email verification token', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserEntity,
        emailVerificationToken: 'generated-token',
      });

      const token = await service.generateEmailVerificationToken('user-uuid');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(token).toHaveLength(6); // Assuming 6-letter token
      expect(mockUserEntity.emailVerificationToken).toEqual(token);
      expect(mockUserEntity.emailVerificationExpires).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.generateEmailVerificationToken('user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestEmailVerification', () => {
    const dto: RequestEmailVerificationDto = { email: 'test@example.com' };

    it('should send an email verification link if user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      jest
        .spyOn(service, 'generateEmailVerificationToken')
        .mockResolvedValue('mock-token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.requestEmailVerification(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(service.generateEmailVerificationToken).toHaveBeenCalledWith(
        mockUserEntity.id,
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        mockUserEntity.email,
        'mock-token',
        mockUserEntity.firstName,
      );
      expect(result.message).toContain('verification link has been sent');
    });

    it('should return a generic message if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.requestEmailVerification(dto);
      expect(result.message).toContain('verification link has been sent');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return a generic message and log error if email sending fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      jest
        .spyOn(service, 'generateEmailVerificationToken')
        .mockResolvedValue('mock-token');
      mockEmailService.sendVerificationEmail.mockRejectedValue(
        new Error('Email failed'),
      );
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.requestEmailVerification(dto);

      expect(result.message).toContain('verification link has been sent');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send verification email: Email failed',
      );
    });
  });

  describe('verifyEmail', () => {
    const dto: VerifyEmailDto = { token: 'valid-token' };
    const userWithToken = {
      ...mockUserEntity,
      emailVerificationToken: 'valid-token',
      emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60), // Expires in 1 hour
    };

    it('should verify email successfully with a valid token', async () => {
      mockUserRepository.findOne.mockResolvedValue(userWithToken);
      mockUserRepository.save.mockResolvedValue({
        ...userWithToken,
        isEmailVerified: true,
      });

      const result = await service.verifyEmail(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { emailVerificationToken: dto.token },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
        }),
      );
      expect(result.message).toEqual('Email verified successfully');
    });

    it('should throw UnauthorizedException for an invalid token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyEmail(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for an expired token', async () => {
      const expiredUser = {
        ...userWithToken,
        emailVerificationExpires: new Date(Date.now() - 10000),
      };
      mockUserRepository.findOne.mockResolvedValue(expiredUser);
      await expect(service.verifyEmail(dto)).rejects.toThrow(
        new UnauthorizedException('Verification token expired'),
      );
    });
  });

  describe('generatePhoneVerificationCode', () => {
    it('should generate and save a phone verification code', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      mockUserRepository.save.mockResolvedValue({
        ...mockUserEntity,
        phoneVerificationCode: '123456',
      });

      const code = await service.generatePhoneVerificationCode('user-uuid');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
      expect(userRepository.save).toHaveBeenCalled();
      expect(code).toHaveLength(6); // Assuming 6-letter code
      expect(mockUserEntity.phoneVerificationCode).toEqual(code);
      expect(mockUserEntity.phoneVerificationExpires).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.generatePhoneVerificationCode('user-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('requestPhoneVerification', () => {
    const dto: RequestPhoneVerificationDto = { phone: '1234567890' };

    it('should send an SMS verification code if user exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      jest
        .spyOn(service, 'generatePhoneVerificationCode')
        .mockResolvedValue('mock-code');
      mockSmsService.sendVerificationSms.mockResolvedValue(undefined);

      const result = await service.requestPhoneVerification(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { phone: dto.phone },
      });
      expect(service.generatePhoneVerificationCode).toHaveBeenCalledWith(
        mockUserEntity.id,
      );
      expect(smsService.sendVerificationSms).toHaveBeenCalledWith(
        mockUserEntity.phone,
        'mock-code',
      );
      expect(result.message).toContain('verification code has been sent');
    });

    it('should return a generic message if user does not exist', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const result = await service.requestPhoneVerification(dto);
      expect(result.message).toContain('verification code has been sent');
      expect(smsService.sendVerificationSms).not.toHaveBeenCalled();
    });

    it('should return a generic message and log error if SMS sending fails', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserEntity);
      jest
        .spyOn(service, 'generatePhoneVerificationCode')
        .mockResolvedValue('mock-code');
      mockSmsService.sendVerificationSms.mockRejectedValue(
        new Error('SMS failed'),
      );
      const loggerErrorSpy = jest.spyOn(service['logger'], 'error');

      const result = await service.requestPhoneVerification(dto);

      expect(result.message).toContain('verification code has been sent');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to send verification SMS: SMS failed',
      );
    });
  });

  describe('verifyPhone', () => {
    const dto: VerifyPhoneDto = { phone: '1234567890', code: 'valid-code' };
    const userWithCode = {
      ...mockUserEntity,
      phone: '1234567890',
      phoneVerificationCode: 'valid-code',
      phoneVerificationExpires: new Date(Date.now() + 1000 * 60 * 10), // Expires in 10 minutes
    };

    it('should verify phone successfully with a valid code', async () => {
      mockUserRepository.findOne.mockResolvedValue(userWithCode);
      mockUserRepository.save.mockResolvedValue({
        ...userWithCode,
        isPhoneVerified: true,
      });

      const result = await service.verifyPhone(dto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { phone: dto.phone, phoneVerificationCode: dto.code },
      });
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isPhoneVerified: true,
          phoneVerificationCode: null,
          phoneVerificationExpires: null,
        }),
      );
      expect(result.message).toEqual('Phone verified successfully');
    });

    it('should throw UnauthorizedException for an invalid code', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.verifyPhone(dto)).rejects.toThrow(
        new UnauthorizedException('Invalid verification code'),
      );
    });

    it('should throw UnauthorizedException for an expired code', async () => {
      const expiredUser = {
        ...userWithCode,
        phoneVerificationExpires: new Date(Date.now() - 10000),
      };
      mockUserRepository.findOne.mockResolvedValue(expiredUser);
      await expect(service.verifyPhone(dto)).rejects.toThrow(
        new UnauthorizedException('Verification code expired'),
      );
    });
  });

  describe('getVerificationStatus', () => {
    it('should return the email and phone verification status of a user', async () => {
      const userId = 'user-uuid';
      const userStatus = { isEmailVerified: true, isPhoneVerified: false };
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUserEntity,
        ...userStatus,
      });

      const result = await service.getVerificationStatus(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(userStatus);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(service.getVerificationStatus('user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
