import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../../auth/entities/user.entity';
import { TaskSubmissionEntity } from './task-submission.entity';

export enum TaskType {
  WORKOUT = 'workout',
  MEAL_LOG = 'meal_log',
  WEIGHT_CHECK = 'weight_check',
  PROGRESS_PHOTO = 'progress_photo',
  MEASUREMENT = 'measurement',
  HABIT_TRACKING = 'habit_tracking',
  REFLECTION = 'reflection',
  EDUCATION = 'education',
  GOAL_SETTING = 'goal_setting',
  CUSTOM = 'custom',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum TaskFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

@Entity('tasks')
export class TaskEntity {
  @ApiProperty({ description: 'Unique identifier for the task' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Task title' })
  @Column({ length: 200 })
  @Index()
  title: string;

  @ApiProperty({ description: 'Detailed description of the task' })
  @Column('text', { nullable: true })
  description?: string;

  @ApiProperty({ description: 'Type of task', enum: TaskType })
  @Column({
    type: 'enum',
    enum: TaskType,
  })
  @Index()
  taskType: TaskType;

  @ApiProperty({ description: 'Coach who assigned the task' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  coach: UserEntity;

  @ApiProperty({ description: 'Coach ID' })
  @Column()
  @Index()
  coachId: string;

  @ApiProperty({ description: 'Trainee assigned to the task' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  trainee: UserEntity;

  @ApiProperty({ description: 'Trainee ID' })
  @Column()
  @Index()
  traineeId: string;

  @ApiProperty({ description: 'Task priority level', enum: TaskPriority })
  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  @Index()
  priority: TaskPriority;

  @ApiProperty({ description: 'Current status of the task', enum: TaskStatus })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @Index()
  status: TaskStatus;

  @ApiProperty({
    description: 'Task frequency/recurrence',
    enum: TaskFrequency,
  })
  @Column({
    type: 'enum',
    enum: TaskFrequency,
    default: TaskFrequency.ONCE,
  })
  frequency: TaskFrequency;

  @ApiProperty({ description: 'When the task is due' })
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  dueDate?: Date;

  @ApiProperty({ description: 'When the task should start being visible' })
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @ApiProperty({ description: 'Estimated time to complete in minutes' })
  @Column({ nullable: true })
  estimatedMinutes?: number;

  @ApiProperty({
    description: 'Task-specific configuration and requirements',
    example: {
      workout: {
        workoutId: 'uuid',
        targetSets: 3,
        targetReps: 12,
        targetWeight: 50,
      },
      mealLog: {
        mealsToLog: ['breakfast', 'lunch', 'dinner'],
        includePhotos: true,
        trackMacros: true,
      },
      weightCheck: {
        unit: 'kg',
        timeOfDay: 'morning',
        instructions:
          'Weigh yourself first thing in the morning after using the bathroom',
      },
      progressPhoto: {
        angles: ['front', 'side', 'back'],
        lighting: 'Natural lighting preferred',
        clothing: 'Minimal, consistent clothing',
      },
      measurement: {
        bodyParts: ['waist', 'chest', 'arms'],
        unit: 'cm',
        instructions: 'Measure at the same time of day',
      },
      habitTracking: {
        habits: [
          { name: 'Drink 8 glasses of water', targetCount: 8 },
          { name: 'Sleep 8 hours', targetHours: 8 },
        ],
      },
      reflection: {
        questions: [
          'How did you feel today?',
          'What went well with your nutrition?',
          'What challenges did you face?',
        ],
        minWords: 50,
      },
      education: {
        contentType: 'article',
        contentUrl: 'https://example.com/article',
        expectedReadTime: 10,
        quizQuestions: [],
      },
      goalSetting: {
        categories: ['fitness', 'nutrition', 'lifestyle'],
        timeframe: '1 month',
        smartCriteria: true,
      },
    },
  })
  @Column('jsonb', { nullable: true })
  taskConfig?: {
    workout?: {
      workoutId: string;
      targetSets?: number;
      targetReps?: number;
      targetWeight?: number;
      targetDuration?: number;
      notes?: string;
    };
    mealLog?: {
      mealsToLog: string[];
      includePhotos?: boolean;
      trackMacros?: boolean;
      specificMeals?: string[];
    };
    weightCheck?: {
      unit: 'kg' | 'lbs';
      timeOfDay?: string;
      instructions?: string;
      targetWeight?: number;
    };
    progressPhoto?: {
      angles: string[];
      lighting?: string;
      clothing?: string;
      location?: string;
    };
    measurement?: {
      bodyParts: string[];
      unit: 'cm' | 'inch';
      instructions?: string;
      targetMeasurements?: { [part: string]: number };
    };
    habitTracking?: {
      habits: {
        name: string;
        targetCount?: number;
        targetHours?: number;
        unit?: string;
      }[];
    };
    reflection?: {
      questions: string[];
      minWords?: number;
      categories?: string[];
    };
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
    goalSetting?: {
      categories: string[];
      timeframe: string;
      smartCriteria: boolean;
      templateGoals?: string[];
    };
    custom?: {
      instructions: string;
      requirements?: string[];
      attachments?: string[];
    };
  };

  @ApiProperty({ description: 'Instructions for the trainee' })
  @Column('text', { nullable: true })
  instructions?: string;

  @ApiProperty({ description: 'Tags for categorization and filtering' })
  @Column('text', { array: true, default: [] })
  tags: string[];

  @ApiProperty({ description: 'Points awarded for completion' })
  @Column({ default: 10 })
  points: number;

  @ApiProperty({ description: 'Whether the task is visible to the trainee' })
  @Column({ default: true })
  isVisible: boolean;

  @ApiProperty({
    description: 'Whether the task requires approval after completion',
  })
  @Column({ default: false })
  requiresApproval: boolean;

  @ApiProperty({ description: 'Maximum number of submissions allowed' })
  @Column({ default: 1 })
  maxSubmissions: number;

  @ApiProperty({ description: 'Whether the task allows late submissions' })
  @Column({ default: true })
  allowLateSubmission: boolean;

  @ApiProperty({ description: 'Reminder settings' })
  @Column('jsonb', { nullable: true })
  reminderSettings?: {
    enabled: boolean;
    beforeDue: number; // minutes before due date
    frequency: 'once' | 'daily' | 'hourly';
    methods: ('push' | 'email' | 'sms')[];
  };

  @ApiProperty({ description: 'Custom recurrence pattern for recurring tasks' })
  @Column('jsonb', { nullable: true })
  recurrencePattern?: {
    interval: number; // every X days/weeks/months
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    endDate?: Date;
    maxOccurrences?: number;
    exceptions?: Date[]; // dates to skip
  };

  @ApiProperty({ description: 'Task completion data' })
  @Column('jsonb', { nullable: true })
  completionData?: {
    completedAt?: Date;
    completedBy?: string;
    timeTaken?: number; // minutes
    notes?: string;
    rating?: number; // 1-5 stars
    feedback?: string;
  };

  @ApiProperty({ description: 'Task submissions' })
  @OneToMany(() => TaskSubmissionEntity, (submission) => submission.task)
  submissions: TaskSubmissionEntity[];

  @ApiProperty({ description: 'Task creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Task last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'When the task was first started' })
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'When the task was completed' })
  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @ApiProperty({ description: 'Parent task ID for recurring tasks' })
  @Column({ nullable: true })
  parentTaskId?: string;

  @ApiProperty({ description: 'Sequence number for recurring tasks' })
  @Column({ default: 1 })
  sequenceNumber: number;
}
