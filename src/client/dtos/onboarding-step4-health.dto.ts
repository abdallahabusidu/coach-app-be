import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class OnboardingStep4HealthDto {
  @ApiProperty({ description: 'Health considerations', required: false })
  @IsOptional()
  @IsString()
  healthConsiderations?: string;

  @ApiProperty({ description: 'Allergies', required: false })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiProperty({ description: 'Currently taking medications', example: false })
  @IsBoolean()
  medications: boolean;

  @ApiProperty({
    description: 'Has medical conditions or injuries',
    example: false,
  })
  @IsBoolean()
  medicalConditions: boolean;

  @ApiProperty({
    description: 'Medical conditions description',
    required: false,
  })
  @IsOptional()
  @IsString()
  medicalConditionsDescription?: string;

  @ApiProperty({ description: 'Do you smoke?', example: false })
  @IsBoolean()
  smoke: boolean;

  @ApiProperty({ description: 'Do you drink alcohol?', example: false })
  @IsBoolean()
  drinkAlcohol: boolean;
}
