import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TaskEntity } from './task.entity';
import { UserEntity } from '../../auth/entities/user.entity';

export enum SubmissionStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
}

@Entity('task_submissions')
export class TaskSubmissionEntity {
  @ApiProperty({ description: 'Unique identifier for the submission' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Task this submission belongs to' })
  @ManyToOne(() => TaskEntity, (task) => task.submissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  task: TaskEntity;

  @ApiProperty({ description: 'Task ID' })
  @Column()
  @Index()
  taskId: string;

  @ApiProperty({ description: 'User who submitted the task' })
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn()
  submittedBy: UserEntity;

  @ApiProperty({ description: 'Submitter user ID' })
  @Column()
  @Index()
  submittedById: string;

  @ApiProperty({ description: 'Submission status', enum: SubmissionStatus })
  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.SUBMITTED,
  })
  @Index()
  status: SubmissionStatus;

  @ApiProperty({
    description: 'Submission data based on task type',
    example: {
      workout: {
        actualSets: 3,
        actualReps: [12, 10, 8],
        actualWeight: [50, 52.5, 55],
        duration: 45,
        difficulty: 7,
        notes: 'Felt strong today, increased weight on last set',
      },
      mealLog: {
        meals: [
          {
            type: 'breakfast',
            foods: ['oatmeal', 'banana', 'protein powder'],
            calories: 450,
            macros: { protein: 30, carbs: 60, fat: 8 },
            photo: 'breakfast-photo-url.jpg',
            time: '08:00',
          },
        ],
        totalCalories: 2150,
        totalMacros: { protein: 150, carbs: 200, fat: 70 },
      },
      weightCheck: {
        weight: 75.2,
        unit: 'kg',
        timeOfDay: 'morning',
        notes: 'Measured after bathroom, before breakfast',
        trend: 'stable',
      },
      progressPhoto: {
        photos: [
          { angle: 'front', url: 'front-photo-url.jpg' },
          { angle: 'side', url: 'side-photo-url.jpg' },
          { angle: 'back', url: 'back-photo-url.jpg' },
        ],
        lighting: 'natural',
        location: 'bedroom',
        notes: 'Consistent lighting and position',
      },
      measurement: {
        measurements: [
          { bodyPart: 'waist', value: 82, unit: 'cm' },
          { bodyPart: 'chest', value: 102, unit: 'cm' },
          { bodyPart: 'arms', value: 35, unit: 'cm' },
        ],
        notes: 'Measured in the morning',
      },
      habitTracking: {
        habits: [
          { name: 'Drink 8 glasses of water', completed: 7, target: 8 },
          { name: 'Sleep 8 hours', completed: 7.5, target: 8 },
        ],
        overallScore: 85,
      },
      reflection: {
        responses: [
          {
            question: 'How did you feel today?',
            answer: 'I felt energetic and motivated throughout the day.',
          },
          {
            question: 'What went well with your nutrition?',
            answer:
              'I stayed within my calorie goals and hit my protein target.',
          },
        ],
        wordCount: 150,
        mood: 'positive',
      },
      education: {
        completed: true,
        timeSpent: 12,
        quiz: [
          { question: 1, answer: 2, correct: true },
          { question: 2, answer: 1, correct: false },
        ],
        score: 80,
        notes: 'Found the article very informative about protein timing',
      },
      goalSetting: {
        goals: [
          {
            category: 'fitness',
            goal: 'Increase bench press by 10kg in 4 weeks',
            specific: true,
            measurable: true,
            achievable: true,
            relevant: true,
            timeBound: true,
          },
        ],
        confidence: 8,
      },
    },
  })
  @Column('jsonb')
  submissionData: {
    workout?: {
      actualSets?: number;
      actualReps?: number[];
      actualWeight?: number[];
      duration?: number;
      difficulty?: number; // 1-10 scale
      notes?: string;
      exerciseCompletions?: {
        exerciseId: string;
        completed: boolean;
        sets: number;
        reps: number[];
        weight: number[];
        notes?: string;
      }[];
    };
    mealLog?: {
      meals: {
        type: string;
        foods: string[];
        calories: number;
        macros: { protein: number; carbs: number; fat: number };
        photo?: string;
        time: string;
        notes?: string;
      }[];
      totalCalories: number;
      totalMacros: { protein: number; carbs: number; fat: number };
      waterIntake?: number;
    };
    weightCheck?: {
      weight: number;
      unit: 'kg' | 'lbs';
      timeOfDay: string;
      notes?: string;
      trend?: 'increasing' | 'decreasing' | 'stable';
    };
    progressPhoto?: {
      photos: {
        angle: string;
        url: string;
        timestamp?: Date;
      }[];
      lighting?: string;
      location?: string;
      notes?: string;
    };
    measurement?: {
      measurements: {
        bodyPart: string;
        value: number;
        unit: 'cm' | 'inch';
        notes?: string;
      }[];
      notes?: string;
    };
    habitTracking?: {
      habits: {
        name: string;
        completed: number;
        target: number;
        unit?: string;
        notes?: string;
      }[];
      overallScore: number;
    };
    reflection?: {
      responses: {
        question: string;
        answer: string;
      }[];
      wordCount: number;
      mood?: string;
      overallRating?: number;
    };
    education?: {
      completed: boolean;
      timeSpent: number; // minutes
      quiz?: {
        question: number;
        answer: number;
        correct: boolean;
      }[];
      score?: number;
      notes?: string;
    };
    goalSetting?: {
      goals: {
        category: string;
        goal: string;
        specific: boolean;
        measurable: boolean;
        achievable: boolean;
        relevant: boolean;
        timeBound: boolean;
        deadline?: Date;
      }[];
      confidence: number; // 1-10 scale
    };
    custom?: {
      text?: string;
      files?: string[];
      data?: any;
    };
  };

  @ApiProperty({ description: 'Additional notes from the trainee' })
  @Column('text', { nullable: true })
  notes?: string;

  @ApiProperty({ description: 'Attached files (photos, videos, documents)' })
  @Column('text', { array: true, default: [] })
  attachments: string[];

  @ApiProperty({ description: 'Time taken to complete the task in minutes' })
  @Column({ nullable: true })
  timeTaken?: number;

  @ApiProperty({ description: 'Trainee rating of the task difficulty (1-10)' })
  @Column({ nullable: true })
  difficultyRating?: number;

  @ApiProperty({ description: 'Trainee satisfaction with the task (1-10)' })
  @Column({ nullable: true })
  satisfactionRating?: number;

  @ApiProperty({ description: 'Coach who reviewed the submission' })
  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn()
  reviewedBy?: UserEntity;

  @ApiProperty({ description: 'Reviewer user ID' })
  @Column({ nullable: true })
  reviewedById?: string;

  @ApiProperty({ description: 'Coach feedback on the submission' })
  @Column('text', { nullable: true })
  coachFeedback?: string;

  @ApiProperty({ description: 'Coach rating of the submission (1-10)' })
  @Column({ nullable: true })
  coachRating?: number;

  @ApiProperty({ description: 'Points awarded for this submission' })
  @Column({ default: 0 })
  pointsAwarded: number;

  @ApiProperty({
    description: 'Whether this submission is the latest for the task',
  })
  @Column({ default: true })
  isLatest: boolean;

  @ApiProperty({ description: 'Submission creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Submission last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'When the submission was reviewed' })
  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @ApiProperty({ description: 'Submission sequence number for the task' })
  @Column({ default: 1 })
  submissionNumber: number;
}
