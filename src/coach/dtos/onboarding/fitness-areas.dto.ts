import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { FitnessArea } from '../../entities/coach-profile.entity';

export class FitnessAreasDto {
  @ApiProperty({
    description: 'List of fitness areas the coach specializes in',
    enum: FitnessArea,
    isArray: true,
    example: [
      FitnessArea.WEIGHT_LOSS,
      FitnessArea.STRENGTH_TRAINING,
      FitnessArea.NUTRITION,
    ],
    required: true,
  })
  @IsArray()
  @IsEnum(FitnessArea, { each: true })
  @IsNotEmpty()
  fitnessAreas: FitnessArea[];
}
