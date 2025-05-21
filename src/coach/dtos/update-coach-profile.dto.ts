import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateCoachProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  certifications?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hourlyRate?: number;

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @IsOptional()
  availableHours?: any;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
