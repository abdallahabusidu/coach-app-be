import { ApiProperty } from '@nestjs/swagger';
import { MealEntity } from '../entities/meal.entity';

export class MealResponseDto {
  @ApiProperty({ description: 'Unique identifier for the meal' })
  id: string;

  @ApiProperty({ description: 'Name of the meal' })
  name: string;

  @ApiProperty({ description: 'Calories per serving' })
  calories: number;

  @ApiProperty({ description: 'Protein content in grams' })
  protein: number;

  @ApiProperty({ description: 'Fat content in grams' })
  fat: number;

  @ApiProperty({ description: 'Carbohydrates content in grams' })
  carbs: number;

  @ApiProperty({ description: 'List of ingredients' })
  ingredients: string[];

  @ApiProperty({ description: 'Preparation instructions' })
  preparation: string;

  @ApiProperty({ description: 'Image URL for the meal', required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'Type of meal' })
  mealType: string;

  @ApiProperty({ description: 'Detailed description of the meal' })
  description: string;

  @ApiProperty({ description: 'When the meal was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When the meal was last updated' })
  updatedAt: Date;

  constructor(meal: MealEntity) {
    this.id = meal.id;
    this.name = meal.name;
    this.calories = meal.calories;
    this.protein = meal.protein;
    this.fat = meal.fat;
    this.carbs = meal.carbs;
    this.ingredients = meal.ingredients;
    this.preparation = meal.preparation;
    this.imageUrl = meal.imageUrl;
    this.mealType = meal.mealType;
    this.description = meal.description;
    this.createdAt = meal.createdAt;
    this.updatedAt = meal.updatedAt;
  }
}

export class PaginatedMealsResponseDto {
  @ApiProperty({ type: [MealResponseDto], description: 'Array of meals' })
  meals: MealResponseDto[];

  @ApiProperty({ description: 'Total number of meals' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  constructor(meals: MealEntity[], total: number, page: number, limit: number) {
    this.meals = meals.map(meal => new MealResponseDto(meal));
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
