import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateWorkoutDto } from '../workout/dtos/create-workout.dto';
import {
  WorkoutType,
  DifficultyLevel,
  MediaType,
} from '../workout/entities/workout.entity';
import { WorkoutService } from '../workout/services/workout.service';

export class ExerciseDto {
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  instructions: string;
  duration?: number;
  weight?: number;
}

async function seedWorkouts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const workoutService = app.get(WorkoutService);

  console.log('🏋️ Starting workout seeding...');

  const sampleWorkouts: CreateWorkoutDto[] = [
    // Strength Training Workouts
    {
      name: 'Full Body Strength Training',
      description:
        'A comprehensive full-body strength workout targeting all major muscle groups',
      workoutType: WorkoutType.STRENGTH,
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 60,
      exercises: [
        {
          name: 'Squats',
          sets: 4,
          reps: 12,
          weight: 60,
          restTime: 90,
          instructions:
            'Keep your back straight and lower until thighs are parallel to floor',
        },
        {
          name: 'Deadlifts',
          sets: 4,
          reps: 10,
          weight: 80,
          restTime: 120,
          instructions:
            'Keep the bar close to your body and maintain neutral spine',
        },
        {
          name: 'Bench Press',
          sets: 4,
          reps: 10,
          weight: 70,
          restTime: 90,
          instructions: 'Lower the bar to chest level and press up explosively',
        },
        {
          name: 'Pull-ups',
          sets: 3,
          reps: 8,
          restTime: 90,
          instructions: 'Pull yourself up until chin clears the bar',
        },
      ],
      media: [
        {
          type: MediaType.IMAGE,
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
          title: 'Full Body Workout',
          description: 'Complete strength training setup',
        },
      ],
      caloriesBurned: 400,
      equipment: ['Barbell', 'Dumbbells', 'Pull-up Bar', 'Bench'],
      targetMuscleGroups: ['Legs', 'Back', 'Chest', 'Arms', 'Core'],
    },

    {
      name: 'Upper Body Power',
      description: 'Intense upper body workout focusing on power and strength',
      workoutType: WorkoutType.STRENGTH,
      difficulty: DifficultyLevel.ADVANCED,
      duration: 45,
      exercises: [
        {
          name: 'Overhead Press',
          sets: 5,
          reps: 6,
          weight: 50,
          restTime: 120,
          instructions: 'Press the weight overhead while keeping core tight',
        },
        {
          name: 'Weighted Dips',
          sets: 4,
          reps: 8,
          weight: 20,
          restTime: 90,
          instructions: 'Lower body until elbows are at 90 degrees',
        },
        {
          name: 'Barbell Rows',
          sets: 4,
          reps: 10,
          weight: 65,
          restTime: 90,
          instructions:
            'Pull the bar to your lower chest while squeezing shoulder blades',
        },
      ],
      caloriesBurned: 350,
      equipment: ['Barbell', 'Dip Station', 'Weight Plates'],
      targetMuscleGroups: ['Shoulders', 'Chest', 'Back', 'Arms'],
    },

    // Cardio Workouts
    {
      name: 'HIIT Cardio Blast',
      description: 'High-intensity interval training for maximum calorie burn',
      workoutType: WorkoutType.CARDIO,
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 30,
      exercises: [
        {
          name: 'Burpees',
          sets: 6,
          reps: 10,
          restTime: 30,
          instructions: 'Jump down, push-up, jump back up with arms overhead',
        },
        {
          name: 'Mountain Climbers',
          sets: 6,
          reps: 20,
          restTime: 30,
          instructions: 'Alternate bringing knees to chest in plank position',
        },
        {
          name: 'Jump Squats',
          sets: 6,
          reps: 15,
          restTime: 30,
          instructions: 'Squat down and explode up into a jump',
        },
        {
          name: 'High Knees',
          sets: 6,
          reps: 30,
          restTime: 30,
          instructions: 'Run in place bringing knees up to waist level',
        },
      ],
      media: [
        {
          type: MediaType.VIDEO,
          url: 'https://example.com/hiit-demo.mp4',
          title: 'HIIT Workout Demo',
          description: 'Complete demonstration of HIIT exercises',
        },
      ],
      caloriesBurned: 450,
      equipment: ['None'],
      targetMuscleGroups: ['Full Body', 'Core', 'Legs'],
    },

    {
      name: 'Beginner Cardio Routine',
      description: 'Perfect starting point for cardio fitness',
      workoutType: WorkoutType.CARDIO,
      difficulty: DifficultyLevel.BEGINNER,
      duration: 25,
      exercises: [
        {
          name: 'Marching in Place',
          sets: 3,
          reps: 60,
          restTime: 60,
          instructions: 'March in place lifting knees to comfortable height',
        },
        {
          name: 'Step-ups',
          sets: 3,
          reps: 20,
          restTime: 60,
          instructions: 'Step up onto platform alternating legs',
        },
        {
          name: 'Wall Push-ups',
          sets: 3,
          reps: 12,
          restTime: 60,
          instructions:
            'Push-ups against the wall to build upper body strength',
        },
        {
          name: 'Seated Leg Extensions',
          sets: 3,
          reps: 15,
          restTime: 45,
          instructions: 'Extend legs while seated to strengthen quadriceps',
        },
      ],
      caloriesBurned: 200,
      equipment: ['Step Platform', 'Chair'],
      targetMuscleGroups: ['Legs', 'Arms', 'Core'],
    },

    // Flexibility Workouts
    {
      name: 'Morning Yoga Flow',
      description:
        'Gentle yoga sequence to start your day with energy and focus',
      workoutType: WorkoutType.FLEXIBILITY,
      difficulty: DifficultyLevel.BEGINNER,
      duration: 20,
      exercises: [
        {
          name: 'Cat-Cow Stretch',
          sets: 1,
          reps: 10,
          restTime: 0,
          instructions: 'Alternate between arching and rounding your back',
        },
        {
          name: 'Downward Dog',
          sets: 3,
          reps: 1,
          duration: 30,
          restTime: 15,
          instructions:
            'Hold inverted V position, pressing hands and feet into ground',
        },
        {
          name: 'Warrior I',
          sets: 2,
          reps: 1,
          duration: 30,
          restTime: 15,
          instructions: 'Lunge position with arms overhead, hold each side',
        },
        {
          name: "Child's Pose",
          sets: 1,
          reps: 1,
          duration: 60,
          restTime: 0,
          instructions:
            'Kneel and stretch arms forward, rest forehead on ground',
        },
      ],
      media: [
        {
          type: MediaType.PDF,
          url: 'https://example.com/yoga-guide.pdf',
          title: 'Yoga Poses Guide',
          description: 'Visual guide to proper yoga form',
        },
      ],
      caloriesBurned: 120,
      equipment: ['Yoga Mat'],
      targetMuscleGroups: ['Full Body', 'Core', 'Back'],
    },

    {
      name: 'Deep Stretch Recovery',
      description: 'Restorative stretching session for muscle recovery',
      workoutType: WorkoutType.FLEXIBILITY,
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 35,
      exercises: [
        {
          name: 'Pigeon Pose',
          sets: 2,
          reps: 1,
          duration: 60,
          restTime: 30,
          instructions: 'Hip flexor stretch, hold each side for full duration',
        },
        {
          name: 'Seated Forward Fold',
          sets: 3,
          reps: 1,
          duration: 45,
          restTime: 15,
          instructions: 'Fold forward over extended legs, reach for toes',
        },
        {
          name: 'Spinal Twist',
          sets: 2,
          reps: 1,
          duration: 30,
          restTime: 15,
          instructions: 'Seated twist, hold each direction',
        },
        {
          name: 'Legs Up Wall',
          sets: 1,
          reps: 1,
          duration: 300,
          restTime: 0,
          instructions: 'Lie on back with legs up against wall for relaxation',
        },
      ],
      caloriesBurned: 100,
      equipment: ['Yoga Mat', 'Wall', 'Yoga Blocks'],
      targetMuscleGroups: ['Hips', 'Hamstrings', 'Back', 'Shoulders'],
    },

    // Additional Strength Workout
    {
      name: 'Functional Movement Training',
      description: 'Real-world movement patterns for everyday strength',
      workoutType: WorkoutType.STRENGTH,
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: 50,
      exercises: [
        {
          name: 'Turkish Get-ups',
          sets: 3,
          reps: 5,
          weight: 16,
          restTime: 90,
          instructions:
            'Complex movement from lying to standing with weight overhead',
        },
        {
          name: "Farmer's Walk",
          sets: 4,
          reps: 1,
          weight: 32,
          duration: 60,
          restTime: 90,
          instructions: 'Walk while carrying heavy weights at your sides',
        },
        {
          name: 'Single-leg Deadlifts',
          sets: 3,
          reps: 8,
          weight: 24,
          restTime: 60,
          instructions: 'Balance on one leg while hinging at hip',
        },
        {
          name: 'Plank to Push-up',
          sets: 3,
          reps: 12,
          restTime: 60,
          instructions: 'Transition from forearm plank to full plank position',
        },
      ],
      caloriesBurned: 380,
      equipment: ['Kettlebells', 'Dumbbells'],
      targetMuscleGroups: ['Full Body', 'Core', 'Stability'],
    },

    // Advanced Cardio
    {
      name: 'Sprint Interval Training',
      description: 'High-intensity sprints for athletic performance',
      workoutType: WorkoutType.CARDIO,
      difficulty: DifficultyLevel.ADVANCED,
      duration: 40,
      exercises: [
        {
          name: 'Sprint Intervals',
          sets: 8,
          reps: 1,
          duration: 30,
          restTime: 90,
          instructions: 'All-out sprint for 30 seconds, rest 90 seconds',
        },
        {
          name: 'Plyometric Jumps',
          sets: 4,
          reps: 10,
          restTime: 60,
          instructions: 'Explosive jumps onto box or platform',
        },
        {
          name: 'Battle Ropes',
          sets: 4,
          reps: 1,
          duration: 45,
          restTime: 75,
          instructions: 'Alternate arm waves with heavy ropes',
        },
      ],
      caloriesBurned: 550,
      equipment: ['Track/Treadmill', 'Plyometric Box', 'Battle Ropes'],
      targetMuscleGroups: ['Legs', 'Core', 'Cardiovascular System'],
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const workoutData of sampleWorkouts) {
    try {
      const existingWorkout = await workoutService.findAll({
        page: 1,
        limit: 1,
        search: workoutData.name,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      // Check if workout with exact name already exists
      const workoutExists = existingWorkout.workouts.some(
        (w) => w.name.toLowerCase() === workoutData.name.toLowerCase(),
      );

      if (workoutExists) {
        console.log(`⏭️  Skipping existing workout: ${workoutData.name}`);
        skippedCount++;
        continue;
      }

      const workout = await workoutService.create(workoutData);
      console.log(
        `✅ Created workout: ${workout.name} (${workout.workoutType})`,
      );
      createdCount++;
    } catch (error) {
      console.error(
        `❌ Failed to create workout "${workoutData.name}":`,
        error.message,
      );
    }
  }

  console.log(`\n📊 Workout seeding summary:`);
  console.log(`✅ Created: ${createdCount} workouts`);
  console.log(`⏭️  Skipped: ${skippedCount} workouts (already exist)`);
  console.log(`📋 Total sample workouts: ${sampleWorkouts.length}`);

  await app.close();
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedWorkouts()
    .then(() => {
      console.log('✨ Workout seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Workout seeding process failed:', error);
      process.exit(1);
    });
}

export { seedWorkouts };
