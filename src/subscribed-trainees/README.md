# Coach-Trainee Subscription System

A comprehensive subscription system that enables trainees to search for coaches, send subscription requests, and facilitates coach-trainee interactions through a structured workflow.

## 🎯 Overview

This system implements a complete coach discovery and subscription workflow where:

1. **Trainees** can search for coaches, view profiles, and send subscription requests
2. **Coaches** receive requests, review trainee profiles, and approve/reject subscriptions
3. **Messaging** is enabled based on subscription status
4. **Profile access** is controlled by subscription permissions

## 🏗️ Architecture

### Entities

#### SubscriptionRequestEntity
```typescript
- id: string (UUID)
- traineeId: string
- coachId: string
- packageId?: string
- requestType: RequestType (subscription, package_purchase, consultation)
- status: SubscriptionStatus (pending, approved, rejected, cancelled, expired, active)
- traineeMessage?: string
- coachResponse?: string
- traineeGoals: JSON (goals, experience, preferences)
- subscriptionDetails: JSON (schedule, budget, preferences)
- coachTerms: JSON (fees, terms, services)
- startDate/endDate: Date
- monthlyFee: number
- priority: string (low, medium, high, urgent)
- source: string (search, referral, social_media, etc.)
- canMessage/canViewProfile: boolean
- expiresAt: Date (auto-rejection after 7 days)
```

### Services

#### SubscriptionRequestService
- **Coach Search**: Advanced filtering, sorting, and pagination
- **Request Management**: Create, respond, cancel subscription requests
- **Permission Control**: Manage messaging and profile view permissions
- **Analytics**: Track request metrics and conversion rates

#### MessagePermissionService
- **Access Control**: Validate messaging permissions between users
- **Conversation Management**: Get list of messageable users
- **Real-time Validation**: Check permissions before sending messages

### Controllers

#### CoachDiscoveryController (Trainee-focused)
- Coach search with advanced filtering
- Featured and recommended coaches
- Subscription request creation
- Profile viewing permissions

#### SubscriptionRequestController (Both roles)
- Request management for coaches and trainees
- Approval/rejection workflow
- Bulk operations for coaches
- Analytics and reporting

## 🔍 Coach Search Features

### Search Filters
```typescript
- query: string (name, bio search)
- specializations: string[] (weight loss, strength training, etc.)
- experienceLevel: string (beginner, intermediate, advanced)
- minRating: number (1-5 star rating)
- maxPrice: number (hourly rate limit)
- location: string (city/region)
- gender: string (male, female, any)
- availableOnly: boolean (accepting new clients)
```

### Sorting Options
- **Rating**: Highest rated coaches first
- **Price**: Lowest to highest pricing
- **Experience**: Most experienced coaches
- **Name**: Alphabetical order
- **Newest**: Recently joined coaches

### Pagination
- Configurable page size (1-50 items)
- Total count and page metadata
- Navigation helpers (hasNext, hasPrevious)

## 📝 Subscription Workflow

### 1. Trainee Searches for Coach
```http
GET /api/v1/coach-discovery/search?specializations=weight_loss&minRating=4&location=New York
```

### 2. Trainee Views Coach Profile
```http
GET /api/v1/coach-discovery/coach/{coachId}/profile
```

### 3. Trainee Sends Subscription Request
```http
POST /api/v1/coach-discovery/subscribe
{
  "coachId": "uuid",
  "requestType": "subscription",
  "traineeMessage": "I'm looking for help with weight loss...",
  "traineeGoals": {
    "primaryGoals": ["weight_loss", "strength_building"],
    "targetWeight": 70,
    "timeframe": "6 months",
    "experience": "beginner",
    "workoutFrequency": 3
  },
  "subscriptionDetails": {
    "preferredStartDate": "2025-07-01",
    "duration": 6,
    "sessionsPerWeek": 3,
    "communicationPreference": "weekly",
    "budgetRange": { "min": 100, "max": 200 }
  }
}
```

### 4. Coach Reviews Request
```http
GET /api/v1/subscription-requests/pending
```

### 5. Coach Responds to Request
```http
PUT /api/v1/subscription-requests/{requestId}/respond
{
  "status": "approved",
  "coachResponse": "I'd love to help you achieve your goals!",
  "monthlyFee": 150,
  "coachTerms": {
    "sessionsIncluded": 12,
    "commitmentPeriod": 3,
    "cancellationPolicy": "30 days notice required"
  }
}
```

### 6. Messaging Enabled
```http
GET /api/v1/subscription-requests/permissions/can-message/{coachId}
// Returns: { "canMessage": true }
```

## 🔐 Permission System

### Messaging Rules
1. **Admin** can message anyone
2. **Trainee → Coach**: Only if subscription request exists (pending/approved/active)
3. **Coach → Trainee**: Only if trainee sent a subscription request
4. **Same Role**: Cannot message each other (coach-to-coach, trainee-to-trainee)

### Profile Access Rules
1. **Coach** can view trainee profile only if trainee sent a subscription request
2. **Trainee** can view basic coach profile always, detailed profile after requesting
3. **Permission checks** happen on every API call

### Permission Validation
```typescript
// Before sending message
await messagePermissionService.validateMessagePermission(senderId, receiverId);

// Check if can start conversation
const permission = await messagePermissionService.canStartConversation(senderId, receiverId);
```

## 📊 API Endpoints

### Coach Discovery (Trainee)
```
GET    /api/v1/coach-discovery/search           - Search coaches
GET    /api/v1/coach-discovery/featured         - Featured coaches
GET    /api/v1/coach-discovery/nearby           - Nearby coaches  
GET    /api/v1/coach-discovery/recommendations  - Personalized recommendations
POST   /api/v1/coach-discovery/subscribe        - Send subscription request
GET    /api/v1/coach-discovery/coach/{id}/profile - Coach profile
GET    /api/v1/coach-discovery/my-requests      - My subscription requests
GET    /api/v1/coach-discovery/my-coaches       - My active coaches
```

### Subscription Management (Both)
```
GET    /api/v1/subscription-requests            - List requests
GET    /api/v1/subscription-requests/pending    - Pending requests (coach)
GET    /api/v1/subscription-requests/active     - Active subscriptions
GET    /api/v1/subscription-requests/{id}       - Get request details
PUT    /api/v1/subscription-requests/{id}/respond - Respond to request
PUT    /api/v1/subscription-requests/{id}/approve - Quick approve
PUT    /api/v1/subscription-requests/{id}/reject  - Quick reject
DELETE /api/v1/subscription-requests/{id}       - Cancel request
```

### Permissions
```
GET    /api/v1/subscription-requests/permissions/can-message/{coachId}
GET    /api/v1/subscription-requests/permissions/can-view-profile/{traineeId}
```

## 🎨 Frontend Integration

### Trainee Flow
1. **Coach Search Page**: Filter and search coaches
2. **Coach Profile Modal**: View detailed coach information
3. **Subscription Form**: Send request with goals and preferences
4. **Request Status**: Track pending/approved/rejected requests
5. **My Coaches**: View active coaching relationships

### Coach Flow
1. **Request Inbox**: View pending subscription requests
2. **Trainee Profile**: Review trainee goals and background
3. **Response Form**: Approve/reject with terms and pricing
4. **Active Trainees**: Manage current coaching relationships
5. **Analytics Dashboard**: Track request metrics

### Messaging Integration
1. **Permission Checks**: Validate before showing message button
2. **Conversation List**: Show only permitted conversations
3. **Message Validation**: Server-side permission validation
4. **Suggested Actions**: Guide users on how to enable messaging

## 🔧 Configuration

### Request Expiry
- Subscription requests expire after **7 days** if not responded to
- Automatic cleanup job marks expired requests
- Trainees can resend requests after expiry

### Auto-Approval (Future)
```typescript
autoApprovalSettings: {
  enabled: boolean;
  maxTrainees?: number;
  requiredExperience?: string[];
  budgetMinimum?: number;
}
```

### Notification Integration
- Email notifications for new requests
- Push notifications for responses
- Reminder notifications for pending requests

## 📈 Analytics & Metrics

### For Coaches
- Total requests received
- Approval/rejection rates
- Average response time
- Revenue tracking
- Trainee retention rates

### For Platform
- Coach discovery patterns
- Popular specializations
- Conversion rates
- Geographic distribution
- Pricing analytics

## 🚀 Usage Examples

### Search for Weight Loss Coaches
```javascript
const coaches = await fetch('/api/v1/coach-discovery/search?' + new URLSearchParams({
  specializations: 'weight_loss',
  minRating: '4',
  maxPrice: '150',
  sortBy: 'rating',
  sortOrder: 'DESC',
  limit: '20'
}));
```

### Send Subscription Request
```javascript
const request = await fetch('/api/v1/coach-discovery/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coachId: 'coach-uuid',
    requestType: 'subscription',
    traineeMessage: 'Looking for help with weight loss and fitness...',
    traineeGoals: {
      primaryGoals: ['weight_loss', 'fitness_improvement'],
      targetWeight: 65,
      experience: 'beginner',
      workoutFrequency: 4
    },
    subscriptionDetails: {
      preferredStartDate: '2025-07-01',
      duration: 6,
      sessionsPerWeek: 3,
      budgetRange: { min: 100, max: 200 }
    }
  })
});
```

### Check Messaging Permission
```javascript
const permission = await fetch(`/api/v1/coach-discovery/coach/${coachId}/can-message`);
const result = await permission.json();

if (result.canMessage) {
  // Show message button
} else {
  // Show subscription request button with suggested action
  console.log(result.suggestedAction); // "Send a subscription request to this coach first"
}
```

## 🔄 Integration Points

### With Task Module
- Coaches can assign tasks to subscribed trainees
- Task permissions based on subscription status
- Progress tracking for subscribed trainees

### With Workout Module  
- Workout assignments limited to subscribed trainees
- Coach can create personalized workout plans
- Progress tracking and feedback system

### With Messaging Module
- Permission validation before message delivery
- Conversation context with subscription details
- File sharing limited to subscribed relationships

### With Notification Module
- Request status notifications
- Subscription expiry alerts
- Coach availability notifications

This comprehensive subscription system creates a structured, permission-based environment where trainees can discover and connect with coaches while maintaining proper access controls and facilitating meaningful coaching relationships! 🎯
