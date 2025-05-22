import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class OnboardingStep3DietaryDto {
  @ApiProperty({ description: 'Meals per day', example: 3 })
  @IsNumber()
  mealsPerDay: number;

  @ApiProperty({ description: 'Follows specific diet plan', example: false })
  @IsBoolean()
  specificDiet: boolean;

  @ApiProperty({ description: 'Exercise frequency per week', example: 4 })
  @IsNumber()
  exerciseFrequency: number;

  @ApiProperty({ description: 'Session duration in minutes', example: 60 })
  @IsNumber()
  sessionDuration: number;

  @ApiProperty({ description: 'Has gym access', example: true })
  @IsBoolean()
  gymAccess: boolean;
}
