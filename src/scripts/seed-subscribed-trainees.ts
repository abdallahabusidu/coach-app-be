import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SubscribedTraineesService } from '../subscribed-trainees/services/subscribed-trainees.service';
import { UserService } from '../user/services/user.service';
import { CoachService } from '../coach/services/coach.service';
import { UserRole } from '../auth/entities/user.entity';
import { SubscriptionStatus } from '../dashboard/entities/trainee-progress.entity';
import { FitnessArea, Gender } from 'src/coach/entities/coach-profile.entity';

export async function seedSubscribedTrainees() {
  const app = await NestFactory.create(AppModule);
  const userService = app.get(UserService);
  const coachService = app.get(CoachService);

  console.log(
    '🏃‍♂️ Creating sample coach and trainees for subscribed trainees functionality...',
  );

  try {
    // Create a sample coach if one doesn't exist
    let sampleCoach;
    try {
      const coaches = await userService.findByRole(UserRole.COACH);
      if (coaches.length > 0) {
        sampleCoach = coaches[0];
        console.log(`Using existing coach: ${sampleCoach.email}`);
      }
    } catch (error) {
      // Coach not found, create one
    }

    if (!sampleCoach) {
      // Create sample coach
      const coachData = {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.coach@example.com',
        phone: '+1234567890',
        password: 'password123',
        role: UserRole.COACH,
      };

      sampleCoach = await userService.create(coachData);
      console.log(`✅ Created sample coach: ${sampleCoach.email}`);

      // Create coach profile
      const coachProfileData = {
        bio: 'Certified fitness trainer with 5+ years of experience',
        specialization: 'Weight Loss & Strength Training',
        yearsOfExperience: 5,
        hourlyRate: 75.0,
        certificates: [
          { name: 'NASM-CPT', issuer: 'NASM', year: 2018 },
          { name: 'ACE Certified', issuer: 'ACE', year: 2019 },
        ],
        fitnessAreas: [FitnessArea.BODYBUILDING, FitnessArea.WEIGHT_LOSS],
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        availableHours: { start: '06:00', end: '20:00' },
        isVerified: true,
        onboardingCompleted: true,
        profilePictureUrl: 'https://example.com/profile.jpg',
        gender: Gender.FEMALE,
        age: 34,
        location: 'New York, NY',
      };

      try {
        await coachService.createProfile(sampleCoach.id, coachProfileData);
        console.log(`✅ Created coach profile for: ${sampleCoach.email}`);
      } catch (error) {
        console.log(`ℹ️ Coach profile might already exist: ${error.message}`);
      }
    }

    // Sample trainee data for CSV-like import simulation
    const sampleTrainees = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567891',
        password: 'password123',
        age: 28,
        weight: 80,
        height: 175,
        gender: 'male',
        fitnessGoal: 'weight_loss',
        fitnessLevel: 'beginner',
        bodyShape: 'average',
        targetWeight: 75,
        subscriptionStatus: 'active',
      },
      {
        firstName: 'Emily',
        lastName: 'Smith',
        email: 'emily.smith@example.com',
        phone: '+1234567892',
        password: 'password123',
        age: 32,
        weight: 65,
        height: 162,
        gender: 'female',
        fitnessGoal: 'muscle_gain',
        fitnessLevel: 'intermediate',
        bodyShape: 'athletic',
        targetWeight: 68,
        subscriptionStatus: 'active',
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phone: '+1234567893',
        password: 'password123',
        age: 25,
        weight: 90,
        height: 185,
        gender: 'male',
        fitnessGoal: 'endurance',
        fitnessLevel: 'advanced',
        bodyShape: 'tall',
        targetWeight: 85,
        subscriptionStatus: 'pending',
      },
      {
        firstName: 'Lisa',
        lastName: 'Davis',
        email: 'lisa.davis@example.com',
        phone: '+1234567894',
        password: 'password123',
        age: 29,
        weight: 58,
        height: 158,
        gender: 'female',
        fitnessGoal: 'flexibility',
        fitnessLevel: 'beginner',
        bodyShape: 'petite',
        targetWeight: 60,
        subscriptionStatus: 'active',
      },
      {
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@example.com',
        phone: '+1234567895',
        password: 'password123',
        age: 35,
        weight: 95,
        height: 180,
        gender: 'male',
        fitnessGoal: 'strength_training',
        fitnessLevel: 'intermediate',
        bodyShape: 'muscular',
        targetWeight: 92,
        subscriptionStatus: 'active',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const traineeData of sampleTrainees) {
      try {
        // Check if user already exists
        const existingUser = await userService.findByEmail(traineeData.email);
        if (existingUser) {
          console.log(`⏭️ Skipping existing user: ${traineeData.email}`);
          skippedCount++;
          continue;
        }

        // Create user
        const userData = {
          firstName: traineeData.firstName,
          lastName: traineeData.lastName,
          email: traineeData.email,
          phone: traineeData.phone,
          password: traineeData.password,
          role: UserRole.CLIENT,
        };

        const newUser = await userService.create(userData);

        // Create client profile (this would normally be done through the client module)
        // For now, we'll create it directly via repository
        const clientProfileRepository = app.get(
          'ClientProfileEntityRepository',
        );

        const clientProfile = clientProfileRepository.create({
          userId: newUser.id,
          age: traineeData.age,
          weight: traineeData.weight,
          height: traineeData.height,
          gender: traineeData.gender,
          fitnessGoal: traineeData.fitnessGoal,
          fitnessLevel: traineeData.fitnessLevel,
          bodyShape: traineeData.bodyShape,
          mealsPerDay: 3,
          exerciseFrequency: 4,
          sessionDuration: 60,
          gymAccess: true,
          coachGenderPreference: 'no_preference',
          coachingMode: 'online',
          budget: 'moderate',
          preferredTime: 'evening',
        });

        await clientProfileRepository.save(clientProfile);

        // Create trainee progress record
        const traineeProgressRepository = app.get(
          'TraineeProgressEntityRepository',
        );

        const subscriptionStatus =
          traineeData.subscriptionStatus === 'active'
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.PENDING;

        const traineeProgress = traineeProgressRepository.create({
          traineeId: newUser.id,
          coachId: sampleCoach.coachProfile?.id || sampleCoach.id,
          targetWeight: traineeData.targetWeight,
          subscriptionStatus: subscriptionStatus,
          subscriptionStartDate:
            subscriptionStatus === SubscriptionStatus.ACTIVE
              ? new Date()
              : undefined,
          workoutCompletionPercentage: Math.floor(Math.random() * 100), // Random progress
          totalWorkoutsCompleted: Math.floor(Math.random() * 20),
          progressData: {},
        });

        await traineeProgressRepository.save(traineeProgress);

        console.log(
          `✅ Created trainee: ${traineeData.firstName} ${traineeData.lastName}`,
        );
        createdCount++;
      } catch (error) {
        console.error(
          `❌ Failed to create trainee ${traineeData.firstName} ${traineeData.lastName}:`,
          error.message,
        );
      }
    }

    console.log(`\n📊 Subscribed Trainees Seeding Summary:`);
    console.log(`   ✅ Created: ${createdCount} trainees`);
    console.log(`   ⏭️ Skipped: ${skippedCount} existing trainees`);
    console.log(`   📧 Coach: ${sampleCoach.email}`);
  } catch (error) {
    console.error('❌ Subscribed trainees seeding failed:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedSubscribedTrainees()
    .then(() => {
      console.log('🎉 Subscribed trainees seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Subscribed trainees seeding failed:', error);
      process.exit(1);
    });
}
