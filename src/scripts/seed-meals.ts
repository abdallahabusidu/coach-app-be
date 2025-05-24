import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CreateMealDto } from '../meal/dtos/create-meal.dto';
import { MealType } from '../meal/entities/meal.entity';
import { MealService } from '../meal/services/meal.service';

async function seedMeals() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mealService = app.get(MealService);

  console.log('🌱 Starting meal seeding...');

  const sampleMeals: CreateMealDto[] = [
    // Breakfast meals
    {
      name: 'Protein Power Breakfast',
      description: 'High-protein breakfast bowl with eggs, Greek yogurt, and berries',
      calories: 420,
      protein: 32.5,
      fat: 18.2,
      carbs: 28.8,
      ingredients: [
        '2 large eggs',
        '1/2 cup Greek yogurt',
        '1/4 cup mixed berries',
        '1 tbsp almond butter',
        '1 slice whole grain toast',
        'Spinach leaves'
      ],
      preparation: 'Scramble eggs with spinach. Serve with Greek yogurt topped with berries and a slice of toast with almond butter.',
      imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400',
      mealType: MealType.BREAKFAST
    },
    {
      name: 'Overnight Oats Delight',
      description: 'Nutritious overnight oats with chia seeds, banana, and nuts',
      calories: 380,
      protein: 15.2,
      fat: 12.8,
      carbs: 52.4,
      ingredients: [
        '1/2 cup rolled oats',
        '1 tbsp chia seeds',
        '1 medium banana',
        '2 tbsp chopped walnuts',
        '1 cup almond milk',
        '1 tsp honey',
        '1/2 tsp vanilla extract'
      ],
      preparation: 'Mix oats, chia seeds, almond milk, honey, and vanilla. Refrigerate overnight. Top with sliced banana and walnuts before serving.',
      imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
      mealType: MealType.BREAKFAST
    },
    {
      name: 'Green Smoothie Bowl',
      description: 'Nutrient-packed smoothie bowl with spinach, avocado, and tropical fruits',
      calories: 290,
      protein: 8.5,
      fat: 14.2,
      carbs: 38.6,
      ingredients: [
        '1 cup spinach',
        '1/2 avocado',
        '1/2 frozen banana',
        '1/2 cup mango chunks',
        '1/2 cup coconut milk',
        '1 tbsp hemp seeds',
        '2 tbsp granola'
      ],
      preparation: 'Blend spinach, avocado, banana, mango, and coconut milk until smooth. Pour into bowl and top with hemp seeds and granola.',
      imageUrl: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400',
      mealType: MealType.BREAKFAST
    },

    // Lunch meals
    {
      name: 'Mediterranean Quinoa Bowl',
      description: 'Fresh quinoa bowl with Mediterranean vegetables, feta, and olive oil',
      calories: 485,
      protein: 18.7,
      fat: 22.3,
      carbs: 58.2,
      ingredients: [
        '1 cup cooked quinoa',
        '1/2 cup cherry tomatoes',
        '1/4 cup cucumber',
        '2 oz feta cheese',
        '2 tbsp olives',
        '2 tbsp olive oil',
        '1 tbsp lemon juice',
        'Fresh herbs (parsley, mint)'
      ],
      preparation: 'Combine cooked quinoa with diced vegetables and herbs. Top with crumbled feta and olives. Drizzle with olive oil and lemon juice.',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      mealType: MealType.LUNCH
    },
    {
      name: 'Grilled Chicken & Sweet Potato',
      description: 'Lean grilled chicken breast with roasted sweet potato and vegetables',
      calories: 520,
      protein: 42.8,
      fat: 8.5,
      carbs: 65.2,
      ingredients: [
        '5 oz grilled chicken breast',
        '1 medium roasted sweet potato',
        '1 cup steamed broccoli',
        '1/2 red bell pepper',
        '1 tbsp olive oil',
        'Herbs and spices'
      ],
      preparation: 'Grill seasoned chicken breast. Roast sweet potato and vegetables with olive oil. Serve together with herbs.',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
      mealType: MealType.LUNCH
    },
    {
      name: 'Asian Salmon Salad',
      description: 'Fresh salmon salad with mixed greens, edamame, and sesame dressing',
      calories: 445,
      protein: 35.2,
      fat: 28.8,
      carbs: 18.5,
      ingredients: [
        '4 oz grilled salmon',
        '2 cups mixed greens',
        '1/2 cup edamame',
        '1/4 avocado',
        '2 tbsp sesame seeds',
        '1 tbsp sesame oil',
        '1 tbsp rice vinegar',
        '1 tsp soy sauce'
      ],
      preparation: 'Grill salmon and slice. Toss greens with edamame and avocado. Top with salmon and sesame seeds. Drizzle with sesame dressing.',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
      mealType: MealType.LUNCH
    },

    // Dinner meals
    {
      name: 'Herb-Crusted Cod with Vegetables',
      description: 'Baked cod with herb crust served with roasted Mediterranean vegetables',
      calories: 380,
      protein: 38.2,
      fat: 12.5,
      carbs: 25.8,
      ingredients: [
        '6 oz cod fillet',
        '1/4 cup panko breadcrumbs',
        '1 tbsp fresh herbs',
        '1 zucchini, sliced',
        '1/2 red onion',
        '1 cup cherry tomatoes',
        '2 tbsp olive oil'
      ],
      preparation: 'Coat cod with herb breadcrumb mixture and bake. Roast vegetables with olive oil until tender. Serve together.',
      imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400',
      mealType: MealType.DINNER
    },
    {
      name: 'Turkey & Vegetable Stir-Fry',
      description: 'Lean ground turkey stir-fry with colorful vegetables and brown rice',
      calories: 465,
      protein: 32.5,
      fat: 15.2,
      carbs: 48.8,
      ingredients: [
        '4 oz lean ground turkey',
        '1/2 cup brown rice',
        '1 bell pepper',
        '1 cup snap peas',
        '1/2 onion',
        '2 cloves garlic',
        '1 tbsp coconut oil',
        '2 tbsp low-sodium soy sauce'
      ],
      preparation: 'Cook brown rice. Stir-fry turkey with vegetables in coconut oil. Season with garlic and soy sauce. Serve over rice.',
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
      mealType: MealType.DINNER
    },
    {
      name: 'Lentil Curry with Cauliflower Rice',
      description: 'Protein-rich red lentil curry served over cauliflower rice',
      calories: 385,
      protein: 22.8,
      fat: 8.5,
      carbs: 58.2,
      ingredients: [
        '3/4 cup red lentils',
        '2 cups cauliflower rice',
        '1/2 can coconut milk',
        '1 onion',
        '2 cloves garlic',
        '1 inch ginger',
        '1 tbsp curry powder',
        '1 cup spinach'
      ],
      preparation: 'Sauté onion, garlic, and ginger. Add curry powder, lentils, and coconut milk. Simmer until tender. Stir in spinach. Serve over cauliflower rice.',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      mealType: MealType.DINNER
    },

    // Snacks
    {
      name: 'Greek Yogurt Parfait',
      description: 'Layered Greek yogurt with berries and granola',
      calories: 185,
      protein: 12.5,
      fat: 3.8,
      carbs: 28.2,
      ingredients: [
        '3/4 cup Greek yogurt',
        '1/4 cup mixed berries',
        '2 tbsp granola',
        '1 tsp honey'
      ],
      preparation: 'Layer Greek yogurt with berries and granola in a glass. Drizzle with honey.',
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
      mealType: MealType.SNACKS
    },
    {
      name: 'Hummus & Veggie Plate',
      description: 'Fresh vegetables with homemade hummus',
      calories: 165,
      protein: 7.2,
      fat: 8.5,
      carbs: 18.8,
      ingredients: [
        '1/4 cup hummus',
        '1/2 cucumber, sliced',
        '1/2 bell pepper',
        '5 cherry tomatoes',
        '2 tbsp carrots'
      ],
      preparation: 'Slice fresh vegetables and arrange with hummus for dipping.',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
      mealType: MealType.SNACKS
    },
    {
      name: 'Apple Almond Butter Slices',
      description: 'Crisp apple slices with natural almond butter',
      calories: 195,
      protein: 6.8,
      fat: 12.2,
      carbs: 18.5,
      ingredients: [
        '1 medium apple',
        '2 tbsp almond butter',
        '1 tsp cinnamon'
      ],
      preparation: 'Slice apple and serve with almond butter for dipping. Sprinkle with cinnamon.',
      imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400',
      mealType: MealType.SNACKS
    },

    // Drinks
    {
      name: 'Green Detox Smoothie',
      description: 'Refreshing green smoothie with cucumber, celery, and lemon',
      calories: 120,
      protein: 3.2,
      fat: 1.5,
      carbs: 28.8,
      ingredients: [
        '1/2 cucumber',
        '2 celery stalks',
        '1/2 green apple',
        '1/2 lemon juice',
        '1 cup water',
        '1 tsp fresh ginger',
        'Ice cubes'
      ],
      preparation: 'Blend all ingredients until smooth. Add ice and blend again. Serve immediately.',
      imageUrl: 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400',
      mealType: MealType.DRINKS
    },
    {
      name: 'Post-Workout Protein Shake',
      description: 'Recovery protein shake with banana and berries',
      calories: 285,
      protein: 25.8,
      fat: 4.2,
      carbs: 38.5,
      ingredients: [
        '1 scoop vanilla protein powder',
        '1 banana',
        '1/2 cup mixed berries',
        '1 cup unsweetened almond milk',
        '1 tbsp chia seeds',
        'Ice cubes'
      ],
      preparation: 'Blend protein powder, banana, berries, and almond milk until smooth. Add chia seeds and ice, blend briefly.',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
      mealType: MealType.DRINKS
    },
    {
      name: 'Herbal Iced Tea',
      description: 'Refreshing herbal iced tea with mint and lemon',
      calories: 15,
      protein: 0.2,
      fat: 0.1,
      carbs: 3.8,
      ingredients: [
        '2 herbal tea bags',
        '2 cups water',
        'Fresh mint leaves',
        '1/2 lemon, sliced',
        'Ice cubes',
        '1 tsp honey (optional)'
      ],
      preparation: 'Steep tea bags in hot water for 5 minutes. Cool completely. Add mint, lemon, and ice. Sweeten with honey if desired.',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
      mealType: MealType.DRINKS
    }
  ];

  try {
    console.log(`📝 Creating ${sampleMeals.length} sample meals...`);
    
    for (const meal of sampleMeals) {
      try {
        await mealService.create(meal);
        console.log(`✅ Created meal: ${meal.name}`);
      } catch (error) {
        console.error(`❌ Failed to create meal ${meal.name}:`, error.message);
      }
    }

    console.log('🎉 Meal seeding completed successfully!');
    
    // Display summary statistics
    const stats = await mealService.getStatistics();
    console.log('\n📊 Meal Statistics:');
    console.log(`Total meals: ${stats.totalMeals}`);
    console.log(`Average calories: ${stats.averageCalories}`);
    console.log(`Average protein: ${stats.averageProtein}g`);
    console.log('Meals by type:', stats.mealsByType);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedMeals()
    .then(() => {
      console.log('✨ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seedMeals };
