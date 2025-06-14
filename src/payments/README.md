# 💳 Coach App Payment System

A comprehensive, store-compliant payment system designed for coach-trainee applications that supports Apple App Store, Google Play Store, and web-based payment methods.

## 🎯 **Overview**

This payment system enables:
- **Store-compliant** subscriptions and in-app purchases
- **Multi-platform** payment processing (iOS, Android, Web)
- **Revenue sharing** between coaches and platform
- **Subscription management** with automatic billing
- **Usage tracking** and feature access control
- **Analytics** and reporting for business insights

## 🏗️ **Architecture**

### **Core Entities**

#### **PaymentEntity**
- Handles individual payment transactions
- Supports Apple IAP, Google Play, Stripe, PayPal
- Tracks platform fees and revenue sharing
- Validates receipts and purchase tokens

#### **SubscriptionEntity**
- Manages recurring subscriptions
- Tracks billing cycles and renewals
- Feature access control
- Usage limits and tracking

#### **ProductEntity**
- Defines purchasable products and services
- Store-compliance settings
- Pricing tiers and discounts
- Revenue sharing configuration

## 🔧 **Features**

### **🏪 Store Compliance**
✅ **Apple App Store IAP** - Full receipt validation  
✅ **Google Play Billing** - Purchase token verification  
✅ **Platform Fee Handling** - Automatic 30% store fee calculation  
✅ **Subscription Management** - Auto-renewal and cancellation  
✅ **Product Configuration** - Store-specific product IDs  

### **💰 Payment Processing**
✅ **Multiple Payment Methods** - Apple, Google, Stripe, PayPal  
✅ **Revenue Sharing** - Configurable coach/platform splits  
✅ **Fee Calculation** - Platform fees, service fees, net amounts  
✅ **Receipt Validation** - Server-side verification  
✅ **Fraud Protection** - Test/sandbox detection  

### **📊 Subscription Management**
✅ **Flexible Plans** - Basic, Premium, Pro, Enterprise  
✅ **Billing Cycles** - Weekly, Monthly, Quarterly, Yearly  
✅ **Trial Periods** - Configurable trial durations  
✅ **Auto-Renewal** - Scheduled billing and renewals  
✅ **Cancellation** - Immediate or end-of-period  

### **🎛️ Feature Access Control**
✅ **Usage Limits** - Messages, workouts, storage, video  
✅ **Feature Flags** - Premium features per plan  
✅ **Real-time Validation** - API-level access control  
✅ **Usage Tracking** - Automatic increment and monitoring  

### **📈 Analytics & Reporting**
✅ **Revenue Analytics** - Total, MRR, payment methods  
✅ **Subscription Metrics** - Active, churned, trial conversions  
✅ **Coach Earnings** - Individual revenue tracking  
✅ **Product Performance** - Sales count, ratings  

## 🌐 **API Endpoints**

### **💳 Payment Management**
```
POST   /api/payments                     - Create payment
POST   /api/payments/apple-iap/validate  - Validate Apple IAP
POST   /api/payments/google-play/validate - Validate Google Play
POST   /api/payments/stripe/process      - Process Stripe payment
GET    /api/payments/my-payments         - Get user payments
GET    /api/payments/analytics           - Payment analytics (Admin)
GET    /api/payments/coach-earnings/:id  - Coach earnings
GET    /api/payments/:id                 - Payment details
PUT    /api/payments/:id/cancel          - Cancel payment
```

### **🔄 Subscription Management**
```
POST   /api/subscriptions                - Create subscription
GET    /api/subscriptions/my-subscriptions - User subscriptions
GET    /api/subscriptions/active         - Active subscription
GET    /api/subscriptions/feature-access/:feature - Check feature access
GET    /api/subscriptions/usage-limit/:type - Check usage limits
POST   /api/subscriptions/usage/increment - Update usage
GET    /api/subscriptions/:id            - Subscription details
PUT    /api/subscriptions/:id            - Update subscription
PUT    /api/subscriptions/:id/cancel     - Cancel subscription
PUT    /api/subscriptions/:id/reactivate - Reactivate subscription
```

### **🛍️ Product Catalog**
```
GET    /api/products                     - Get products
GET    /api/products/store/:platform     - Store products (iOS/Android)
GET    /api/products/featured            - Featured products
GET    /api/products/categories          - Product categories
GET    /api/products/search              - Search products
GET    /api/products/:id                 - Product details
POST   /api/products                     - Create product (Admin)
PUT    /api/products/:id                 - Update product (Admin)
PUT    /api/products/:id/activate        - Activate product (Admin)
DELETE /api/products/:id                 - Delete product (Admin)
```

## 🚀 **Implementation Guide**

### **1. Basic Setup**

```typescript
// Import the payments module
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    PaymentsModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### **2. Create Products**

```typescript
// Create a subscription product
const product = await productService.createProduct({
  name: 'Premium Coaching',
  description: 'Full access to premium coaching features',
  type: ProductType.SUBSCRIPTION,
  subscriptionPlan: SubscriptionPlan.PREMIUM,
  billingCycle: BillingCycle.MONTHLY,
  basePrice: 29.99,
  currency: Currency.USD,
  appleProductId: 'com.coachapp.premium.monthly',
  googleProductId: 'premium_monthly',
  isStoreCompliant: true,
  allowedPaymentMethods: [
    PaymentMethod.APPLE_IAP,
    PaymentMethod.GOOGLE_PLAY,
    PaymentMethod.STRIPE,
  ],
  features: {
    maxCoaches: 3,
    unlimitedMessaging: true,
    customWorkouts: true,
    nutritionPlanning: true,
  },
  coachRevenueShare: 70.0,
});
```

### **3. Process Payments**

```typescript
// Apple In-App Purchase
const payment = await paymentService.validateAppleIAP(userId, {
  receiptData: 'base64-encoded-receipt',
  productId: 'com.coachapp.premium.monthly',
  transactionId: 'apple-transaction-id',
});

// Google Play Purchase
const payment = await paymentService.validateGooglePlayPurchase(userId, {
  purchaseToken: 'google-purchase-token',
  productId: 'premium_monthly',
  packageName: 'com.coachapp',
});

// Stripe Payment
const payment = await paymentService.processStripePayment(userId, {
  paymentIntentId: 'pi_stripe_payment_intent',
});
```

### **4. Manage Subscriptions**

```typescript
// Create subscription
const subscription = await subscriptionService.createSubscription(userId, {
  plan: SubscriptionPlan.PREMIUM,
  billingCycle: BillingCycle.MONTHLY,
  paymentMethod: PaymentMethod.APPLE_IAP,
  coachId: 'coach-uuid',
  trialDays: 7,
});

// Check feature access
const hasAccess = await subscriptionService.hasFeatureAccess(
  userId,
  'customWorkouts'
);

// Check usage limits
const usageInfo = await subscriptionService.checkUsageLimit(
  userId,
  'messagesUsed'
);

// Update usage
await subscriptionService.updateUsage(subscriptionId, {
  messagesUsed: 1,
  workoutsUsed: 1,
});
```

### **5. Revenue Analytics**

```typescript
// Get payment analytics
const analytics = await paymentService.getPaymentAnalytics(
  startDate,
  endDate
);

console.log({
  totalRevenue: analytics.totalRevenue,
  monthlyRecurringRevenue: analytics.monthlyRecurringRevenue,
  revenueByPaymentMethod: analytics.revenueByPaymentMethod,
  averageTransactionValue: analytics.averageTransactionValue,
});
```

## 📱 **Store Compliance Guide**

### **Apple App Store Requirements**

1. **Use Apple IAP for digital content**:
   - Subscription plans
   - Premium features
   - Virtual coaching sessions

2. **Product ID Format**: `com.yourapp.product.billing`
   ```typescript
   appleProductId: 'com.coachapp.premium.monthly'
   ```

3. **Receipt Validation**:
   ```typescript
   const result = await paymentService.validateAppleIAP(userId, {
     receiptData: base64Receipt,
     productId: appleProductId,
   });
   ```

### **Google Play Store Requirements**

1. **Use Google Play Billing for digital content**:
   - In-app subscriptions
   - Premium upgrades
   - Digital services

2. **Product ID Format**: `product_billing_cycle`
   ```typescript
   googleProductId: 'premium_monthly'
   ```

3. **Purchase Token Validation**:
   ```typescript
   const result = await paymentService.validateGooglePlayPurchase(userId, {
     purchaseToken: token,
     productId: googleProductId,
   });
   ```

### **Revenue Sharing**

```typescript
// Platform takes 30% (store fee) + 5% (service fee)
// Coach gets 70% of net amount after platform fees
const feeCalculation = {
  grossAmount: 100.00,
  storeFee: 30.00,        // 30% to Apple/Google
  serviceFee: 5.00,       // 5% platform service fee
  netAmount: 65.00,       // Remaining amount
  coachShare: 45.50,      // 70% of net (65.00 * 0.70)
  platformShare: 19.50,   // 30% of net (65.00 * 0.30)
};
```

## 🔒 **Security & Validation**

### **Receipt Validation**
- All Apple and Google receipts validated server-side
- Fraud detection for test/sandbox purchases
- Duplicate transaction prevention

### **Payment Processing**
- Secure API key storage
- Webhook signature verification
- PCI compliance for card payments

### **Access Control**
- Feature access based on active subscriptions
- Usage limit enforcement
- Real-time permission validation

## 📊 **Monitoring & Analytics**

### **Key Metrics Tracked**
- **Revenue**: Total, MRR, by payment method
- **Subscriptions**: Active, churned, trial conversions
- **Products**: Sales count, average rating
- **Coaches**: Individual earnings, commission rates

### **Automated Tasks**
- **Subscription Renewals**: Hourly check for due renewals
- **Expired Subscriptions**: 6-hourly cleanup
- **Usage Reset**: Monthly usage counter reset
- **Failed Payment Retry**: Configurable retry logic

## 🔧 **Configuration**

### **Environment Variables**
```env
# Apple App Store
APPLE_SHARED_SECRET=your-shared-secret
APPLE_TEAM_ID=your-team-id

# Google Play
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=path-to-key.json
GOOGLE_PLAY_PACKAGE_NAME=com.yourapp

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret

# Revenue Sharing
DEFAULT_COACH_REVENUE_SHARE=70.0
PLATFORM_SERVICE_FEE=5.0
```

### **Product Configuration**
```typescript
const productConfig = {
  subscriptionPlans: {
    basic: { price: 9.99, features: ['basicWorkouts'] },
    premium: { price: 29.99, features: ['allFeatures'] },
    pro: { price: 59.99, features: ['allFeatures', 'prioritySupport'] },
  },
  trialPeriods: {
    basic: 0,      // No trial
    premium: 7,    // 7-day trial
    pro: 14,       // 14-day trial
  },
  revenueSharing: {
    coach: 70,     // 70% to coach
    platform: 30,  // 30% to platform
  },
};
```

## 🚀 **Getting Started**

1. **Install Dependencies**:
   ```bash
   npm install @nestjs/schedule @nestjs/typeorm
   ```

2. **Run Migrations**:
   ```bash
   npm run typeorm:migration:run
   ```

3. **Seed Initial Products**:
   ```bash
   npm run seed:products
   ```

4. **Configure Store Products**:
   - Set up products in Apple App Store Connect
   - Configure products in Google Play Console
   - Update product IDs in database

5. **Test Payment Flow**:
   ```bash
   npm run test:payments
   ```

## 🎉 **Benefits**

✅ **Store Compliant** - Meets Apple and Google requirements  
✅ **Revenue Optimized** - Flexible revenue sharing models  
✅ **Feature Rich** - Complete subscription lifecycle  
✅ **Analytics Ready** - Comprehensive reporting  
✅ **Scalable** - Handles high transaction volumes  
✅ **Secure** - Industry-standard security practices  

This payment system transforms your coach app into a monetization-ready platform that maximizes revenue while ensuring compliance with all major app stores! 💰🚀
