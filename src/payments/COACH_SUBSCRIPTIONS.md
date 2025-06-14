# 🏋️‍♂️ Coach Subscription System

## 🎯 **Overview**

Complete subscription management system designed specifically for fitness coaches, personal trainers, and coaching businesses. This system provides flexible plans that scale from individual trainers to large coaching enterprises.

## 📋 **Coach Subscription Plans**

### 🥉 **Starter Plan - $29/month**
*Perfect for new coaches getting started*

**Target Audience:** New coaches, individual trainers, side-hustle coaches
**Trial Period:** 7 days

**Features:**
- ✅ **Up to 10 active clients**
- ✅ **Client progress tracking**
- ✅ **Custom workout builder**
- ✅ **Video exercise library**
- ✅ **Payment processing integration**
- ✅ **Scheduling & calendar**
- ✅ **Basic revenue analytics**
- ✅ **100 messages/month**
- ✅ **5 hours video calls/month**
- ✅ **5GB storage**
- ✅ **1,000 API calls/month**

**Limitations:**
- ❌ No nutrition planning
- ❌ No group coaching
- ❌ No marketing automation
- ❌ No branded content templates

**Pricing:**
- Monthly: $29
- Quarterly: $75 (14% savings)
- Yearly: $280 (20% savings)

---

### 🥈 **Professional Plan - $79/month** ⭐ *Most Popular*
*For established coaches scaling their business*

**Target Audience:** Established coaches, growing businesses, serious trainers
**Trial Period:** 14 days

**Features:**
- ✅ **Up to 50 active clients**
- ✅ **Group coaching capabilities**
- ✅ **Nutrition plan creator**
- ✅ **Branded content templates**
- ✅ **Marketing automation**
- ✅ **Client acquisition tools**
- ✅ **Unlimited messaging**
- ✅ **20 hours video calls/month**
- ✅ **50GB storage**
- ✅ **Advanced business metrics**
- ✅ **Client retention reports**
- ✅ **AI-powered recommendations**
- ✅ **Wearable integrations**
- ✅ **Data export capabilities**
- ✅ **10,000 API calls/month**

**Pricing:**
- Monthly: $79
- Quarterly: $200 (15% savings)
- Yearly: $760 (20% savings)

---

### 🥇 **Elite Plan - $159/month**
*For successful coaches and fitness entrepreneurs*

**Target Audience:** Successful coaches, fitness entrepreneurs, large clientele
**Trial Period:** 30 days

**Features:**
- ✅ **Unlimited clients**
- ✅ **White-label app branding**
- ✅ **API access**
- ✅ **Priority support**
- ✅ **Revenue forecasting**
- ✅ **Unlimited video calls**
- ✅ **Unlimited messaging**
- ✅ **500GB storage**
- ✅ **100,000 API calls/month**
- ✅ **All Professional features**

**Pricing:**
- Monthly: $159
- Quarterly: $400 (16% savings)
- Yearly: $1,520 (20% savings)

---

### 🏢 **Enterprise Plan - $299/month**
*Complete coaching ecosystem for businesses*

**Target Audience:** Gyms, studios, coaching companies, franchises
**Trial Period:** 30 days

**Features:**
- ✅ **Everything unlimited**
- ✅ **Dedicated success manager**
- ✅ **Custom onboarding**
- ✅ **Multi-location support**
- ✅ **Team management**
- ✅ **Custom integrations**
- ✅ **Priority API support**
- ✅ **Bank transfer payments**

**Pricing:**
- Monthly: $299
- Yearly: $2,870 (20% savings)

## 🛠️ **Technical Implementation**

### **Core Components**

#### **Entity: CoachSubscriptionEntity**
```typescript
// Key features tracked per subscription
interface CoachPlanFeatures {
  maxActiveClients: number;          // -1 for unlimited
  monthlyMessages: number;           // -1 for unlimited
  videoCallMinutes: number;          // per month
  storageGB: number;                 // -1 for unlimited
  customWorkoutBuilder: boolean;
  nutritionPlanCreator: boolean;
  groupCoaching: boolean;
  whiteLabelApp: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  // ... and many more
}

// Real-time usage tracking
interface CoachUsageTracking {
  activeClients: number;
  messagesUsed: number;
  videoMinutesUsed: number;
  storageUsedGB: number;
  apiCallsUsed: number;
  monthlyRevenue: number;
  clientRetentionRate: number;
  // ... and more metrics
}
```

#### **Service: CoachSubscriptionService**
- ✅ Plan configuration management
- ✅ Subscription lifecycle (create, update, cancel)
- ✅ Feature access control
- ✅ Usage limit enforcement
- ✅ Auto-renewal processing
- ✅ Trial period management

#### **Controller: CoachSubscriptionController**
- ✅ RESTful API endpoints
- ✅ Authentication & authorization
- ✅ Plan comparison
- ✅ Usage monitoring
- ✅ Analytics (admin only)

## 🚀 **API Endpoints**

### **Public Endpoints**
```bash
GET /api/coach-subscriptions/plans
# Get all available coach subscription plans with pricing and features
```

### **Coach Endpoints** (Authentication Required)
```bash
# Subscription Management
POST /api/coach-subscriptions
GET /api/coach-subscriptions/my-subscriptions
GET /api/coach-subscriptions/active
PUT /api/coach-subscriptions/:id
POST /api/coach-subscriptions/:id/cancel
POST /api/coach-subscriptions/:id/reactivate

# Feature Access & Usage
GET /api/coach-subscriptions/feature-access/:feature
GET /api/coach-subscriptions/usage-limit/:usageType
POST /api/coach-subscriptions/usage/increment

# Examples:
GET /api/coach-subscriptions/feature-access/customWorkoutBuilder
GET /api/coach-subscriptions/usage-limit/messagesUsed
POST /api/coach-subscriptions/usage/increment
```

### **Admin Endpoints** (Admin Role Required)
```bash
GET /api/coach-subscriptions/analytics
GET /api/coach-subscriptions/admin/all
```

## 💡 **Usage Examples**

### **1. Creating a Coach Subscription**
```typescript
const subscription = await fetch('/api/coach-subscriptions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    plan: 'professional',
    billingCycle: 'monthly',
    paymentMethod: 'stripe',
    trialDays: 14,
    metadata: {
      signupSource: 'web',
      coachingSpecialty: ['strength-training', 'weight-loss'],
      businessType: 'individual',
    }
  })
});
```

### **2. Checking Feature Access**
```typescript
const hasWorkoutBuilder = await fetch(
  '/api/coach-subscriptions/feature-access/customWorkoutBuilder',
  {
    headers: { 'Authorization': 'Bearer your-jwt-token' }
  }
);

// Response: { feature: 'customWorkoutBuilder', hasAccess: true }
```

### **3. Tracking Usage**
```typescript
// Check current usage
const messageUsage = await fetch(
  '/api/coach-subscriptions/usage-limit/messagesUsed',
  {
    headers: { 'Authorization': 'Bearer your-jwt-token' }
  }
);

// Response: { withinLimit: true, used: 45, limit: 100, percentage: 45 }

// Increment usage
await fetch('/api/coach-subscriptions/usage/increment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'messages',
    amount: 1
  })
});
```

## 🏪 **Store Compliance & Payments**

### **Apple App Store**
```typescript
// Product IDs for App Store Connect
const appleProductIds = {
  starter_monthly: 'com.coachapp.coach.starter.monthly',
  starter_quarterly: 'com.coachapp.coach.starter.quarterly',
  starter_yearly: 'com.coachapp.coach.starter.yearly',
  professional_monthly: 'com.coachapp.coach.professional.monthly',
  professional_quarterly: 'com.coachapp.coach.professional.quarterly',
  professional_yearly: 'com.coachapp.coach.professional.yearly',
  elite_monthly: 'com.coachapp.coach.elite.monthly',
  elite_quarterly: 'com.coachapp.coach.elite.quarterly',
  elite_yearly: 'com.coachapp.coach.elite.yearly',
};
```

### **Google Play Store**
```typescript
// Product IDs for Google Play Console
const googleProductIds = {
  starter_monthly: 'coach_starter_monthly',
  starter_quarterly: 'coach_starter_quarterly',
  starter_yearly: 'coach_starter_yearly',
  professional_monthly: 'coach_professional_monthly',
  professional_quarterly: 'coach_professional_quarterly',
  professional_yearly: 'coach_professional_yearly',
  elite_monthly: 'coach_elite_monthly',
  elite_quarterly: 'coach_elite_quarterly',
  elite_yearly: 'coach_elite_yearly',
};
```

## 📊 **Revenue Model**

### **Platform Revenue Share**
- **Starter & Professional:** 25% platform fee, 75% to platform
- **Elite:** 20% platform fee, 80% to platform  
- **Enterprise:** 15% platform fee, 85% to platform

### **Revenue Projections**
```
💰 Monthly Revenue Potential:
📈 100 Starter coaches: $2,900 revenue ($725 to platform)
📈 100 Professional coaches: $7,900 revenue ($1,975 to platform)
📈 50 Elite coaches: $7,950 revenue ($1,590 to platform)
📈 10 Enterprise: $2,990 revenue ($449 to platform)

Total Monthly: $21,740 revenue ($4,739 platform share)
Annual Potential: $260,880 revenue ($56,868 platform share)
```

## 🔄 **Automated Features**

### **Auto-Renewal Processing**
- ✅ Hourly cron job checks expiring subscriptions
- ✅ Processes payments through configured payment methods
- ✅ Resets usage counters monthly
- ✅ Handles failed payments with retry logic
- ✅ Automatic downgrades after failed payments

### **Usage Limit Enforcement**
- ✅ Real-time usage tracking
- ✅ Soft limits with warnings at 80%
- ✅ Hard limits prevent overages
- ✅ Automatic upgrade suggestions
- ✅ Grace period for slight overages

## 🛡️ **Security & Compliance**

### **Access Control**
- ✅ JWT authentication required
- ✅ Role-based permissions (Coach/Admin)
- ✅ Subscription-based feature gating
- ✅ Usage-based rate limiting

### **Data Protection**
- ✅ Encrypted payment information
- ✅ PCI compliance ready
- ✅ GDPR compliant data handling
- ✅ Audit trail for all subscription changes

## 🚀 **Getting Started**

### **1. Database Setup**
```bash
# Run migrations to create coach subscription tables
npm run migration:run
```

### **2. Seed Coach Subscription Products**
```bash
# Create coach subscription plans in database
npm run seed:coach-subscriptions
```

### **3. Test the System**
```bash
# Test API endpoints
npm run test:payment-api

# Test full payment system
npm run test:payments
```

### **4. Configure Payment Methods**
Set up your payment provider credentials:

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Apple App Store
APPLE_SHARED_SECRET=your-shared-secret

# Google Play
GOOGLE_PLAY_SERVICE_ACCOUNT_KEY=path-to-key.json
```

## 📈 **Business Benefits**

### **For Coaches**
✅ **Predictable Revenue** - Subscription model provides steady income  
✅ **Professional Tools** - Advanced features to serve clients better  
✅ **Scalable Business** - Plans grow with coaching business  
✅ **Time Savings** - Automated billing and client management  
✅ **Brand Building** - White-label options for established coaches  

### **For Platform**
✅ **Recurring Revenue** - Predictable monthly income stream  
✅ **High Retention** - Essential tools create sticky customers  
✅ **Upsell Opportunities** - Natural progression through plan tiers  
✅ **Market Expansion** - Serves coaches from solo to enterprise  
✅ **Data Insights** - Rich analytics on coaching business trends  

## 🎯 **Success Metrics**

### **Key Performance Indicators**
- **Monthly Recurring Revenue (MRR)**: Target $50k by month 12
- **Customer Acquisition Cost (CAC)**: <$100 per coach
- **Lifetime Value (LTV)**: >$2,000 per coach
- **Churn Rate**: <5% monthly
- **Upgrade Rate**: >25% of Starter coaches upgrade within 6 months
- **Trial Conversion**: >40% trial to paid conversion

### **Growth Targets**
```
🎯 Year 1 Goals:
Month 3: 100 active coach subscriptions
Month 6: 300 active coach subscriptions  
Month 9: 500 active coach subscriptions
Month 12: 750 active coach subscriptions

Revenue Milestones:
Month 6: $15k MRR
Month 9: $30k MRR
Month 12: $50k MRR
```

## 🏆 **Competitive Advantages**

✅ **Coach-Specific Features** - Built specifically for fitness coaching  
✅ **Flexible Pricing** - Plans for every stage of coaching business  
✅ **Store Compliant** - Ready for mobile app stores  
✅ **Enterprise Ready** - Scales to gym chains and franchises  
✅ **Developer Friendly** - Comprehensive API for integrations  
✅ **Analytics Driven** - Deep insights into coaching business metrics  

---

*Your coach subscription system is now ready to power the next generation of fitness coaching businesses! 🚀💪*
