import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { Gender } from '../../entities/coach-profile.entity';

export class PersonalInfoDto {
  @ApiProperty({
    description: 'Gender of the coach',
    enum: Gender,
    example: Gender.MALE,
    required: true,
  })
  @IsEnum(Gender)
  @IsNotEmpty()
  gender: string;

  @ApiProperty({
    description: 'Age of the coach',
    example: 30,
    minimum: 18,
    maximum: 100,
    required: true,
  })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsNotEmpty()
  age: number;

  @ApiProperty({
    description: 'Location of the coach (city, state/province, country)',
    example: 'New York, NY, USA',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    description: 'Years of experience as a coach',
    example: 5,
    minimum: 0,
    maximum: 100,
    required: true,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  yearsOfExperience: number;

  @ApiProperty({
    description: 'Primary specialization area',
    example: 'Weight loss and nutrition coaching for beginners',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  specialization: string;

  @ApiProperty({
    description: 'Hourly rate charged by the coach (in USD)',
    example: 50,
    minimum: 0,
    required: true,
  })
  @IsNumber()
  @Min(0)
  hourlyRate: number;
}
