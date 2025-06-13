import { seedMeals } from './seed-meals';
import { seedWorkouts } from './seed-workouts';
import { seedDashboard } from './seed-dashboard';
import { seedNotifications } from './seed-notifications';

async function runAllSeeds() {
  console.log('🌱 Starting database seeding...\n');
  try {
    // Run meal seeding
    console.log('🍽️  Running meal seeding...');
    await seedMeals();

    // Run workout seeding
    console.log('\n🏋️  Running workout seeding...');
    await seedWorkouts();

    // Run dashboard seeding
    console.log('\n📊 Running dashboard seeding...');
    await seedDashboard();

    // Run notification seeding
    console.log('\n🔔 Running notification seeding...');
    await seedNotifications();

    console.log('\n✨ All seeding completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllSeeds()
    .then(() => {
      console.log('🎉 Database seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}
