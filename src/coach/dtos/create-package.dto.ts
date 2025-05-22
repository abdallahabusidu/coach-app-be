import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { SkillLevel } from '../entities/package.entity';

export class CreatePackageDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Country code for price localization',
    example: 'US',
  })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Price in local currency' })
  @IsNumber()
  price: number;

  @ApiProperty({ isArray: true })
  @IsArray()
  @IsString({ each: true })
  fitnessAreas: string[];

  @ApiProperty({ description: 'Duration in days' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sessionsNumber?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sessionPeriod?: number;

  @ApiProperty({ enum: SkillLevel, required: false })
  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetAudienceId?: string;

  @ApiProperty({ required: false, type: 'string', format: 'binary' })
  @IsOptional()
  image?: any;

  @ApiProperty({ default: false })
  @IsBoolean()
  limitedAvailability: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  discountOptionId?: string;
}
