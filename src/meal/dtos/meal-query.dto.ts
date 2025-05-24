import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MealType } from '../entities/meal.entity';

export class MealQueryDto {
  @ApiProperty({ 
    description: 'Page number for pagination', 
    example: 1,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 10,
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ 
    enum: MealType, 
    description: 'Filter by meal type',
    required: false
  })
  @IsOptional()
  @IsEnum(MealType)
  mealType?: MealType;

  @ApiProperty({ 
    description: 'Search by meal name',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Maximum calories per serving',
    required: false,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxCalories?: number;

  @ApiProperty({ 
    description: 'Minimum protein content',
    required: false,
    minimum: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minProtein?: number;
}
