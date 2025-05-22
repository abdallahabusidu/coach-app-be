import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum FitnessLevel {
  ROOKIE = 'Rookie',
  WARRIOR = 'Warrior',
  LEGEND = 'Legend',
}

export class OnboardingStep2FitnessGoalsDto {
  @ApiProperty({
    description: 'Primary fitness goals',
    example: 'Lose weight, Build muscle',
  })
  @IsString()
  fitnessGoals: string;

  @ApiProperty({ description: 'If "Other", specify', required: false })
  @IsOptional()
  @IsString()
  otherGoal?: string;

  @ApiProperty({ enum: FitnessLevel })
  @IsEnum(FitnessLevel)
  fitnessLevel: FitnessLevel;

  @ApiProperty({
    description: 'Body shape description',
    example: 'Athletic, Slim, Curvy, etc.',
  })
  @IsString()
  bodyShape: string;
}
