import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FitnessArea, Gender } from '../entities/coach-profile.entity';

class CertificateDto {
  @ApiProperty({
    description: 'Name of the certification',
    example: 'NASM Certified Personal Trainer',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization that issued the certification',
    example: 'National Academy of Sports Medicine',
  })
  @IsString()
  issuer: string;

  @ApiProperty({
    description: 'Year the certification was obtained',
    example: 2020,
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    description: 'URL to the certification (optional)',
    example: 'https://example.com/certification.pdf',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  url?: string;
}

export class UpdateCoachProfileDto {
  @ApiProperty({
    description: 'Coach biography',
    example: 'Certified personal trainer with over 5 years of experience...',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: 'Coach specialization',
    example: 'Weight loss and strength training',
    required: false,
  })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({
    description: 'Years of experience as a coach',
    example: 5,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  yearsOfExperience?: number;

  @ApiProperty({
    description: 'Certifications as string (deprecated)',
    example: 'NASM CPT, ACE Group Fitness',
    required: false,
  })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiProperty({
    description: 'List of certifications',
    type: [CertificateDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CertificateDto)
  certificates?: CertificateDto[];

  @ApiProperty({
    description: 'Hourly rate charged by the coach',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({
    description: 'URL to profile picture',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiProperty({
    description: 'Gender of the coach',
    enum: Gender,
    example: Gender.MALE,
    required: false,
  })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    description: 'Age of the coach',
    example: 30,
    minimum: 18,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsOptional()
  age?: number;

  @ApiProperty({
    description: 'Location of the coach',
    example: 'New York, NY, USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Fitness areas the coach specializes in',
    enum: FitnessArea,
    isArray: true,
    example: [FitnessArea.WEIGHT_LOSS, FitnessArea.STRENGTH_TRAINING],
    required: false,
  })
  @IsArray()
  @IsEnum(FitnessArea, { each: true })
  @IsOptional()
  fitnessAreas?: FitnessArea[];

  @ApiProperty({
    description: 'Days the coach is available',
    example: ['Monday', 'Wednesday', 'Friday'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @ApiProperty({
    description: 'Available hours per day',
    example: {
      Monday: [{ start: '09:00', end: '17:00' }],
    },
    required: false,
  })
  @IsOptional()
  availableHours?: any;

  @ApiProperty({
    description: 'Whether the coach is verified',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({
    description: 'Whether the coach has completed onboarding',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  onboardingCompleted?: boolean;
}
