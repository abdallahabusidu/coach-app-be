import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  IsOptional,
  IsNotEmpty,
  Min,
  MaxLength,
  ArrayNotEmpty,
  IsUrl,
} from 'class-validator';
import { MealType } from '../entities/meal.entity';

export class CreateMealDto {
  @ApiProperty({ 
    description: 'Name of the meal', 
    example: 'Grilled Chicken Salad',
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ 
    description: 'Calories per serving', 
    example: 350,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  calories: number;

  @ApiProperty({ 
    description: 'Protein content in grams', 
    example: 25.5,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  protein: number;

  @ApiProperty({ 
    description: 'Fat content in grams', 
    example: 15.2,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fat: number;

  @ApiProperty({ 
    description: 'Carbohydrates content in grams', 
    example: 20.8,
    minimum: 0
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  carbs: number;

  @ApiProperty({ 
    description: 'List of ingredients', 
    example: ['200g chicken breast', '100g mixed greens', '50g cherry tomatoes'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ingredients: string[];

  @ApiProperty({ 
    description: 'Preparation instructions',
    example: '1. Season chicken with salt and pepper\n2. Grill chicken for 6-8 minutes per side\n3. Mix greens and tomatoes\n4. Slice chicken and serve over salad'
  })
  @IsString()
  @IsNotEmpty()
  preparation: string;

  @ApiProperty({ 
    description: 'Image URL for the meal', 
    example: 'https://example.com/meal-image.jpg',
    required: false 
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ 
    enum: MealType, 
    description: 'Type of meal',
    example: MealType.LUNCH
  })
  @IsEnum(MealType)
  mealType: MealType;

  @ApiProperty({ 
    description: 'Detailed description of the meal',
    example: 'A healthy and protein-rich salad perfect for lunch or dinner. Packed with lean protein and fresh vegetables.'
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
