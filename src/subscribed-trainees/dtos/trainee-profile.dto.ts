import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
export class ProgressItemDto {
  @ApiProperty({ description: 'Completed amount' })
  completed: number;

  @ApiProperty({ description: 'Target amount' })
  target: number;

  @ApiProperty({ description: 'Progress percentage' })
  percentage: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Status of the progress item' })
  status: 'completed' | 'in_progress' | 'not_started';
}

export class TransformationDto {
  @ApiProperty({ description: 'Transformation ID' })
  id: string;

  @ApiProperty({ description: 'Date of transformation record' })
  date: Date;

  @ApiProperty({ description: 'Weight recorded' })
  weight?: number;

  @ApiProperty({ description: 'Body measurements' })
  measurements?: Record<string, number>;

  @ApiProperty({ description: 'Progress photos URLs' })
  photos?: string[];

  @ApiProperty({ description: 'Notes about the transformation' })
  notes?: string;

  @ApiProperty({ description: 'Milestone achieved' })
  milestone?: string;
}
export class DailyProgressDto {
  @ApiProperty({ description: 'Date' })
  date: Date;

  @ApiProperty({ description: 'Workout completed' })
  workoutCompleted: boolean;

  @ApiProperty({ description: 'Meals logged count' })
  mealsLogged: number;

  @ApiProperty({ description: 'Cardio minutes' })
  cardioMinutes: number;

  @ApiProperty({ description: 'Water intake in liters' })
  waterIntake: number;

  @ApiProperty({ description: 'Daily progress percentage' })
  progressPercentage: number;
}

export class SubscriptionPlanDto {
  @ApiProperty({ description: 'Subscription plan ID' })
  id: string;

  @ApiProperty({ description: 'Plan title' })
  title: string;

  @ApiProperty({ description: 'Plan description' })
  description?: string;

  @ApiProperty({ description: 'Plan price' })
  price?: number;

  @ApiProperty({ description: 'Plan duration in months' })
  durationMonths?: number;
}

export class TemplatePlanDto {
  @ApiProperty({ description: 'Template plan ID' })
  id: string;

  @ApiProperty({ description: 'Template plan name' })
  name: string;

  @ApiProperty({ description: 'Template plan description' })
  description?: string;

  @ApiProperty({ description: 'Template plan category' })
  category?: string;
}
export class TraineeProfileDto {
  @ApiProperty({ description: 'Trainee unique identifier' })
  id: string;

  @ApiProperty({ description: 'Full name of the trainee' })
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;

  @ApiProperty({ description: 'Profile picture URL' })
  profilePictureUrl?: string;

  @ApiProperty({ description: 'Age' })
  age?: number;

  @ApiProperty({ description: 'Gender' })
  gender?: string;

  @ApiProperty({ description: 'Height in cm' })
  height?: number;

  @ApiProperty({ description: 'Current weight in kg' })
  weight?: number;

  @ApiProperty({ description: 'Target weight in kg' })
  targetWeight?: number;

  @ApiProperty({ description: 'Body shape' })
  bodyShape?: string;

  @ApiProperty({ description: 'Body fat percentage' })
  bodyFat?: number;

  @ApiProperty({ description: 'Fitness goal' })
  goal?: string;

  @ApiProperty({ description: 'Fitness level' })
  fitnessLevel?: string;

  @ApiProperty({ description: 'Number of meals per day' })
  mealsPerDay?: number;

  @ApiProperty({ description: 'Diet preferences' })
  dietPreferences?: string;

  @ApiProperty({ description: 'Medical conditions' })
  medicalConditions?: string;

  @ApiProperty({ description: 'Allergies' })
  allergies?: string;

  @ApiProperty({ description: 'Exercise frequency per week' })
  exerciseFrequency?: number;

  @ApiProperty({ description: 'Session duration in minutes' })
  sessionDuration?: number;

  @ApiProperty({ description: 'Gym access availability' })
  gymAccess?: boolean;

  @ApiProperty({ description: 'Coaching mode preference' })
  coachingMode?: string;

  @ApiProperty({ description: 'Budget range' })
  budget?: string;

  @ApiProperty({ description: 'Preferred workout time' })
  preferredTime?: string;

  @ApiProperty({ description: 'Selected template plan' })
  templatePlan?: TemplatePlanDto;

  @ApiProperty({ description: 'Chosen subscription plan' })
  subscriptionPlan?: SubscriptionPlanDto;

  @ApiProperty({ description: 'Overall progress percentage' })
  progressPercentage: number;

  @ApiProperty({ description: 'Subscription status' })
  subscriptionStatus: string;

  @ApiProperty({ description: 'Subscription start date' })
  subscriptionStartDate?: Date;

  @ApiProperty({ description: 'Subscription end date' })
  subscriptionEndDate?: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityDate?: Date;

  @ApiProperty({ description: 'Total workouts completed' })
  totalWorkoutsCompleted: number;

  @ApiProperty({ description: 'Join date' })
  joinDate: Date;
}

export class TodayProgressDto {
  @ApiProperty({ description: 'Date for progress tracking' })
  date: string;

  @ApiProperty({ description: 'Meals progress' })
  meals: ProgressItemDto;

  @ApiProperty({ description: 'Gym workout progress' })
  gym: ProgressItemDto;

  @ApiProperty({ description: 'Cardio exercise progress' })
  cardio: ProgressItemDto;

  @ApiProperty({ description: 'Hydration progress' })
  hydration: ProgressItemDto;

  @ApiProperty({ description: 'Overall daily progress percentage' })
  overallProgress: number;
}
export class WeeklyProgressSummaryDto {
  @ApiProperty({ description: 'Total workouts completed' })
  workoutsCompleted: number;

  @ApiProperty({ description: 'Target workouts for the week' })
  workoutsTarget: number;

  @ApiProperty({ description: 'Average meal tracking compliance' })
  mealTrackingCompliance: number;

  @ApiProperty({ description: 'Total cardio minutes' })
  cardioMinutes: number;

  @ApiProperty({ description: 'Average hydration level' })
  averageHydration: number;

  @ApiProperty({ description: 'Weight change this week' })
  weightChange?: number;

  @ApiProperty({ description: 'Overall week progress percentage' })
  overallProgress: number;
}

export class GoalsAchievementDto {
  @ApiProperty({ description: 'Weight loss goal progress' })
  weightGoal?: {
    current: number;
    target: number;
    progress: number;
  };

  @ApiProperty({ description: 'Fitness milestones achieved', type: [String] })
  milestonesAchieved: string[];

  @ApiProperty({ description: 'Habits formed this week', type: [String] })
  habitsFormed: string[];

  @ApiProperty({ description: 'Areas for improvement', type: [String] })
  areasForImprovement: string[];
}
export class WeeklyReportDto {
  @ApiProperty({ description: 'Week start date' })
  weekStart: Date;

  @ApiProperty({ description: 'Week end date' })
  weekEnd: Date;

  @ApiProperty({ description: 'Weekly progress summary' })
  summary: WeeklyProgressSummaryDto;

  @ApiProperty({ description: 'Daily breakdown', type: [DailyProgressDto] })
  dailyBreakdown: DailyProgressDto[];

  @ApiProperty({ description: 'Week goals achievement' })
  goalsAchievement: GoalsAchievementDto;

  @ApiProperty({ description: 'Coach notes for the week' })
  coachNotes?: string;
}

export class MonthlyTransformationDto {
  @ApiProperty({ description: 'Year' })
  year: number;

  @ApiProperty({ description: 'Month' })
  month: number;

  @ApiProperty({
    description: 'Transformations for the month',
    type: [TransformationDto],
  })
  transformations: TransformationDto[];

  @ApiProperty({ description: 'Monthly summary' })
  summary: {
    totalRecords: number;
    weightChange?: number;
    averageProgress: number;
    milestonesAchieved: number;
  };
}

export class UpdateTraineeProfileDto {
  @ApiPropertyOptional({ description: 'Target weight in kg' })
  @IsOptional()
  @IsNumber()
  targetWeight?: number;

  @ApiPropertyOptional({ description: 'Current weight in kg' })
  @IsOptional()
  @IsNumber()
  currentWeight?: number;

  @ApiPropertyOptional({ description: 'Body fat percentage' })
  @IsOptional()
  @IsNumber()
  bodyFat?: number;

  @ApiPropertyOptional({ description: 'Coach notes' })
  @IsOptional()
  @IsString()
  coachNotes?: string;

  @ApiPropertyOptional({ description: 'Template plan ID' })
  @IsOptional()
  @IsString()
  templatePlanId?: string;

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  @IsOptional()
  @IsString()
  subscriptionPlanId?: string;
}
