# Template Module

## Overview

The Template Module is a comprehensive training template system that allows coaches to create complete fitness programs combining daily workouts and meal plans. It features intelligent template recommendations based on trainee profiles and provides a complete end-to-end solution for fitness coaching.

## Features

### 🎯 **Complete Training Templates**
- **Daily Schedules**: Combine workouts and meals for each day of the program
- **Weekly Structure**: Organize programs by weeks with flexible duration (1-52 weeks)
- **Time Slots**: Schedule workouts for morning, afternoon, or evening
- **Rest Days**: Designated rest days with optional light activities
- **Supplements**: Include supplement schedules with timing and dosage

### 🧠 **AI-Powered Recommendations**
- **Profile Matching**: Automatically match templates to trainee profiles
- **Scoring Algorithm**: 100-point scoring system based on multiple criteria
- **Confidence Levels**: Recommendation confidence based on historical success
- **Success Prediction**: Probability calculations based on past performance

### 🎛️ **Advanced Customization**
- **Template Modifications**: Replace workouts/meals for specific trainees
- **Nutrition Adjustments**: Modify calorie and macro targets
- **Schedule Changes**: Adjust timing to fit trainee availability
- **Equipment Substitutions**: Handle equipment limitations

### 📊 **Progress Tracking**
- **Weekly Progress**: Track adherence, weight changes, energy levels
- **Auto-Adjustments**: System-driven difficulty and calorie adjustments
- **Completion Tracking**: Monitor workout and meal completion rates
- **Feedback Collection**: Gather trainee ratings and feedback

## Entities

### 1. **TemplateEntity**
```typescript
{
  id: string;
  name: string;
  templateType: TemplateType; // weight_loss, muscle_gain, etc.
  difficulty: DifficultyLevel; // beginner, intermediate, advanced
  durationWeeks: number;
  schedule: {
    [week]: {
      [day]: {
        workouts: WorkoutScheduleItem[];
        meals: MealScheduleItem[];
        restDay: boolean;
        supplements?: SupplementItem[];
      }
    }
  };
  targetCriteria: TargetCriteria; // Age, gender, goals, etc.
  nutritionTargets: NutritionTargets;
  fitnessTargets: FitnessTargets;
  equipmentRequired: string[];
  usageCount: number;
  averageRating: number;
  successRate: number;
}
```

### 2. **TemplateAssignmentEntity**
```typescript
{
  id: string;
  templateId: string;
  traineeId: string;
  status: AssignmentStatus; // scheduled, active, completed, etc.
  startDate: Date;
  endDate: Date;
  customizations?: Customizations;
  progress?: ProgressTracking;
  autoAdjustments?: AutoAdjustments;
}
```

### 3. **TemplateRecommendationEntity**
```typescript
{
  id: string;
  templateId: string;
  traineeId: string;
  score: number; // 0-100
  confidence: number; // 0-100
  matchingDetails: DetailedMatching;
  viewed: boolean;
  accepted: boolean;
  dismissed: boolean;
}
```

## API Endpoints

### **Template Management**
```
POST   /api/v1/templates                    - Create template
GET    /api/v1/templates                    - List coach templates
GET    /api/v1/templates/public             - Browse public templates
GET    /api/v1/templates/:id                - Get template details
PUT    /api/v1/templates/:id                - Update template
DELETE /api/v1/templates/:id                - Delete template
```

### **Template Assignment**
```
POST   /api/v1/templates/assign             - Assign template to trainee
GET    /api/v1/templates/assignments/list   - List assignments
PUT    /api/v1/templates/assignments/:id/progress - Update progress
```

### **AI Recommendations**
```
GET    /api/v1/templates/recommendations/:traineeId - Get recommendations
```

## Template Recommendation Algorithm

### **Scoring Criteria (Weighted)**

1. **Age Matching (15%)**
   - Perfect match: 100 points
   - Partial match: Reduced based on distance from range

2. **Goals Alignment (30%)**
   - Exact goal overlap: 100 points
   - Partial overlap: Proportional scoring

3. **Fitness Level (20%)**
   - Exact match: 100 points
   - Adjacent level: 70 points
   - Two levels apart: 40 points

4. **Equipment Availability (25%)**
   - All equipment available: 100 points
   - Proportional reduction for missing equipment

5. **Time Availability (10%)**
   - Fits schedule perfectly: 100 points
   - Close fit: 70 points
   - Poor fit: 30 points

### **Example Recommendation**
```json
{
  "templateId": "uuid",
  "traineeId": "uuid",
  "score": 87,
  "confidence": 92,
  "reason": "Excellent match! Aligns with your muscle gain goals, matches your intermediate fitness level, you have all required equipment.",
  "matchingDetails": {
    "criteriaMatches": {
      "age": { "matched": true, "score": 100 },
      "goals": { "matched": true, "score": 95, "overlap": ["muscle_gain"] },
      "fitnessLevel": { "matched": true, "score": 100 },
      "equipment": { "matched": true, "score": 100 }
    },
    "successProbability": 89,
    "potentialChallenges": ["High time commitment"],
    "suggestedModifications": ["Consider reducing workout frequency"]
  }
}
```

## Template Creation Example

### **Basic Template Structure**
```json
{
  "name": "Beginner Muscle Gain Program",
  "templateType": "muscle_gain",
  "difficulty": "beginner",
  "durationWeeks": 12,
  "schedule": {
    "week1": {
      "day1": {
        "workouts": [
          {
            "workoutId": "uuid",
            "timeSlot": "morning",
            "duration": 60,
            "notes": "Focus on form over weight"
          }
        ],
        "meals": [
          {
            "mealId": "uuid",
            "mealType": "breakfast",
            "portion": 1.0
          },
          {
            "mealId": "uuid",
            "mealType": "post_workout",
            "portion": 1.0,
            "timing": "within 30 minutes after workout"
          }
        ],
        "restDay": false,
        "supplements": [
          {
            "name": "Whey Protein",
            "dosage": "25g",
            "timing": "post-workout"
          }
        ]
      }
    }
  },
  "targetCriteria": {
    "ageRange": { "min": 18, "max": 35 },
    "gender": ["male", "female"],
    "fitnessLevel": ["beginner"],
    "goals": ["muscle_gain"],
    "equipmentRequired": ["dumbbells", "bench"]
  },
  "nutritionTargets": {
    "dailyCalories": 2500,
    "protein": 150,
    "carbs": 300,
    "fat": 80
  },
  "fitnessTargets": {
    "primaryGoals": ["Increase muscle mass", "Build strength"],
    "expectedOutcomes": {
      "weightChange": 3,
      "strengthIncrease": 25
    }
  }
}
```

## Assignment Customization

### **Workout Modifications**
```json
{
  "modifiedWorkouts": [
    {
      "originalWorkoutId": "uuid1",
      "replacementWorkoutId": "uuid2",
      "reason": "Knee injury - low impact alternative",
      "week": 1,
      "day": 3
    }
  ]
}
```

### **Nutrition Adjustments**
```json
{
  "nutritionAdjustments": {
    "dailyCalories": 2200,
    "protein": 140,
    "reason": "Lower calorie needs for weight maintenance"
  }
}
```

## Progress Tracking

### **Weekly Progress Entry**
```json
{
  "week": 4,
  "workoutAdherence": 85,
  "nutritionAdherence": 78,
  "weightChange": 1.2,
  "energyLevel": 8,
  "satisfaction": 9,
  "notes": "Feeling stronger, sleep improving"
}
```

### **Auto-Adjustments**
The system automatically adjusts templates based on:
- **Low Adherence**: Reduce difficulty/frequency
- **High Performance**: Increase challenge
- **Poor Energy Levels**: Adjust calories/rest
- **Plateau**: Modify exercise selection

## Integration Points

### **With Workout Module**
- Validates workout IDs in template schedules
- Retrieves workout details for display
- Tracks workout completion

### **With Meal Module**
- Validates meal IDs in template schedules
- Calculates nutritional totals
- Tracks meal adherence

### **With User Module**
- Accesses trainee profiles for recommendations
- Stores coach-trainee relationships
- Manages role-based permissions

## Usage Examples

### **Create and Assign Template**
```typescript
// 1. Create template
const template = await templateService.createTemplate(coachId, {
  name: "8-Week Fat Loss",
  templateType: TemplateType.WEIGHT_LOSS,
  durationWeeks: 8,
  // ... rest of template data
});

// 2. Get recommendations for trainee
const recommendations = await templateService.getTemplateRecommendations(
  coachId, 
  traineeId
);

// 3. Assign recommended template
const assignment = await templateService.assignTemplate(coachId, {
  templateId: recommendations.recommendations[0].template.id,
  traineeId,
  startDate: "2025-06-15",
  customizations: {
    nutritionAdjustments: {
      dailyCalories: 1800,
      reason: "Lower calorie target for faster results"
    }
  }
});
```

### **Track Progress**
```typescript
// Update weekly progress
await templateService.updateAssignmentProgress(coachId, {
  assignmentId: assignment.id,
  currentWeek: 4,
  currentDay: 3,
  completedWorkouts: 10,
  completedMeals: 78,
  adherencePercentage: 85,
  weightChange: -2.5,
  energyLevel: 8,
  satisfaction: 9
});
```

## Benefits

### **For Coaches**
- **Time Saving**: Reuse successful templates across multiple trainees
- **Personalization**: Customize templates for individual needs
- **Analytics**: Track success rates and optimize templates
- **Scaling**: Manage more trainees efficiently

### **For Trainees**
- **Structured Programs**: Clear daily guidance for workouts and nutrition
- **Personalization**: Templates matched to their specific profile
- **Progress Tracking**: Visual progress monitoring and feedback
- **Consistency**: Proven programs with historical success data

### **For the Platform**
- **Data Collection**: Rich dataset for improving recommendations
- **User Engagement**: Higher adherence through personalization
- **Success Metrics**: Measurable outcomes and satisfaction
- **Scalability**: Efficient resource utilization

The Template Module represents the core intelligence of the coaching platform, transforming individual workout and meal components into comprehensive, personalized fitness programs that adapt to each trainee's unique needs and progress.
