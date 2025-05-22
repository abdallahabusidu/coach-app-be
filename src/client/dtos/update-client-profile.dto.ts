import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateClientProfileDto {
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

  @IsString()
  @IsOptional()
  profilePictureUrl?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  fitnessGoal?: string;

  @IsString()
  @IsOptional()
  fitnessLevel?: string;

  @IsString()
  @IsOptional()
  bodyShape?: string;

  @IsNumber()
  @IsOptional()
  mealsPerDay?: number;

  @IsOptional()
  specificDiet?: boolean;

  @IsNumber()
  @IsOptional()
  exerciseFrequency?: number;

  @IsNumber()
  @IsOptional()
  sessionDuration?: number;

  @IsOptional()
  gymAccess?: boolean;

  @IsString()
  @IsOptional()
  healthConsiderations?: string;

  @IsString()
  @IsOptional()
  allergies?: string;

  @IsOptional()
  medications?: boolean;

  @IsOptional()
  medicalConditions?: boolean;

  @IsString()
  @IsOptional()
  medicalConditionsDescription?: string;

  @IsOptional()
  smoke?: boolean;

  @IsOptional()
  drinkAlcohol?: boolean;

  @IsString()
  @IsOptional()
  coachGenderPreference?: string;

  @IsString()
  @IsOptional()
  coachingMode?: string;

  @IsString()
  @IsOptional()
  budget?: string;

  @IsString()
  @IsOptional()
  preferredTime?: string;
}
