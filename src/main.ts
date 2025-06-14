import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for mobile application
  app.enableCors();

  // API versioning prefix
  app.setGlobalPrefix('api/v1');

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Coach App Backend API')
    .setDescription(
      `
      # Coach App Backend API Documentation
      
      This is the comprehensive API documentation for the Coach App Backend system.
      
      ## Features
      - **Authentication & Authorization**: JWT-based authentication with role-based access
      - **User Management**: User registration, profile management, and role-based features
      - **Coach Management**: Coach profiles, certifications, availability, and onboarding
      - **Trainee Management**: Trainee profiles, progress tracking, and subscription management
      - **Messaging System**: Real-time messaging between coaches and trainees with WebSocket support
      - **Progress Tracking**: Comprehensive progress tracking with daily, weekly, and monthly reports
      - **Meal Planning**: Meal management and nutrition tracking
      - **Workout Plans**: Workout plan creation and management
      - **Dashboard Analytics**: Statistics and insights for coaches
      - **File Uploads**: Profile pictures, certificates, and progress photos
      - **CSV Import**: Bulk trainee import functionality
      
      ## Getting Started
      1. Register as a coach or trainee
      2. Complete your profile setup
      3. Start using the coaching platform features
      
      ## Authentication
      Most endpoints require authentication. Use the "Authorize" button to add your JWT token.
    `,
    )
    .setVersion('2.0.0')
    .setContact(
      'Coach App Team',
      'https://coach-app.com',
      'support@coach-app.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.coach-app.com', 'Production Server')
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User profile and management endpoints')
    .addTag('Coaches', 'Coach profile, certification, and management endpoints')
    .addTag(
      'Subscribed Trainees',
      'Trainee management, filtering, and CSV import functionality',
    )
    .addTag(
      'Trainee Profile',
      'Detailed trainee profile, progress tracking, and reports',
    )
    .addTag(
      'Messages',
      'Real-time messaging system between coaches and trainees',
    )
    .addTag(
      'Dashboard',
      'Analytics, statistics, and dashboard data for coaches',
    )
    .addTag('Meals', 'Meal planning and nutrition management')
    .addTag('Workouts', 'Workout plan creation and management')
    .addTag('Notifications', 'Push notifications and alert management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT Token',
        description: 'Enter your JWT token obtained from the login endpoint',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Enhanced Swagger UI options
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Coach App API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper .link { 
        content: url('https://coach-app.com/logo.png'); 
        width: 120px; 
        height: auto; 
      }
      .swagger-ui .topbar { 
        background-color: #1976d2; 
      }
      .swagger-ui .info .title {
        color: #1976d2;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Application is running on: ${baseUrl}`);
  console.log(`📚 API Documentation (Swagger): ${baseUrl}/api/docs`);
  console.log(`🔗 WebSocket Gateway: ws://localhost:${port}`);
}
bootstrap();
