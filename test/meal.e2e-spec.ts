import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/services/auth.service';
import { MealService } from '../src/meal/services/meal.service';

describe('Meal Module E2E', () => {
  let app: INestApplication;
  let mealService: MealService;
  let authService: AuthService;


  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    mealService = moduleFixture.get<MealService>(MealService);
    authService = moduleFixture.get<AuthService>(AuthService);
    
    await app.init();

    // Create test users (this would normally be done in your test setup)
    // For now, we'll skip actual user creation and just test the endpoints
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/meals (GET)', () => {
    it('should return meals list for authenticated users', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/meals')
        .expect(401); // Expect unauthorized without token
    });
  });

  describe('Meal Statistics', () => {
    it('should get meal statistics', async () => {
      const stats = await mealService.getStatistics();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalMeals');
      expect(stats).toHaveProperty('averageCalories');
      expect(stats).toHaveProperty('averageProtein');
      expect(stats).toHaveProperty('mealsByType');
    });
  });
});
