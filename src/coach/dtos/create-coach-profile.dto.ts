import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCoachProfileDto {
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

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableDays?: string[];

  @IsOptional()
  availableHours?: any;
}
