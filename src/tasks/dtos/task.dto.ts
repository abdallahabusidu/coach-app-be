import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  IsObject,
  Min,
  Max,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  TaskType,
  TaskPriority,
  TaskStatus,
  TaskFrequency,
} from '../entities/task.entity';

export class TaskConfigDto {
  @ApiPropertyOptional({ description: 'Workout configuration' })
  @IsOptional()
  @IsObject()
  workout?: {
    workoutId: string;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
    targetDuration?: number;
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Meal logging configuration' })
  @IsOptional()
  @IsObject()
  mealLog?: {
    mealsToLog: string[];
    includePhotos?: boolean;
    trackMacros?: boolean;
    specificMeals?: string[];
  };

  @ApiPropertyOptional({ description: 'Weight check configuration' })
  @IsOptional()
  @IsObject()
  weightCheck?: {
    unit: 'kg' | 'lbs';
    timeOfDay?: string;
    instructions?: string;
    targetWeight?: number;
  };

  @ApiPropertyOptional({ description: 'Progress photo configuration' })
  @IsOptional()
  @IsObject()
  progressPhoto?: {
    angles: string[];
    lighting?: string;
    clothing?: string;
    location?: string;
  };

  @ApiPropertyOptional({ description: 'Body measurement configuration' })
  @IsOptional()
  @IsObject()
  measurement?: {
    bodyParts: string[];
    unit: 'cm' | 'inch';
    instructions?: string;
    targetMeasurements?: { [part: string]: number };
  };

  @ApiPropertyOptional({ description: 'Habit tracking configuration' })
  @IsOptional()
  @IsObject()
  habitTracking?: {
    habits: {
      name: string;
      targetCount?: number;
      targetHours?: number;
      unit?: string;
    }[];
  };

  @ApiPropertyOptional({ description: 'Reflection configuration' })
  @IsOptional()
  @IsObject()
  reflection?: {
    questions: string[];
    minWords?: number;
    categories?: string[];
  };

  @ApiPropertyOptional({ description: 'Education content configuration' })
  @IsOptional()
  @IsObject()
  education?: {
    contentType: 'article' | 'video' | 'podcast';
    contentUrl?: string;
    contentTitle?: string;
    expectedReadTime?: number;
    quizQuestions?: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  };

  @ApiPropertyOptional({ description: 'Goal setting configuration' })
  @IsOptional()
  @IsObject()
  goalSetting?: {
    categories: string[];
    timeframe: string;
    smartCriteria: boolean;
    templateGoals?: string[];
  };

  @ApiPropertyOptional({ description: 'Custom task configuration' })
  @IsOptional()
  @IsObject()
  custom?: {
    instructions: string;
    requirements?: string[];
    attachments?: string[];
  };
}

export class ReminderSettingsDto {
  @ApiProperty({ description: 'Whether reminders are enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Minutes before due date to send reminder' })
  @IsNumber()
  @Min(5)
  @Max(10080) // Max 1 week
  beforeDue: number;

  @ApiProperty({ description: 'Reminder frequency' })
  @IsEnum(['once', 'daily', 'hourly'])
  frequency: 'once' | 'daily' | 'hourly';

  @ApiProperty({ description: 'Reminder methods', type: [String] })
  @IsArray()
  @IsString({ each: true })
  methods: ('push' | 'email' | 'sms')[];
}

export class RecurrencePatternDto {
  @ApiProperty({ description: 'Interval between recurrences' })
  @IsNumber()
  @Min(1)
  @Max(365)
  interval: number;

  @ApiPropertyOptional({
    description: 'Days of week for weekly recurrence (0=Sunday)',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek?: number[];

  @ApiPropertyOptional({ description: 'End date for recurrence' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Maximum number of occurrences' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxOccurrences?: number;

  @ApiPropertyOptional({ description: 'Exception dates to skip', type: [Date] })
  @IsOptional()
  @IsArray()
  exceptions?: Date[];
}

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed description of the task' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ description: 'Type of task', enum: TaskType })
  @IsEnum(TaskType)
  taskType: TaskType;

  @ApiProperty({ description: 'Trainee ID to assign the task to' })
  @IsUUID()
  traineeId: string;

  @ApiProperty({ description: 'Task priority level', enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @ApiProperty({ description: 'Task frequency', enum: TaskFrequency })
  @IsEnum(TaskFrequency)
  frequency: TaskFrequency;

  @ApiPropertyOptional({ description: 'When the task is due' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'When the task should start being visible',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Estimated time to complete in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600) // Max 10 hours
  estimatedMinutes?: number;

  @ApiPropertyOptional({
    description: 'Task-specific configuration',
    type: TaskConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  taskConfig?: TaskConfigDto;

  @ApiPropertyOptional({ description: 'Instructions for the trainee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Points awarded for completion' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether the task is visible to the trainee',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the task requires approval after completion',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of submissions allowed' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxSubmissions?: number;

  @ApiPropertyOptional({
    description: 'Whether the task allows late submissions',
  })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({
    description: 'Reminder settings',
    type: ReminderSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderSettingsDto)
  reminderSettings?: ReminderSettingsDto;

  @ApiPropertyOptional({
    description: 'Recurrence pattern for recurring tasks',
    type: RecurrencePatternDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrencePattern?: RecurrencePatternDto;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task title' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the task' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Task priority level',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Current status of the task',
    enum: TaskStatus,
  })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'When the task is due' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'When the task should start being visible',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Estimated time to complete in minutes' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600)
  estimatedMinutes?: number;

  @ApiPropertyOptional({
    description: 'Task-specific configuration',
    type: TaskConfigDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  taskConfig?: TaskConfigDto;

  @ApiPropertyOptional({ description: 'Instructions for the trainee' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Points awarded for completion' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether the task is visible to the trainee',
  })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the task requires approval after completion',
  })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Maximum number of submissions allowed' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxSubmissions?: number;

  @ApiPropertyOptional({
    description: 'Whether the task allows late submissions',
  })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({
    description: 'Reminder settings',
    type: ReminderSettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ReminderSettingsDto)
  reminderSettings?: ReminderSettingsDto;

  @ApiPropertyOptional({
    description: 'Recurrence pattern for recurring tasks',
    type: RecurrencePatternDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrencePattern?: RecurrencePatternDto;
}

export class TaskResponseDto {
  @ApiProperty({ description: 'Task ID' })
  id: string;

  @ApiProperty({ description: 'Task title' })
  title: string;

  @ApiProperty({ description: 'Task description' })
  description?: string;

  @ApiProperty({ description: 'Task type', enum: TaskType })
  taskType: TaskType;

  @ApiProperty({ description: 'Coach information' })
  coach: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Trainee information' })
  trainee: {
    id: string;
    name: string;
  };

  @ApiProperty({ description: 'Task priority', enum: TaskPriority })
  priority: TaskPriority;

  @ApiProperty({ description: 'Task status', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Task frequency', enum: TaskFrequency })
  frequency: TaskFrequency;

  @ApiProperty({ description: 'Due date' })
  dueDate?: Date;

  @ApiProperty({ description: 'Start date' })
  startDate?: Date;

  @ApiProperty({ description: 'Estimated time in minutes' })
  estimatedMinutes?: number;

  @ApiProperty({ description: 'Task configuration' })
  taskConfig?: any;

  @ApiProperty({ description: 'Instructions' })
  instructions?: string;

  @ApiProperty({ description: 'Tags' })
  tags: string[];

  @ApiProperty({ description: 'Points awarded' })
  points: number;

  @ApiProperty({ description: 'Is visible' })
  isVisible: boolean;

  @ApiProperty({ description: 'Requires approval' })
  requiresApproval: boolean;

  @ApiProperty({ description: 'Max submissions' })
  maxSubmissions: number;

  @ApiProperty({ description: 'Allow late submission' })
  allowLateSubmission: boolean;

  @ApiProperty({ description: 'Reminder settings' })
  reminderSettings?: any;

  @ApiProperty({ description: 'Recurrence pattern' })
  recurrencePattern?: any;

  @ApiProperty({ description: 'Completion data' })
  completionData?: any;

  @ApiProperty({ description: 'Number of submissions' })
  submissionCount: number;

  @ApiProperty({ description: 'Is overdue' })
  isOverdue: boolean;

  @ApiProperty({ description: 'Days until due' })
  daysUntilDue?: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Started date' })
  startedAt?: Date;

  @ApiProperty({ description: 'Completed date' })
  completedAt?: Date;

  @ApiProperty({ description: 'Parent task ID' })
  parentTaskId?: string;

  @ApiProperty({ description: 'Sequence number' })
  sequenceNumber: number;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  tasks: TaskResponseDto[];

  @ApiProperty({ description: 'Total number of tasks' })
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

  @ApiProperty({ description: 'Task summary statistics' })
  summary: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    totalPoints: number;
    completionRate: number;
  };
}

export class TaskSummaryDto {
  @ApiProperty({ description: 'Total tasks' })
  total: number;

  @ApiProperty({ description: 'Pending tasks' })
  pending: number;

  @ApiProperty({ description: 'In progress tasks' })
  inProgress: number;

  @ApiProperty({ description: 'Completed tasks' })
  completed: number;

  @ApiProperty({ description: 'Overdue tasks' })
  overdue: number;

  @ApiProperty({ description: 'Total points available' })
  totalPoints: number;

  @ApiProperty({ description: 'Points earned' })
  pointsEarned: number;

  @ApiProperty({ description: 'Completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average task rating' })
  averageRating?: number;

  @ApiProperty({ description: 'Tasks due today' })
  dueToday: number;

  @ApiProperty({ description: 'Tasks due this week' })
  dueThisWeek: number;

  @ApiProperty({ description: 'Current streak days' })
  currentStreak: number;

  @ApiProperty({ description: 'Longest streak days' })
  longestStreak: number;
}
