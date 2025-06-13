import { ApiProperty } from '@nestjs/swagger';
import { QuoteEntity } from '../entities/quote.entity';
import { TraineeProgressEntity } from '../entities/trainee-progress.entity';

export class DashboardWelcomeResponseDto {
  @ApiProperty({
    description: 'Daily motivational quote',
    type: QuoteEntity,
  })
  quote: QuoteEntity;

  @ApiProperty({
    description: 'Personalized welcome message',
    example: 'Good morning, Coach! Ready to inspire your trainees today?',
  })
  welcomeMessage: string;

  @ApiProperty({
    description: 'Current date',
    example: '2025-06-13',
  })
  date: string;
}

export class DashboardStatsResponseDto {
  @ApiProperty({
    description: 'Number of subscribed trainees',
    example: 25,
  })
  subscribedTrainees: number;

  @ApiProperty({
    description: 'Number of unread messages',
    example: 3,
  })
  unreadMessages: number;

  @ApiProperty({
    description: 'Number of new trainee requests',
    example: 2,
  })
  newTraineeRequests: number;

  @ApiProperty({
    description: 'Total active trainees',
    example: 25,
  })
  totalActiveTrainees: number;

  @ApiProperty({
    description: 'Total monthly revenue',
    example: 2500.0,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Weekly statistics',
    type: 'object',
    properties: {
      newSubscriptions: { type: 'number', example: 3 },
      completedWorkouts: { type: 'number', example: 45 },
      messagesExchanged: { type: 'number', example: 28 },
    },
  })
  weeklyStats: {
    newSubscriptions: number;
    completedWorkouts: number;
    messagesExchanged: number;
  };

  @ApiProperty({
    description: 'Monthly growth metrics',
    type: 'object',
    properties: {
      subscribersGrowth: { type: 'number', example: 15.5 },
      revenueGrowth: { type: 'number', example: 12.3 },
    },
  })
  monthlyGrowth: {
    subscribersGrowth: number;
    revenueGrowth: number;
  };
}

export class TraineeWithProgressResponseDto {
  @ApiProperty({
    description: 'Trainee progress data',
    type: TraineeProgressEntity,
  })
  trainee: TraineeProgressEntity;

  @ApiProperty({
    description: 'Recent activity summary',
    type: 'object',
    properties: {
      workoutsCompleted: { type: 'number', example: 12 },
      lastActivity: { type: 'string', format: 'date-time' },
      weeklyGoalProgress: { type: 'number', example: 75 },
      achievements: { type: 'array', items: { type: 'object' } },
    },
  })
  recentActivity: {
    workoutsCompleted: number;
    lastActivity: Date;
    weeklyGoalProgress: number;
    achievements: any[];
  };
}

export class TraineeListResponseDto {
  @ApiProperty({
    description: 'List of trainees with progress',
    type: [TraineeWithProgressResponseDto],
  })
  trainees: TraineeWithProgressResponseDto[];

  @ApiProperty({
    description: 'Total number of trainees',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total pages',
    example: 2,
  })
  totalPages: number;
}

export class QuoteStatsResponseDto {
  @ApiProperty({
    description: 'Total number of quotes',
    example: 150,
  })
  totalQuotes: number;

  @ApiProperty({
    description: 'Number of active quotes',
    example: 145,
  })
  activeQuotes: number;

  @ApiProperty({
    description: 'Quote counts by category',
    example: {
      motivation: 50,
      success: 30,
      fitness: 25,
      mindset: 40,
    },
  })
  categoryCounts: Record<string, number>;

  @ApiProperty({
    description: 'Most served quote',
    type: QuoteEntity,
    nullable: true,
  })
  mostServedQuote: QuoteEntity | null;
}
