import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsArray, IsEnum, Min, Max } from 'class-validator';

export class TraineeFilterDto {
  @ApiPropertyOptional({ description: 'Filter by trainee name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Minimum progress percentage (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progressMin?: number;

  @ApiPropertyOptional({ description: 'Maximum progress percentage (0-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progressMax?: number;

  @ApiPropertyOptional({ description: 'Minimum height in cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(250)
  heightMin?: number;

  @ApiPropertyOptional({ description: 'Maximum height in cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(250)
  heightMax?: number;

  @ApiPropertyOptional({ description: 'Minimum weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(300)
  weightMin?: number;

  @ApiPropertyOptional({ description: 'Maximum weight in kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(300)
  weightMax?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by fitness goals (multiple selection)',
    isArray: true,
    type: String,
    example: ['weight_loss', 'muscle_gain', 'endurance']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  goals?: string[];

  @ApiPropertyOptional({ 
    description: 'Filter by subscribed plans (multiple selection)',
    isArray: true,
    type: String,
    example: ['premium', 'basic', 'pro']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  plans?: string[];

  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: ['name', 'progress', 'height', 'weight', 'subscriptionDate'],
    default: 'name'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC'
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}

export class CsvImportDto {
  @ApiProperty({ 
    description: 'CSV file containing trainee data',
    type: 'string',
    format: 'binary'
  })
  file: Express.Multer.File;
}

export class TraineeResponseDto {
  @ApiProperty({ description: 'Trainee unique identifier' })
  id: string;

  @ApiProperty({ description: 'Full name of the trainee' })
  name: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiProperty({ description: 'Height in cm' })
  height?: number;

  @ApiProperty({ description: 'Current weight in kg' })
  weight?: number;

  @ApiProperty({ description: 'Target weight in kg' })
  targetWeight?: number;

  @ApiProperty({ description: 'Fitness goals' })
  goal?: string;

  @ApiProperty({ description: 'Subscribed plan name' })
  planSubscribed?: string;

  @ApiProperty({ description: 'Plan description' })
  planDescription?: string;

  @ApiProperty({ description: 'Daily progress percentage (0-100)' })
  progressOnDay: number;

  @ApiProperty({ description: 'Overall workout completion percentage' })
  workoutCompletionPercentage: number;

  @ApiProperty({ description: 'Total workouts completed' })
  totalWorkoutsCompleted: number;

  @ApiProperty({ description: 'Subscription status' })
  subscriptionStatus: string;

  @ApiProperty({ description: 'Subscription start date' })
  subscriptionStartDate?: Date;

  @ApiProperty({ description: 'Subscription end date' })
  subscriptionEndDate?: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityDate?: Date;

  @ApiProperty({ description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Age' })
  age?: number;

  @ApiProperty({ description: 'Gender' })
  gender?: string;

  @ApiProperty({ description: 'Fitness level' })
  fitnessLevel?: string;
}

export class TraineeListResponseDto {
  @ApiProperty({ type: [TraineeResponseDto] })
  trainees: TraineeResponseDto[];

  @ApiProperty({ description: 'Total number of trainees matching filters' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrevious: boolean;
}

export class CsvImportResultDto {
  @ApiProperty({ description: 'Number of trainees successfully imported' })
  imported: number;

  @ApiProperty({ description: 'Number of trainees that failed to import' })
  failed: number;

  @ApiProperty({ description: 'Total number of rows processed' })
  total: number;

  @ApiProperty({ description: 'List of import errors', isArray: true })
  errors: string[];

  @ApiProperty({ description: 'List of successfully imported trainee IDs', isArray: true })
  importedIds: string[];
}
