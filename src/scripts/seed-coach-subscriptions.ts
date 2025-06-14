import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductService } from '../payments/services/product.service';
import {
  ProductType,
  ProductStatus,
} from '../payments/entities/product.entity';
import {
  CoachSubscriptionPlan,
  BillingCycle,
} from '../payments/entities/coach-subscription.entity';
import { PaymentMethod, Currency } from '../payments/entities/payment.entity';

async function seedCoachSubscriptionProducts() {
  console.log('🌱 Seeding coach subscription products...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const productService = app.get(ProductService);

  try {
    // Coach Subscription Products
    const coachSubscriptionProducts = [
      {
        name: 'Coach Starter Plan',
        description:
          'Perfect for new coaches getting started with their coaching business. Includes essential tools to manage up to 10 clients.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.STARTER,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 29.0,
        currency: Currency.USD,
        trialDays: 7,
        appleProductId: 'com.coachapp.coach.starter.monthly',
        googleProductId: 'coach_starter_monthly',
        stripePriceId: 'price_coach_starter_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxActiveClients: 10,
          clientProgressTracking: true,
          customWorkoutBuilder: true,
          nutritionPlanCreator: false,
          progressPhotoStorage: 1,
          videoExerciseLibrary: true,
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          monthlyMessages: 100,
          videoCallMinutes: 300,
          groupChatRooms: 1,
          pushNotifications: true,
          basicAnalytics: true,
          storageGB: 5,
          bandwidthGB: 50,
          apiCallsPerMonth: 1000,
        },
        limitations: {
          maxActiveClients: 10,
          monthlyMessages: 100,
          videoCallMinutes: 300,
          storageGB: 5,
          apiCalls: 1000,
        },
        categories: ['coaching', 'subscription', 'starter', 'monthly'],
        targetAudience: ['new-coaches', 'individual-trainers', 'side-hustle'],
        coachRevenueShare: 75.0, // Platform takes 25%
        metadata: {
          planType: 'coach_subscription',
          targetMarket: 'individual_coaches',
          businessModel: 'b2b',
          features: [
            'Client Management',
            'Workout Builder',
            'Progress Tracking',
            'Basic Analytics',
            'Payment Integration',
            'Scheduling',
          ],
        },
      },
      {
        name: 'Coach Starter Plan (Quarterly)',
        description:
          'Save 14% with quarterly billing. Perfect for new coaches committed to growing their business.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.STARTER,
        billingCycle: BillingCycle.QUARTERLY,
        basePrice: 75.0, // ~14% discount
        currency: Currency.USD,
        trialDays: 7,
        appleProductId: 'com.coachapp.coach.starter.quarterly',
        googleProductId: 'coach_starter_quarterly',
        stripePriceId: 'price_coach_starter_quarterly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        categories: [
          'coaching',
          'subscription',
          'starter',
          'quarterly',
          'savings',
        ],
        targetAudience: ['new-coaches', 'budget-conscious'],
        coachRevenueShare: 75.0,
      },
      {
        name: 'Coach Starter Plan (Yearly)',
        description:
          'Maximum savings with yearly billing. Ideal for committed new coaches building their practice.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.STARTER,
        billingCycle: BillingCycle.YEARLY,
        basePrice: 280.0, // ~20% discount
        currency: Currency.USD,
        trialDays: 14,
        appleProductId: 'com.coachapp.coach.starter.yearly',
        googleProductId: 'coach_starter_yearly',
        stripePriceId: 'price_coach_starter_yearly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        categories: [
          'coaching',
          'subscription',
          'starter',
          'yearly',
          'best-value',
        ],
        targetAudience: ['new-coaches', 'committed-growth'],
        coachRevenueShare: 75.0,
      },

      // Professional Plan
      {
        name: 'Coach Professional Plan',
        description:
          'For established coaches scaling their business. Includes advanced features and can manage up to 50 clients.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 79.0,
        currency: Currency.USD,
        trialDays: 14,
        appleProductId: 'com.coachapp.coach.professional.monthly',
        googleProductId: 'coach_professional_monthly',
        stripePriceId: 'price_coach_professional_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxActiveClients: 50,
          clientProgressTracking: true,
          groupCoaching: true,
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: 10,
          videoExerciseLibrary: true,
          brandedContentTemplates: true,
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: 1200,
          groupChatRooms: 5,
          pushNotifications: true,
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          dataExportCapabilities: true,
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          storageGB: 50,
          bandwidthGB: 500,
          apiCallsPerMonth: 10000,
        },
        categories: [
          'coaching',
          'subscription',
          'professional',
          'popular',
          'monthly',
        ],
        targetAudience: [
          'established-coaches',
          'growing-business',
          'serious-trainers',
        ],
        coachRevenueShare: 75.0,
        metadata: {
          planType: 'coach_subscription',
          targetMarket: 'professional_coaches',
          businessModel: 'b2b',
          recommended: true,
          features: [
            'Up to 50 Clients',
            'Group Coaching',
            'Nutrition Planning',
            'Marketing Tools',
            'AI Recommendations',
            'Advanced Analytics',
            'Wearable Integration',
          ],
        },
      },
      {
        name: 'Coach Professional Plan (Quarterly)',
        description:
          'Professional coaching tools with quarterly savings. Best for growing coaching businesses.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.QUARTERLY,
        basePrice: 200.0, // ~15% discount
        currency: Currency.USD,
        trialDays: 14,
        appleProductId: 'com.coachapp.coach.professional.quarterly',
        googleProductId: 'coach_professional_quarterly',
        stripePriceId: 'price_coach_professional_quarterly',
        isStoreCompliant: true,
        categories: [
          'coaching',
          'subscription',
          'professional',
          'quarterly',
          'savings',
        ],
        targetAudience: ['established-coaches', 'quarterly-billing'],
        coachRevenueShare: 75.0,
      },
      {
        name: 'Coach Professional Plan (Yearly)',
        description:
          'Professional coaching platform with maximum yearly savings. Perfect for serious coaching businesses.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.PROFESSIONAL,
        billingCycle: BillingCycle.YEARLY,
        basePrice: 760.0, // ~20% discount
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.professional.yearly',
        googleProductId: 'coach_professional_yearly',
        stripePriceId: 'price_coach_professional_yearly',
        isStoreCompliant: true,
        categories: [
          'coaching',
          'subscription',
          'professional',
          'yearly',
          'best-value',
        ],
        targetAudience: ['established-coaches', 'annual-commitment'],
        coachRevenueShare: 75.0,
      },

      // Elite Plan
      {
        name: 'Coach Elite Plan',
        description:
          'Premium coaching platform with unlimited clients and white-label branding. For successful coaches and fitness entrepreneurs.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.ELITE,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 159.0,
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.elite.monthly',
        googleProductId: 'coach_elite_monthly',
        stripePriceId: 'price_coach_elite_monthly',
        isStoreCompliant: true,
        allowedPaymentMethods: [
          PaymentMethod.APPLE_IAP,
          PaymentMethod.GOOGLE_PLAY,
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
        ],
        features: {
          maxActiveClients: -1, // Unlimited
          clientProgressTracking: true,
          groupCoaching: true,
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: 100,
          videoExerciseLibrary: true,
          brandedContentTemplates: true,
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          whiteLabelApp: true,
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: -1, // Unlimited
          groupChatRooms: -1, // Unlimited
          pushNotifications: true,
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          revenueForecastingReports: true,
          dataExportCapabilities: true,
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          apiAccess: true,
          prioritySupport: true,
          storageGB: 500,
          bandwidthGB: 2000,
          apiCallsPerMonth: 100000,
        },
        categories: ['coaching', 'subscription', 'elite', 'premium', 'monthly'],
        targetAudience: [
          'successful-coaches',
          'fitness-entrepreneurs',
          'large-clientele',
        ],
        coachRevenueShare: 80.0, // Higher revenue share for elite plan
        metadata: {
          planType: 'coach_subscription',
          targetMarket: 'elite_coaches',
          businessModel: 'b2b',
          premium: true,
          features: [
            'Unlimited Clients',
            'White-Label App',
            'API Access',
            'Priority Support',
            'Revenue Forecasting',
            'Unlimited Video Calls',
            'Advanced Marketing',
          ],
        },
      },
      {
        name: 'Coach Elite Plan (Quarterly)',
        description:
          'Elite coaching platform with quarterly billing benefits. For high-performance coaching businesses.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.ELITE,
        billingCycle: BillingCycle.QUARTERLY,
        basePrice: 400.0, // ~16% discount
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.elite.quarterly',
        googleProductId: 'coach_elite_quarterly',
        stripePriceId: 'price_coach_elite_quarterly',
        isStoreCompliant: true,
        categories: [
          'coaching',
          'subscription',
          'elite',
          'quarterly',
          'premium',
        ],
        targetAudience: ['successful-coaches', 'quarterly-elite'],
        coachRevenueShare: 80.0,
      },
      {
        name: 'Coach Elite Plan (Yearly)',
        description:
          'Ultimate coaching platform with maximum savings. For serious fitness entrepreneurs and coaching empires.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.ELITE,
        billingCycle: BillingCycle.YEARLY,
        basePrice: 1520.0, // ~20% discount
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.elite.yearly',
        googleProductId: 'coach_elite_yearly',
        stripePriceId: 'price_coach_elite_yearly',
        isStoreCompliant: true,
        categories: ['coaching', 'subscription', 'elite', 'yearly', 'ultimate'],
        targetAudience: ['successful-coaches', 'annual-elite'],
        coachRevenueShare: 80.0,
      },

      // Enterprise Plan
      {
        name: 'Coach Enterprise Plan',
        description:
          'Complete coaching ecosystem for gyms, studios, and coaching companies. Includes dedicated success manager and unlimited everything.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.ENTERPRISE,
        billingCycle: BillingCycle.MONTHLY,
        basePrice: 299.0,
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.enterprise.monthly',
        googleProductId: 'coach_enterprise_monthly',
        stripePriceId: 'price_coach_enterprise_monthly',
        isStoreCompliant: false, // Enterprise usually handled directly
        allowedPaymentMethods: [
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
          PaymentMethod.BANK_TRANSFER,
        ],
        features: {
          maxActiveClients: -1, // Unlimited
          clientProgressTracking: true,
          groupCoaching: true,
          customWorkoutBuilder: true,
          nutritionPlanCreator: true,
          progressPhotoStorage: -1, // Unlimited
          videoExerciseLibrary: true,
          brandedContentTemplates: true,
          paymentProcessingIntegration: true,
          schedulingCalendar: true,
          revenueAnalytics: true,
          clientAcquisitionTools: true,
          marketingAutomation: true,
          whiteLabelApp: true,
          monthlyMessages: -1, // Unlimited
          videoCallMinutes: -1, // Unlimited
          groupChatRooms: -1, // Unlimited
          pushNotifications: true,
          basicAnalytics: true,
          advancedBusinessMetrics: true,
          clientRetentionReports: true,
          revenueForecastingReports: true,
          dataExportCapabilities: true,
          aiPoweredRecommendations: true,
          wearableIntegrations: true,
          nutritionTrackingIntegrations: true,
          apiAccess: true,
          prioritySupport: true,
          dedicatedSuccessManager: true,
          storageGB: -1, // Unlimited
          bandwidthGB: -1, // Unlimited
          apiCallsPerMonth: -1, // Unlimited
        },
        categories: [
          'coaching',
          'subscription',
          'enterprise',
          'business',
          'monthly',
        ],
        targetAudience: ['gyms', 'studios', 'coaching-companies', 'franchises'],
        coachRevenueShare: 85.0, // Highest revenue share for enterprise
        metadata: {
          planType: 'coach_subscription',
          targetMarket: 'enterprise',
          businessModel: 'b2b',
          enterprise: true,
          customOnboarding: true,
          features: [
            'Unlimited Everything',
            'Dedicated Success Manager',
            'Custom Onboarding',
            'Priority API Support',
            'Custom Integrations',
            'Multi-Location Support',
            'Team Management',
          ],
        },
      },
      {
        name: 'Coach Enterprise Plan (Yearly)',
        description:
          'Enterprise coaching solution with annual commitment. Best value for large coaching operations.',
        type: ProductType.SUBSCRIPTION,
        subscriptionPlan: CoachSubscriptionPlan.ENTERPRISE,
        billingCycle: BillingCycle.YEARLY,
        basePrice: 2870.0, // ~20% discount
        currency: Currency.USD,
        trialDays: 30,
        appleProductId: 'com.coachapp.coach.enterprise.yearly',
        googleProductId: 'coach_enterprise_yearly',
        stripePriceId: 'price_coach_enterprise_yearly',
        isStoreCompliant: false,
        allowedPaymentMethods: [
          PaymentMethod.STRIPE,
          PaymentMethod.PAYPAL,
          PaymentMethod.BANK_TRANSFER,
        ],
        categories: [
          'coaching',
          'subscription',
          'enterprise',
          'yearly',
          'business',
        ],
        targetAudience: ['gyms', 'studios', 'enterprise-annual'],
        coachRevenueShare: 85.0,
      },
    ];

    console.log(
      `Creating ${coachSubscriptionProducts.length} coach subscription products...`,
    );

    for (const productData of coachSubscriptionProducts) {
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

    console.log('🎉 Coach subscription product seeding completed!');

    // Print summary
    const allProducts = await productService.getProducts({
      limit: 100,
      type: ProductType.SUBSCRIPTION,
    });

    const coachProducts = allProducts.products.filter((p) =>
      p.name.toLowerCase().includes('coach'),
    );

    console.log('\n📊 Coach Subscription Product Summary:');
    console.log(`Total coach subscription products: ${coachProducts.length}`);

    const byPlan = coachProducts.reduce(
      (acc, product) => {
        const planName = product.name.includes('Starter')
          ? 'starter'
          : product.name.includes('Professional')
            ? 'professional'
            : product.name.includes('Elite')
              ? 'elite'
              : product.name.includes('Enterprise')
                ? 'enterprise'
                : 'unknown';
        acc[planName] = (acc[planName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\nBy plan:');
    Object.entries(byPlan).forEach(([plan, count]) => {
      console.log(`  ${plan}: ${count} products`);
    });

    const byBilling = coachProducts.reduce(
      (acc, product) => {
        const billing = product.name.includes('Yearly')
          ? 'yearly'
          : product.name.includes('Quarterly')
            ? 'quarterly'
            : 'monthly';
        acc[billing] = (acc[billing] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\nBy billing cycle:');
    Object.entries(byBilling).forEach(([billing, count]) => {
      console.log(`  ${billing}: ${count} products`);
    });

    const storeCompliant = coachProducts.filter(
      (p) => p.isStoreCompliant,
    ).length;
    console.log(`\nStore compliant: ${storeCompliant}/${coachProducts.length}`);

    console.log('\n💰 Pricing Summary:');
    const starterMonthly = coachProducts.find(
      (p) => p.name.includes('Starter') && p.name.includes('monthly'),
    );
    const professionalMonthly = coachProducts.find(
      (p) =>
        p.name.includes('Professional') &&
        !p.name.includes('Quarterly') &&
        !p.name.includes('Yearly'),
    );
    const eliteMonthly = coachProducts.find(
      (p) =>
        p.name.includes('Elite') &&
        !p.name.includes('Quarterly') &&
        !p.name.includes('Yearly'),
    );
    const enterpriseMonthly = coachProducts.find(
      (p) => p.name.includes('Enterprise') && !p.name.includes('Yearly'),
    );

    if (starterMonthly)
      console.log(`  Starter: $${starterMonthly.basePrice}/month`);
    if (professionalMonthly)
      console.log(`  Professional: $${professionalMonthly.basePrice}/month`);
    if (eliteMonthly) console.log(`  Elite: $${eliteMonthly.basePrice}/month`);
    if (enterpriseMonthly)
      console.log(`  Enterprise: $${enterpriseMonthly.basePrice}/month`);
  } catch (error) {
    console.error('❌ Error seeding coach subscription products:', error);
  } finally {
    await app.close();
  }
}

// Run the seeder
if (require.main === module) {
  seedCoachSubscriptionProducts()
    .then(() => {
      console.log('✅ Coach subscription seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Coach subscription seeding failed:', error);
      process.exit(1);
    });
}
