import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACKS = 'snacks',
  DRINKS = 'drinks',
}

@Entity('meals')
export class MealEntity {
  @ApiProperty({ description: 'Unique identifier for the meal' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the meal', example: 'Grilled Chicken Salad' })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({ description: 'Calories per serving', example: 350 })
  @Column('decimal', { precision: 8, scale: 2 })
  calories: number;

  @ApiProperty({ description: 'Protein content in grams', example: 25.5 })
  @Column('decimal', { precision: 8, scale: 2 })
  protein: number;

  @ApiProperty({ description: 'Fat content in grams', example: 15.2 })
  @Column('decimal', { precision: 8, scale: 2 })
  fat: number;

  @ApiProperty({ description: 'Carbohydrates content in grams', example: 20.8 })
  @Column('decimal', { precision: 8, scale: 2 })
  carbs: number;

  @ApiProperty({ 
    description: 'List of ingredients', 
    example: ['200g chicken breast', '100g mixed greens', '50g cherry tomatoes'] 
  })
  @Column('text', { array: true })
  ingredients: string[];

  @ApiProperty({ 
    description: 'Preparation instructions',
    example: '1. Season chicken with salt and pepper\n2. Grill chicken for 6-8 minutes per side\n3. Mix greens and tomatoes\n4. Slice chicken and serve over salad'
  })
  @Column('text')
  preparation: string;

  @ApiProperty({ description: 'Image URL for the meal', required: false })
  @Column({ nullable: true })
  imageUrl?: string;

  @ApiProperty({ enum: MealType, description: 'Type of meal' })
  @Column({ type: 'enum', enum: MealType })
  mealType: MealType;

  @ApiProperty({ 
    description: 'Detailed description of the meal',
    example: 'A healthy and protein-rich salad perfect for lunch or dinner. Packed with lean protein and fresh vegetables.'
  })
  @Column('text')
  description: string;

  @ApiProperty({ description: 'When the meal was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'When the meal was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
