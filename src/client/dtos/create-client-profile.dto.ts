import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateClientProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(120)
  age?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  height?: number;

  @IsString()
  @IsOptional()
  fitnessGoals?: string;

  @IsString()
  @IsOptional()
  healthConditions?: string;

  @IsString()
  @IsOptional()
  preferredWorkoutType?: string;
}
