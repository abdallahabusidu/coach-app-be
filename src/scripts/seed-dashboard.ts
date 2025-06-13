import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DailyQuoteService } from '../dashboard/services/daily-quote.service';
import { DashboardStatsService } from '../dashboard/services/dashboard-stats.service';
import { CreateQuoteDto } from '../dashboard/dtos/create-quote.dto';
import { UserRole } from '../auth/entities/user.entity';
import { UserService } from '../user/services/user.service';
import { CoachService } from '../coach/services/coach.service';
import {
  SubscriptionStatus,
  ActivityType,
} from '../dashboard/entities/trainee-progress.entity';

async function seedDashboard() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dailyQuoteService = app.get(DailyQuoteService);
  const dashboardStatsService = app.get(DashboardStatsService);
  const userService = app.get(UserService);
  const coachService = app.get(CoachService);

  console.log('📊 Starting dashboard seeding...');

  try {
    // 1. Seed Quotes
    console.log('\n💬 Seeding motivational quotes...');
    await seedQuotes(dailyQuoteService);

    // 2. Seed Sample Trainee Progress Data
    console.log('\n🏃 Seeding trainee progress data...');
    await seedTraineeProgress(dashboardStatsService, userService, coachService);

    console.log('\n✨ Dashboard seeding completed successfully!');
  } catch (error) {
    console.error('💥 Dashboard seeding failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

async function seedQuotes(dailyQuoteService: DailyQuoteService) {
  const sampleQuotes: CreateQuoteDto[] = [
    {
      text: 'The only impossible journey is the one you never begin.',
      author: 'Tony Robbins',
      category: 'motivation',
    },
    {
      text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
      author: 'Winston Churchill',
      category: 'success',
    },
    {
      text: "Take care of your body. It's the only place you have to live.",
      author: 'Jim Rohn',
      category: 'fitness',
    },
    {
      text: 'The groundwork for all happiness is good health.',
      author: 'Leigh Hunt',
      category: 'health',
    },
    {
      text: 'A year from now you may wish you had started today.',
      author: 'Karen Lamb',
      category: 'motivation',
    },
    {
      text: 'The difference between ordinary and extraordinary is that little extra.',
      author: 'Jimmy Johnson',
      category: 'excellence',
    },
    {
      text: "Your body can do almost anything. It's your mind you have to convince.",
      author: 'Unknown',
      category: 'mindset',
    },
    {
      text: 'Strength does not come from physical capacity. It comes from an indomitable will.',
      author: 'Mahatma Gandhi',
      category: 'strength',
    },
    {
      text: 'The first wealth is health.',
      author: 'Ralph Waldo Emerson',
      category: 'health',
    },
    {
      text: 'Champions train, losers complain.',
      author: 'Unknown',
      category: 'training',
    },
    {
      text: "Don't limit your challenges, challenge your limits.",
      author: 'Unknown',
      category: 'challenges',
    },
    {
      text: 'The pain you feel today will be the strength you feel tomorrow.',
      author: 'Unknown',
      category: 'perseverance',
    },
    {
      text: "If you want something you've never had, you must be willing to do something you've never done.",
      author: 'Thomas Jefferson',
      category: 'change',
    },
    {
      text: "Believe you can and you're halfway there.",
      author: 'Theodore Roosevelt',
      category: 'belief',
    },
    {
      text: 'The journey of a thousand miles begins with one step.',
      author: 'Lao Tzu',
      category: 'beginning',
    },
    {
      text: 'It is never too late to be what you might have been.',
      author: 'George Eliot',
      category: 'potential',
    },
    {
      text: "Your limitation—it's only your imagination.",
      author: 'Unknown',
      category: 'mindset',
    },
    {
      text: 'Push yourself because no one else is going to do it for you.',
      author: 'Unknown',
      category: 'self-motivation',
    },
    {
      text: 'Great things never come from comfort zones.',
      author: 'Unknown',
      category: 'comfort-zone',
    },
    {
      text: 'Dream it. Wish it. Do it.',
      author: 'Unknown',
      category: 'action',
    },
    {
      text: "Success doesn't just find you. You have to go out and get it.",
      author: 'Unknown',
      category: 'success',
    },
    {
      text: "The harder you work for something, the greater you'll feel when you achieve it.",
      author: 'Unknown',
      category: 'achievement',
    },
    {
      text: 'Dream bigger. Do bigger.',
      author: 'Unknown',
      category: 'dreams',
    },
    {
      text: "Don't stop when you're tired. Stop when you're done.",
      author: 'Unknown',
      category: 'persistence',
    },
    {
      text: 'Wake up with determination. Go to bed with satisfaction.',
      author: 'Unknown',
      category: 'daily-motivation',
    },
    {
      text: 'Do something today that your future self will thank you for.',
      author: 'Sean Patrick Flanery',
      category: 'future',
    },
    {
      text: 'Little things make big days.',
      author: 'Unknown',
      category: 'small-steps',
    },
    {
      text: "It's going to be hard, but hard does not mean impossible.",
      author: 'Unknown',
      category: 'difficulty',
    },
    {
      text: "Don't wish it were easier; wish you were better.",
      author: 'Jim Rohn',
      category: 'self-improvement',
    },
    {
      text: 'You are never too old to set another goal or to dream a new dream.',
      author: 'C.S. Lewis',
      category: 'goals',
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const quoteData of sampleQuotes) {
    try {
      // Check if quote already exists
      const existingQuotes = await dailyQuoteService.getAllQuotes();
      const quoteExists = existingQuotes.some(
        (q) => q.text.toLowerCase() === quoteData.text.toLowerCase(),
      );

      if (quoteExists) {
        console.log(
          `⏭️  Skipping existing quote: "${quoteData.text.substring(0, 50)}..."`,
        );
        skippedCount++;
        continue;
      }

      const quote = await dailyQuoteService.createQuote(quoteData);
      console.log(
        `✅ Created quote: "${quote.text.substring(0, 50)}..." - ${quote.author}`,
      );
      createdCount++;
    } catch (error) {
      console.error(
        `❌ Failed to create quote "${quoteData.text.substring(0, 30)}...":`,
        error.message,
      );
    }
  }

  console.log(`\n📊 Quote seeding summary:`);
  console.log(`✅ Created: ${createdCount} quotes`);
  console.log(`⏭️  Skipped: ${skippedCount} quotes (already exist)`);
  console.log(`📋 Total sample quotes: ${sampleQuotes.length}`);
}

async function seedTraineeProgress(
  dashboardStatsService: DashboardStatsService,
  userService: UserService,
  coachService: CoachService,
) {
  try {
    // Get a sample coach (create one if doesn't exist)
    const coaches = await coachService.findVerifiedCoaches();

    if (coaches.length === 0) {
      console.log('⚠️  No coaches found. Skipping trainee progress seeding.');
      return;
    }

    const sampleCoach = coaches[0];
    console.log(`📋 Using coach: ${sampleCoach.id}`);

    // Create sample trainee progress data
    const sampleProgressData = [
      {
        traineeId: '550e8400-e29b-41d4-a716-446655440001',
        workoutCompletionPercentage: 75.5,
        totalWorkoutsCompleted: 15,
        currentWeight: 72.5,
        targetWeight: 70.0,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: new Date('2025-05-01'),
        subscriptionEndDate: new Date('2025-08-01'),
        lastActivityDate: new Date('2025-06-12'),
        lastActivityType: ActivityType.WORKOUT_COMPLETED,
        notes: 'Great progress this week! Showing consistent improvement.',
        progressData: {
          weeklyGoals: {
            workouts: 4,
            achieved: 3,
          },
          measurements: [
            { date: '2025-06-01', weight: 74.0 },
            { date: '2025-06-08', weight: 73.2 },
            { date: '2025-06-12', weight: 72.5 },
          ],
          achievements: [
            {
              type: 'milestone',
              description: 'Completed 15 workouts',
              date: '2025-06-10',
            },
          ],
        },
      },
      {
        traineeId: '550e8400-e29b-41d4-a716-446655440002',
        workoutCompletionPercentage: 50.0,
        totalWorkoutsCompleted: 8,
        currentWeight: 68.0,
        targetWeight: 65.0,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: new Date('2025-05-15'),
        subscriptionEndDate: new Date('2025-08-15'),
        lastActivityDate: new Date('2025-06-11'),
        lastActivityType: ActivityType.MEAL_LOGGED,
        notes: 'Good nutrition tracking, needs to increase workout frequency.',
        progressData: {
          weeklyGoals: {
            workouts: 3,
            achieved: 2,
          },
          measurements: [
            { date: '2025-05-15', weight: 69.5 },
            { date: '2025-06-01', weight: 68.8 },
            { date: '2025-06-11', weight: 68.0 },
          ],
        },
      },
      {
        traineeId: '550e8400-e29b-41d4-a716-446655440003',
        workoutCompletionPercentage: 90.0,
        totalWorkoutsCompleted: 27,
        currentWeight: 75.0,
        targetWeight: 78.0,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionStartDate: new Date('2025-04-01'),
        subscriptionEndDate: new Date('2025-10-01'),
        lastActivityDate: new Date('2025-06-13'),
        lastActivityType: ActivityType.GOAL_ACHIEVED,
        notes: 'Excellent commitment! Exceeding all expectations.',
        progressData: {
          weeklyGoals: {
            workouts: 5,
            achieved: 5,
          },
          measurements: [
            { date: '2025-04-01', weight: 72.0 },
            { date: '2025-05-01', weight: 73.5 },
            { date: '2025-06-01', weight: 74.2 },
            { date: '2025-06-13', weight: 75.0 },
          ],
          achievements: [
            {
              type: 'strength',
              description: 'Increased bench press by 20kg',
              date: '2025-06-05',
            },
            {
              type: 'consistency',
              description: '30 days workout streak',
              date: '2025-06-10',
            },
          ],
        },
      },
    ];

    let createdCount = 0;

    for (const progressData of sampleProgressData) {
      try {
        await dashboardStatsService.updateTraineeProgress(
          progressData.traineeId,
          sampleCoach.id,
          progressData,
        );
        console.log(
          `✅ Created progress for trainee: ${progressData.traineeId}`,
        );
        createdCount++;
      } catch (error) {
        console.log(
          `⚠️  Skipping trainee progress for ${progressData.traineeId}: ${error.message}`,
        );
      }
    }

    console.log(`\n📊 Trainee progress seeding summary:`);
    console.log(`✅ Created: ${createdCount} progress records`);
    console.log(`📋 Total sample records: ${sampleProgressData.length}`);
  } catch (error) {
    console.error('❌ Failed to seed trainee progress:', error.message);
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDashboard()
    .then(() => {
      console.log('✨ Dashboard seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Dashboard seeding process failed:', error);
      process.exit(1);
    });
}

export { seedDashboard };
