import {
  IsArray,
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

export class CreateCoachProfileDto {
  @ApiProperty({
    description: 'Coach biography',
    example: 'Certified personal trainer with over 5 years of experience...',
  })
  @IsString()
  bio: string;

  @ApiProperty({
    description: 'Coach specialization',
    example: 'Weight loss and strength training',
  })
  @IsString()
  specialization: string;

  @ApiProperty({
    description: 'Years of experience as a coach',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  yearsOfExperience: number;

  @ApiProperty({
    description: 'List of certifications',
    type: [CertificateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateDto)
  certificates: CertificateDto[];

  @ApiProperty({
    description: 'Hourly rate charged by the coach',
    example: 50,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiProperty({
    description: 'URL to profile picture',
    example: 'https://example.com/profile.jpg',
  })
  @IsUrl()
  profilePictureUrl: string;

  @ApiProperty({
    description: 'Gender of the coach',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Age of the coach',
    example: 30,
    minimum: 18,
    maximum: 100,
  })
  @IsInt()
  @Min(18)
  @Max(100)
  age: number;

  @ApiProperty({
    description: 'Location of the coach',
    example: 'New York, NY, USA',
  })
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Fitness areas the coach specializes in',
    enum: FitnessArea,
    isArray: true,
    example: [FitnessArea.WEIGHT_LOSS, FitnessArea.STRENGTH_TRAINING],
  })
  @IsArray()
  @IsEnum(FitnessArea, { each: true })
  fitnessAreas: FitnessArea[];

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
}
