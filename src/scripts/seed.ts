import { seedMeals } from './seed-meals';

async function runAllSeeds() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Run meal seeding
    console.log('🍽️  Running meal seeding...');
    await seedMeals();
    
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
