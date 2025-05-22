import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum ClientGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export class OnboardingStep1ProfileDto {
  @ApiProperty({
    enum: ClientGender,
    description: 'Gender of the client',
    example: ClientGender.MALE,
  })
  @IsEnum(ClientGender)
  gender: ClientGender;

  @ApiProperty({
    description: 'Location of the client (city, state/country)',
    example: 'Riyadh, Saudi Arabia',
  })
  @IsString()
  location: string;

  @ApiProperty({
    minimum: 10,
    maximum: 120,
    description: 'Age of the client',
    example: 28,
  })
  @IsNumber()
  @Min(10)
  @Max(120)
  age: number;

  @ApiProperty({
    minimum: 20,
    maximum: 300,
    description: 'Weight of the client in kilograms',
    example: 75,
  })
  @IsNumber()
  @Min(20)
  @Max(300)
  weight: number;

  @ApiProperty({
    minimum: 50,
    maximum: 250,
    description: 'Height of the client in centimeters',
    example: 175,
  })
  @IsNumber()
  @Min(50)
  @Max(250)
  height: number;

  @ApiProperty({
    description: 'Primary fitness goal of the client',
    example: 'Lose weight',
  })
  @IsString()
  fitnessGoal: string;
}
