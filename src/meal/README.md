# Meal Module Documentation

## Overview
The Meal Module provides comprehensive meal management functionality for the coaching platform with role-based access control. Coaches can manage meals with full CRUD operations, while clients have read-only access.

## Features

### 🍽️ Meal Management
- **Create, Read, Update, Delete** operations for meals
- **Role-based access control** (Coaches: full CRUD, Clients: read-only)
- **Comprehensive nutrition tracking** (calories, protein, fat, carbs)
- **Meal categorization** by type (breakfast, lunch, dinner, snacks, drinks)
- **Detailed ingredients and preparation instructions**
- **Image support** for meal visualization

### 🔍 Advanced Querying
- **Pagination** support with customizable page size
- **Filtering** by meal type, calorie ranges, protein content
- **Search functionality** across meal names and descriptions
- **Sorting** by various nutritional parameters

### 📊 Analytics
- **Nutritional statistics** and averages
- **Meal distribution** by type
- **Performance metrics** for meal database

## API Endpoints

### Public Endpoints (Authenticated Users)
```
GET    /api/v1/meals                 # Get meals with pagination and filters
GET    /api/v1/meals/:id             # Get specific meal details
GET    /api/v1/meals/statistics      # Get meal statistics
```

### Coach-Only Endpoints
```
POST   /api/v1/meals                 # Create new meal
PUT    /api/v1/meals/:id             # Update existing meal
DELETE /api/v1/meals/:id             # Delete meal
```

## Data Model

### Meal Entity
```typescript
{
  id: string;                    // UUID primary key
  name: string;                  // Meal name
  description?: string;          // Optional description
  calories: number;              // Caloric content
  protein: number;               // Protein content (grams)
  fat: number;                   // Fat content (grams)
  carbs: number;                 // Carbohydrate content (grams)
  ingredients: string[];         // List of ingredients
  preparation?: string;          // Preparation instructions
  imageUrl?: string;             // Optional image URL
  mealType: MealType;           // Meal category
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Update timestamp
}
```

### Meal Types
- `BREAKFAST` - Morning meals
- `LUNCH` - Midday meals  
- `DINNER` - Evening meals
- `SNACKS` - Small meals/snacks
- `DRINKS` - Beverages and smoothies

## Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

### Filtering
- `mealType` - Filter by meal type
- `minCalories` - Minimum calorie threshold
- `maxCalories` - Maximum calorie threshold
- `minProtein` - Minimum protein threshold
- `search` - Search in name and description

### Sorting
- `sortBy` - Field to sort by (calories, protein, name, createdAt)
- `sortOrder` - ASC or DESC

## Authentication & Authorization

### Guards Applied
- **JwtAuthGuard** - Ensures user is authenticated
- **RolesGuard** - Enforces role-based access control

### Role Permissions
- **COACH** - Full CRUD operations on all meals
- **CLIENT** - Read-only access to all meals

## Database Schema

### Table: `meals`
```sql
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  calories DECIMAL(8,2) NOT NULL,
  protein DECIMAL(8,2) NOT NULL,
  fat DECIMAL(8,2) NOT NULL,
  carbs DECIMAL(8,2) NOT NULL,
  ingredients TEXT[] NOT NULL,
  preparation TEXT,
  image_url VARCHAR,
  meal_type meal_type_enum NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_meals_meal_type ON meals(meal_type);
CREATE INDEX idx_meals_calories ON meals(calories);
CREATE INDEX idx_meals_protein ON meals(protein);
CREATE INDEX idx_meals_name ON meals(name);
```

## Validation Rules

### CreateMealDto
- `name`: Required, 1-100 characters
- `calories`: Required, positive number, max 9999.99
- `protein`: Required, positive number, max 999.99
- `fat`: Required, positive number, max 999.99
- `carbs`: Required, positive number, max 999.99
- `ingredients`: Required array with 1-50 items
- `mealType`: Required, valid enum value
- `description`: Optional, max 500 characters
- `preparation`: Optional, max 2000 characters
- `imageUrl`: Optional, valid URL format

## Usage Examples

### Get Meals with Filters
```typescript
GET /api/v1/meals?mealType=BREAKFAST&minCalories=300&maxCalories=500&page=1&limit=5
```

### Create New Meal (Coach Only)
```typescript
POST /api/v1/meals
{
  "name": "Protein Smoothie",
  "description": "High-protein post-workout smoothie",
  "calories": 285,
  "protein": 25.8,
  "fat": 4.2,
  "carbs": 38.5,
  "ingredients": ["1 scoop protein powder", "1 banana", "1 cup almond milk"],
  "preparation": "Blend all ingredients until smooth",
  "mealType": "DRINKS"
}
```

### Search Meals
```typescript
GET /api/v1/meals?search=chicken&sortBy=protein&sortOrder=DESC
```

## Sample Data

The module includes a comprehensive seeding script with 15 sample meals covering all meal types:

### Breakfast Options
- Protein Power Breakfast (420 cal, 32.5g protein)
- Overnight Oats Delight (380 cal, 15.2g protein)
- Green Smoothie Bowl (290 cal, 8.5g protein)

### Lunch Options  
- Mediterranean Quinoa Bowl (485 cal, 18.7g protein)
- Grilled Chicken & Sweet Potato (520 cal, 42.8g protein)
- Asian Salmon Salad (445 cal, 35.2g protein)

### Dinner Options
- Herb-Crusted Cod with Vegetables (380 cal, 38.2g protein)
- Turkey & Vegetable Stir-Fry (465 cal, 32.5g protein)
- Lentil Curry with Cauliflower Rice (385 cal, 22.8g protein)

### Snacks
- Greek Yogurt Parfait (185 cal, 12.5g protein)
- Hummus & Veggie Plate (165 cal, 7.2g protein)
- Apple Almond Butter Slices (195 cal, 6.8g protein)

### Drinks
- Green Detox Smoothie (120 cal, 3.2g protein)
- Post-Workout Protein Shake (285 cal, 25.8g protein)
- Herbal Iced Tea (15 cal, 0.2g protein)

## Running Seeds

To populate the database with sample meals:

```bash
# Run all seeds
npm run seed

# Run only meal seeds
npm run seed:meals
```

## Database Migration

To create the meals table:

```bash
# Run pending migrations
npm run migration:run
```

## Error Handling

The module provides comprehensive error handling:

- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Meal not found
- **409 Conflict** - Duplicate meal names
- **500 Internal Server Error** - Server errors

## Testing

Run the meal module tests:

```bash
# Unit tests
npm run test meal

# E2E tests
npm run test:e2e meal
```

## Swagger Documentation

The API is fully documented with Swagger/OpenAPI specifications. Access the documentation at:
```
GET /api/docs
```

All endpoints include:
- Parameter descriptions
- Request/response schemas
- Authentication requirements
- Role-based access indicators
- Example requests and responses
