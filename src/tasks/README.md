# Task Management Module

## Overview

The Task Management Module is a comprehensive system that enables coaches to assign various types of tasks to trainees and allows trainees to complete, submit, and track their progress. This module is central to trainee engagement and provides structured guidance for achieving fitness goals.

## Features

### 🎯 **Comprehensive Task Types**
- **Workout Tasks**: Complete specific workout routines with detailed tracking
- **Meal Logging**: Track daily nutrition with photo documentation
- **Weight Checks**: Regular body weight monitoring and trend analysis
- **Progress Photos**: Visual progress tracking with standardized angles
- **Body Measurements**: Track body measurements for progress monitoring
- **Habit Tracking**: Monitor daily habits and behaviors
- **Reflection Tasks**: Complete guided reflection questions
- **Educational Content**: Complete learning modules with quizzes
- **Goal Setting**: Set and review SMART goals
- **Custom Tasks**: Flexible tasks defined by coaches

### 📋 **Task Management Features**
- **Task Assignment**: Coaches assign tasks to specific trainees
- **Due Dates & Scheduling**: Flexible scheduling with start and due dates
- **Priority Levels**: Low, Medium, High, and Urgent priority classification
- **Recurring Tasks**: Daily, weekly, monthly, or custom recurrence patterns
- **Task Status Tracking**: Pending, In Progress, Completed, Overdue, Cancelled
- **Points System**: Reward completion with customizable point values
- **Approval Workflow**: Optional coach approval for task submissions

### 📱 **Trainee Experience**
- **Homepage Integration**: Quick access to urgent and due tasks
- **Task Page**: Comprehensive task management interface
- **Quick Submission**: Simple completion for basic tasks
- **Detailed Submission**: Rich data entry for complex tasks
- **Progress Tracking**: Visual progress indicators and statistics
- **Notification System**: Reminders and due date alerts

### 👨‍🏫 **Coach Management**
- **Bulk Task Creation**: Assign tasks to multiple trainees
- **Task Templates**: Reusable task configurations
- **Submission Review**: Approve, reject, or request revisions
- **Progress Monitoring**: Track trainee engagement and completion rates
- **Analytics Dashboard**: Task completion statistics and insights

## Entity Structure

### 1. **TaskEntity**
```typescript
{
  id: string;
  title: string;
  description?: string;
  taskType: TaskType; // workout, meal_log, weight_check, etc.
  coachId: string;
  traineeId: string;
  priority: TaskPriority; // low, medium, high, urgent
  status: TaskStatus; // pending, in_progress, completed, overdue, cancelled
  frequency: TaskFrequency; // once, daily, weekly, monthly, custom
  dueDate?: Date;
  startDate?: Date;
  estimatedMinutes?: number;
  taskConfig?: TaskConfig; // Type-specific configuration
  instructions?: string;
  tags: string[];
  points: number;
  isVisible: boolean;
  requiresApproval: boolean;
  maxSubmissions: number;
  allowLateSubmission: boolean;
  reminderSettings?: ReminderSettings;
  recurrencePattern?: RecurrencePattern;
  completionData?: CompletionData;
}
```

### 2. **TaskSubmissionEntity**
```typescript
{
  id: string;
  taskId: string;
  submittedById: string;
  status: SubmissionStatus; // submitted, approved, rejected, needs_revision
  submissionData: SubmissionData; // Type-specific submission data
  notes?: string;
  attachments: string[];
  timeTaken?: number;
  difficultyRating?: number;
  satisfactionRating?: number;
  reviewedById?: string;
  coachFeedback?: string;
  coachRating?: number;
  pointsAwarded: number;
  isLatest: boolean;
  submissionNumber: number;
}
```

## API Endpoints

### **Task Management**
```
POST   /api/v1/tasks                      - Create new task
GET    /api/v1/tasks                      - List tasks with filtering
GET    /api/v1/tasks/:id                  - Get task details
PUT    /api/v1/tasks/:id                  - Update task
DELETE /api/v1/tasks/:id                  - Delete task
```

### **Task Submission**
```
POST   /api/v1/tasks/submit               - Submit task completion
POST   /api/v1/tasks/quick-submit         - Quick task completion
GET    /api/v1/tasks/submissions/list     - List submissions
PUT    /api/v1/tasks/submissions/:id/review - Review submission
```

### **Dashboard & Analytics**
```
GET    /api/v1/tasks/dashboard/summary    - Task summary statistics
GET    /api/v1/tasks/homepage/tasks       - Homepage task display
GET    /api/v1/tasks/overdue/list         - Overdue tasks
GET    /api/v1/tasks/due-today/list       - Tasks due today
```

### **Bulk Operations**
```
POST   /api/v1/tasks/bulk-action          - Bulk task actions
GET    /api/v1/tasks/trainee/:traineeId   - Tasks for specific trainee
GET    /api/v1/tasks/review/pending       - Submissions pending review
```

## Task Types & Configurations

### **1. Workout Tasks**
```json
{
  "taskType": "workout",
  "taskConfig": {
    "workout": {
      "workoutId": "uuid",
      "targetSets": 3,
      "targetReps": 12,
      "targetWeight": 50,
      "targetDuration": 45,
      "notes": "Focus on form over weight"
    }
  }
}
```

**Submission Data:**
```json
{
  "workout": {
    "actualSets": 3,
    "actualReps": [12, 10, 8],
    "actualWeight": [50, 52.5, 55],
    "duration": 48,
    "difficulty": 7,
    "notes": "Felt strong today, increased weight on last set",
    "exerciseCompletions": [
      {
        "exerciseId": "uuid",
        "completed": true,
        "sets": 3,
        "reps": [12, 10, 8],
        "weight": [50, 52.5, 55],
        "notes": "Good form maintained"
      }
    ]
  }
}
```

### **2. Meal Logging Tasks**
```json
{
  "taskType": "meal_log",
  "taskConfig": {
    "mealLog": {
      "mealsToLog": ["breakfast", "lunch", "dinner"],
      "includePhotos": true,
      "trackMacros": true,
      "specificMeals": ["uuid1", "uuid2"]
    }
  }
}
```

**Submission Data:**
```json
{
  "mealLog": {
    "meals": [
      {
        "type": "breakfast",
        "foods": ["oatmeal", "banana", "protein powder"],
        "calories": 450,
        "macros": { "protein": 30, "carbs": 60, "fat": 8 },
        "photo": "breakfast-photo-url.jpg",
        "time": "08:00",
        "notes": "Felt satisfied and energized"
      }
    ],
    "totalCalories": 2150,
    "totalMacros": { "protein": 150, "carbs": 200, "fat": 70 },
    "waterIntake": 2.5
  }
}
```

### **3. Weight Check Tasks**
```json
{
  "taskType": "weight_check",
  "taskConfig": {
    "weightCheck": {
      "unit": "kg",
      "timeOfDay": "morning",
      "instructions": "Weigh yourself first thing in the morning after using the bathroom",
      "targetWeight": 75
    }
  }
}
```

**Submission Data:**
```json
{
  "weightCheck": {
    "weight": 75.2,
    "unit": "kg",
    "timeOfDay": "morning",
    "notes": "Measured after bathroom, before breakfast",
    "trend": "stable"
  }
}
```

### **4. Progress Photo Tasks**
```json
{
  "taskType": "progress_photo",
  "taskConfig": {
    "progressPhoto": {
      "angles": ["front", "side", "back"],
      "lighting": "Natural lighting preferred",
      "clothing": "Minimal, consistent clothing",
      "location": "Same location each time"
    }
  }
}
```

### **5. Habit Tracking Tasks**
```json
{
  "taskType": "habit_tracking",
  "taskConfig": {
    "habitTracking": {
      "habits": [
        { "name": "Drink 8 glasses of water", "targetCount": 8 },
        { "name": "Sleep 8 hours", "targetHours": 8 },
        { "name": "Take vitamins", "targetCount": 1 }
      ]
    }
  }
}
```

## Usage Examples

### **Creating a Workout Task**
```typescript
const workoutTask = await taskService.createTask(coachId, {
  title: "Upper Body Strength Training",
  description: "Complete your upper body workout with focus on proper form",
  taskType: TaskType.WORKOUT,
  traineeId: "trainee-uuid",
  priority: TaskPriority.HIGH,
  frequency: TaskFrequency.WEEKLY,
  dueDate: "2025-06-16T18:00:00Z",
  estimatedMinutes: 60,
  taskConfig: {
    workout: {
      workoutId: "workout-uuid",
      targetSets: 3,
      targetReps: 12,
      notes: "Focus on controlled movements"
    }
  },
  points: 50,
  requiresApproval: true,
  reminderSettings: {
    enabled: true,
    beforeDue: 120, // 2 hours before
    frequency: "once",
    methods: ["push", "email"]
  }
});
```

### **Submitting a Task**
```typescript
const submission = await taskService.submitTask(traineeId, {
  taskId: "task-uuid",
  submissionData: {
    workout: {
      actualSets: 3,
      actualReps: [12, 10, 8],
      actualWeight: [50, 52.5, 55],
      duration: 55,
      difficulty: 7,
      notes: "Great workout, felt strong throughout"
    }
  },
  notes: "Completed as planned, ready for next session",
  timeTaken: 55,
  difficultyRating: 7,
  satisfactionRating: 9
});
```

### **Quick Task Submission**
```typescript
const quickSubmission = await taskService.quickSubmitTask(traineeId, {
  taskId: "task-uuid",
  completed: true,
  notes: "Completed successfully",
  rating: 8
});
```

### **Creating Recurring Tasks**
```typescript
const recurringTask = await taskService.createTask(coachId, {
  title: "Daily Water Intake",
  taskType: TaskType.HABIT_TRACKING,
  traineeId: "trainee-uuid",
  frequency: TaskFrequency.DAILY,
  recurrencePattern: {
    interval: 1, // Every day
    maxOccurrences: 30, // 30 days
    daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
    exceptions: ["2025-06-20"] // Skip specific dates
  },
  taskConfig: {
    habitTracking: {
      habits: [
        { name: "Drink water", targetCount: 8, unit: "glasses" }
      ]
    }
  }
});
```

## Homepage Integration

### **Trainee Homepage**
The task system integrates seamlessly with the trainee homepage, displaying:

- **Urgent Tasks**: High/urgent priority tasks due soon
- **Due Today**: All tasks due today
- **In Progress**: Currently active tasks
- **Recent**: Recently assigned tasks

```typescript
const homepageTasks = await taskService.getHomepageTasks(traineeId, UserRole.TRAINEE);
// Returns: { urgent: [], dueToday: [], recent: [], inProgress: [] }
```

### **Coach Dashboard**
Coaches get comprehensive overview including:

- **Pending Reviews**: Submissions awaiting approval
- **Trainee Progress**: Completion rates per trainee
- **Overdue Tasks**: Tasks that need attention
- **Task Analytics**: Success rates and engagement metrics

## Task Status Workflow

```
PENDING → IN_PROGRESS → COMPLETED
    ↓           ↓           ↑
OVERDUE ← → CANCELLED → APPROVED
                           ↓
                    NEEDS_REVISION
```

### **Status Transitions**
1. **PENDING**: Task created, waiting to be started
2. **IN_PROGRESS**: Trainee has begun working on the task
3. **COMPLETED**: Task finished (auto or after approval)
4. **OVERDUE**: Past due date without completion
5. **CANCELLED**: Task cancelled by coach
6. **APPROVED**: Submission approved by coach
7. **NEEDS_REVISION**: Submission requires changes

## Points & Rewards System

### **Default Points by Task Type**
- **Workout**: 50 points
- **Meal Log**: 30 points
- **Weight Check**: 20 points
- **Progress Photo**: 40 points
- **Body Measurement**: 25 points
- **Habit Tracking**: 35 points
- **Reflection**: 25 points
- **Education**: 30 points
- **Goal Setting**: 40 points
- **Custom**: 20 points

### **Point Calculation**
- Points awarded upon completion (immediate or after approval)
- Bonus points for early completion
- Reduced points for late submission
- Coach can override point awards during review

## Notification & Reminder System

### **Reminder Types**
- **Due Date Reminders**: Configurable time before due date
- **Overdue Notifications**: Immediate notification when task becomes overdue
- **Completion Confirmation**: Acknowledgment of successful submission
- **Review Updates**: Notifications when submissions are reviewed

### **Delivery Methods**
- **Push Notifications**: Mobile app notifications
- **Email**: Detailed email reminders
- **SMS**: Quick text alerts
- **In-App**: Dashboard notifications

## Analytics & Reporting

### **Task Summary Statistics**
```typescript
{
  total: 150,
  pending: 25,
  inProgress: 15,
  completed: 95,
  overdue: 15,
  totalPoints: 3500,
  pointsEarned: 2800,
  completionRate: 80,
  dueToday: 5,
  dueThisWeek: 20,
  currentStreak: 7,
  longestStreak: 15
}
```

### **Trainee Engagement Metrics**
- **Completion Rate**: Percentage of tasks completed on time
- **Average Response Time**: Time from assignment to completion
- **Task Difficulty Ratings**: Trainee feedback on task difficulty
- **Satisfaction Scores**: Overall satisfaction with tasks
- **Streak Tracking**: Consecutive days of task completion

## Integration Points

### **With Workout Module**
- Validates workout IDs in task configurations
- Retrieves workout details for task display
- Tracks exercise-level completion data

### **With Meal Module**
- Validates meal IDs and meal plan references
- Integrates with nutrition tracking
- Supports meal photo documentation

### **With Notification Module**
- Sends task reminders and alerts
- Delivers completion notifications
- Provides review status updates

### **With User Module**
- Manages coach-trainee relationships
- Enforces role-based permissions
- Provides user profile data for task assignment

## Security & Permissions

### **Role-Based Access Control**
- **Coaches**: Create, update, delete, and review tasks for their trainees
- **Trainees**: View, submit, and update their assigned tasks
- **System**: Automated task status updates and recurring task creation

### **Data Privacy**
- Submission data is encrypted at rest
- Personal photos and measurements are securely stored
- Coach access is limited to their assigned trainees

## Performance Optimizations

### **Database Indexing**
- Indexed on frequently queried fields (userId, status, dueDate, taskType)
- Optimized queries for dashboard and homepage data
- Efficient pagination for large task lists

### **Caching Strategy**
- Homepage tasks cached for 5 minutes
- Task summary statistics cached for 15 minutes
- Task type configurations cached for 1 hour

### **Background Processing**
- Automated overdue task detection runs hourly
- Recurring task creation happens asynchronously
- Notification delivery is queued for reliability

## Future Enhancements

### **AI-Powered Features**
- **Smart Task Suggestions**: AI-recommended tasks based on trainee progress
- **Optimal Scheduling**: Machine learning for ideal task timing
- **Difficulty Adjustment**: Automatic difficulty scaling based on completion patterns

### **Gamification**
- **Achievement Badges**: Unlock badges for task completion milestones
- **Leaderboards**: Trainee rankings based on points and streaks
- **Challenges**: Group challenges and competitions

### **Advanced Analytics**
- **Predictive Analytics**: Predict task completion probability
- **Trend Analysis**: Long-term progress trend identification
- **Custom Reports**: Coach-defined reporting dashboards

The Task Management Module provides a comprehensive foundation for trainee engagement, progress tracking, and structured coaching guidance. It seamlessly integrates with the existing ecosystem while providing powerful tools for both coaches and trainees to achieve their fitness goals.
