import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductService } from '../payments/services/product.service';
import {
  ProductType,
  ProductStatus,
} from '../payments/entities/product.entity';
import {
  SubscriptionPlan,
  BillingCycle,
} from '../payments/entities/subscription.entity';
import { PaymentMethod, Currency } from '../payments/entities/payment.entity';

async function seedProducts() {
  console.log('🌱 Seeding payment products...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const productService = app.get(ProductService);

  try {
    // Subscription Products
    const subscriptionProducts = [
      {
        name: 'Basic Coaching',
        description:
          'Essential coaching features to get you started on your fitness journey',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: SubscriptionPlan.BASIC,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 9.99,
        currency: Currency.USD,
        trialDays: 0,
        appleProductId: 'com.coachapp.basic.monthly',
        googleProductId: 'basic_monthly',
        stripePriceId: 'price_basic_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxCoaches: 1,
          unlimitedMessaging: false,
          customWorkouts: false,
          nutritionPlanning: false,
          progressTracking: true,
          liveVideo: false,
          prioritySupport: false,
          apiAccess: false,
          dataExport: false,
          customBranding: false,
        },
        limitations: {
          monthlyMessages: 50,
          monthlyWorkouts: 10,
          storageGB: 1,
          videoMinutes: 0,
          apiCalls: 0,
        },
        categories: ['fitness', 'basic', 'starter'],
        targetAudience: ['beginners', 'budget-conscious'],
        coachRevenueShare: 70.0,
      },
      {
        name: 'Premium Coaching',
        description:
          'Complete coaching experience with advanced features and unlimited access',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: SubscriptionPlan.PREMIUM,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 29.99,
        currency: Currency.USD,
        trialDays: 7,
        appleProductId: 'com.coachapp.premium.monthly',
        googleProductId: 'premium_monthly',
        stripePriceId: 'price_premium_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxCoaches: 3,
          unlimitedMessaging: true,
          customWorkouts: true,
          nutritionPlanning: true,
          progressTracking: true,
          liveVideo: true,
          prioritySupport: false,
          apiAccess: false,
          dataExport: true,
          customBranding: false,
        },
        limitations: {
          monthlyMessages: -1, // Unlimited
          monthlyWorkouts: 100,
          storageGB: 10,
          videoMinutes: 300,
          apiCalls: 1000,
        },
        categories: ['fitness', 'premium', 'popular'],
        targetAudience: ['serious-athletes', 'fitness-enthusiasts'],
        coachRevenueShare: 70.0,
      },
      {
        name: 'Pro Coaching',
        description:
          'Professional-grade coaching platform with all features and priority support',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: SubscriptionPlan.PRO,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 59.99,
        currency: Currency.USD,
        trialDays: 14,
        appleProductId: 'com.coachapp.pro.monthly',
        googleProductId: 'pro_monthly',
        stripePriceId: 'price_pro_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxCoaches: -1, // Unlimited
          unlimitedMessaging: true,
          customWorkouts: true,
          nutritionPlanning: true,
          progressTracking: true,
          liveVideo: true,
          prioritySupport: true,
          apiAccess: true,
          dataExport: true,
          customBranding: true,
        },
        limitations: {
          monthlyMessages: -1, // Unlimited
          monthlyWorkouts: -1, // Unlimited
          storageGB: 100,
          videoMinutes: -1, // Unlimited
          apiCalls: 10000,
        },
        categories: ['fitness', 'professional', 'premium'],
        targetAudience: ['professional-athletes', 'coaches', 'gyms'],
        coachRevenueShare: 75.0, // Higher share for pro tier
      },
    ];

    // Yearly subscription variants
    const yearlyProducts = subscriptionProducts.map((product) => ({
      ...product,
      name: product.name + ' (Yearly)',
      description: product.description + ' - Save 20% with yearly billing',
      billingCycle: BillingCycle.YEARLY,
      basePrice: product.basePrice * 12 * 0.8, // 20% discount
      appleProductId: product.appleProductId!.replace('monthly', 'yearly'),
      googleProductId: product.googleProductId!.replace('monthly', 'yearly'),
      stripePriceId: product.stripePriceId!.replace('monthly', 'yearly'),
      trialDays: product.trialDays! * 2, // Double trial for yearly
    }));

    // One-time purchase products
    const oneTimeProducts = [
      {
        name: '30-Day Workout Challenge',
        description:
          'Intensive 30-day workout program with daily exercises and progress tracking',
        type: ProductType.WORKOUT_PLAN,
        basePrice: 19.99,
        currency: Currency.USD,
        appleProductId: 'com.coachapp.workout30day',
        googleProductId: 'workout_30_day',
        stripePriceId: 'price_workout_30_day',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          duration: 30,
          sessions: 30,
          customWorkouts: true,
          progressTracking: true,
        },
        categories: ['workout', 'challenge', 'one-time'],
        targetAudience: ['beginners', 'challenge-seekers'],
        coachRevenueShare: 70.0,
      },
      {
        name: 'Nutrition Masterclass',
        description:
          'Comprehensive nutrition course with meal plans and dietary guidelines',
        type: ProductType.NUTRITION_PLAN,
        basePrice: 24.99,
        currency: Currency.USD,
        appleProductId: 'com.coachapp.nutrition.masterclass',
        googleProductId: 'nutrition_masterclass',
        stripePriceId: 'price_nutrition_masterclass',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          duration: 60,
          nutritionPlanning: true,
          customWorkouts: false,
        },
        categories: ['nutrition', 'course', 'education'],
        targetAudience: ['health-conscious', 'nutrition-focused'],
        coachRevenueShare: 70.0,
      },
      {
        name: 'Personal Training Session',
        description:
          'One-on-one personal training session with certified coach',
        type: ProductType.PERSONAL_TRAINING,
        basePrice: 89.99,
        currency: Currency.USD,
        isStoreCompliant: false, // Real-world service
        allowedPaymentMethods: [
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
          PaymentMethod.CREDIT_CARD,
        ],
        features: {
          duration: 60,
          sessions: 1,
          liveVideo: true,
          customWorkouts: true,
        },
        categories: ['training', 'personal', 'live'],
        targetAudience: ['serious-athletes', 'personal-attention'],
        coachRevenueShare: 80.0, // Higher share for personal services
      },
    ];

    // Physical products (not store compliant)
    const physicalProducts = [
      {
        name: 'Resistance Bands Set',
        description:
          'Professional resistance bands set with multiple resistance levels',
        type: ProductType.EQUIPMENT,
        basePrice: 29.99,
        currency: Currency.USD,
        isStoreCompliant: false,
        allowedPaymentMethods: [
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
          PaymentMethod.CREDIT_CARD,
        ],
        features: {
          equipment: ['resistance-bands', 'door-anchor', 'handles'],
        },
        categories: ['equipment', 'physical', 'home-gym'],
        targetAudience: ['home-fitness', 'equipment-buyers'],
        coachRevenueShare: 60.0, // Lower share for physical products
        metadata: {
          weight: 1.5,
          dimensions: { length: 30, width: 20, height: 5 },
          shippingRequired: true,
        },
      },
      {
        name: 'Premium Protein Supplement',
        description:
          'High-quality whey protein supplement for muscle building and recovery',
        type: ProductType.SUPPLEMENT,
        basePrice: 49.99,
        currency: Currency.USD,
        isStoreCompliant: false,
        allowedPaymentMethods: [
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
          PaymentMethod.CREDIT_CARD,
        ],
        features: {
          supplements: ['whey-protein', 'bcaa', 'vitamins'],
        },
        categories: ['supplements', 'physical', 'nutrition'],
        targetAudience: ['bodybuilders', 'athletes', 'supplement-users'],
        coachRevenueShare: 50.0, // Lower share for supplements
        metadata: {
          weight: 2.0,
          dimensions: { length: 15, width: 15, height: 20 },
          shippingRequired: true,
        },
      },
    ];

    // Create all products
    const allProducts = [
      ...subscriptionProducts,
      ...yearlyProducts,
      ...oneTimeProducts,
      ...physicalProducts,
    ];

    console.log(`Creating ${allProducts.length} products...`);

    for (const productData of allProducts) {
      try {
        const product = await productService.createProduct(productData as any);

        // Activate the product immediately
        await productService.activateProduct(product.id);

        console.log(`✅ Created and activated: ${productData.name}`);
      } catch (error) {
        console.error(
          `❌ Failed to create ${productData.name}:`,
          error.message,
        );
      }
    }

    console.log('🎉 Product seeding completed!');

    // Print summary
    const products = await productService.getProducts({ limit: 100 });

    console.log('\n📊 Product Summary:');
    console.log(`Total products: ${products.total}`);

    const byType = products.products.reduce(
      (acc, product) => {
        acc[product.type] = (acc[product.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('By type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });

    const storeCompliant = products.products.filter(
      (p) => p.isStoreCompliant,
    ).length;
    console.log(`\nStore compliant: ${storeCompliant}/${products.total}`);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await app.close();
  }
}

// Run the seeder
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}
