import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1750448834873 implements MigrationInterface {
  name = 'InitialMigration1750448834873';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "target_audiences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_f3d38ceec53c6c09952ca2fdf83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "features" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, CONSTRAINT "PK_5c1e336df2f4a7051e5bf08a941" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "discount_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "percentage" numeric(5,2), "description" character varying, CONSTRAINT "PK_7ea0bc24dadf997c6972854c3ba" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workouts_workouttype_enum" AS ENUM('strength', 'cardio', 'flexibility')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workouts_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "exercises" jsonb NOT NULL, "workoutType" "public"."workouts_workouttype_enum" NOT NULL, "duration" integer NOT NULL, "difficulty" "public"."workouts_difficulty_enum" NOT NULL, "media" jsonb NOT NULL DEFAULT '[]', "caloriesBurned" integer, "equipment" text array NOT NULL DEFAULT '{}', "targetMuscleGroups" text array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b2319bf64a674d40237dbb1697" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f610bb716b9281f07dd9c11d9f" ON "workouts" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d84c274214f1881d1b9469841a" ON "workouts" ("workoutType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d1f61c30f0601093f80c5b053" ON "workouts" ("duration") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f371d2426c88d4cafeec9b4f0f" ON "workouts" ("difficulty") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('trainee', 'coach', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'trainee', "isActive" boolean NOT NULL DEFAULT true, "isEmailVerified" boolean NOT NULL DEFAULT false, "emailVerificationToken" character varying, "emailVerificationExpires" TIMESTAMP, "isPhoneVerified" boolean NOT NULL DEFAULT false, "phoneVerificationCode" character varying, "phoneVerificationExpires" TIMESTAMP, "refreshToken" character varying, "refreshTokenExpires" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_plans_plantype_enum" AS ENUM('weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_plans_status_enum" AS ENUM('draft', 'active', 'completed', 'paused')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "planType" "public"."workout_plans_plantype_enum" NOT NULL, "durationWeeks" integer NOT NULL, "workoutsPerWeek" integer NOT NULL, "coachId" uuid NOT NULL, "traineeId" uuid, "status" "public"."workout_plans_status_enum" NOT NULL DEFAULT 'draft', "schedule" jsonb NOT NULL, "goals" jsonb NOT NULL, "prerequisites" text array NOT NULL DEFAULT '{}', "equipment" text array NOT NULL DEFAULT '{}', "difficultyProgression" jsonb NOT NULL, "isTemplate" boolean NOT NULL DEFAULT false, "usageCount" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "startDate" date, "endDate" date, CONSTRAINT "PK_9ae1bdd02db446a7541e2e5b161" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_400375a1e2cfb4a0fe363b1b73" ON "workout_plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2c210a5f39dc39135e7fca9ccd" ON "workout_plans" ("planType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a01a994e3e18c920b5ec44752e" ON "workout_plans" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d2aeb70265e4bb1f7fca583ecb" ON "workout_plans" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c4487fdb9015c70a67d21394c3" ON "workout_plans" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workout_sessions_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'skipped', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workoutId" uuid NOT NULL, "workoutPlanId" uuid, "traineeId" uuid NOT NULL, "coachId" uuid, "status" "public"."workout_sessions_status_enum" NOT NULL DEFAULT 'scheduled', "scheduledAt" TIMESTAMP NOT NULL, "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "actualDuration" integer, "exerciseData" jsonb NOT NULL DEFAULT '[]', "sessionRating" integer, "traineeNotes" text, "coachFeedback" text, "caloriesBurned" integer, "heartRateData" jsonb, "planWeek" integer, "planDay" integer, "isMakeupSession" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eea00e05dc78d40b55a588c9f57" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82cab13dc713bfb0cff9bb76c5" ON "workout_sessions" ("workoutId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b238a1412ceaa33ad9eaa0fe50" ON "workout_sessions" ("workoutPlanId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_483ef263ab35975d9120a306a0" ON "workout_sessions" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f4c037a76bc4584cef6bcf939f" ON "workout_sessions" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac620b163a93d66b4282a4e34c" ON "workout_sessions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6d1479eb9e8db77e13eddcd70" ON "workout_sessions" ("scheduledAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workout_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workoutPlanId" uuid NOT NULL, "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "customizations" jsonb, "instructions" text, "priority" integer NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a34d177b6b4e1b278a40ae00d9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0f3ec9290d536ae8fde24753f0" ON "workout_assignments" ("workoutPlanId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_81992da012ec8a002fd435b0e3" ON "workout_assignments" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92c9d441c288c0a1dd4eaf4cc9" ON "workout_assignments" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7cd51efb36ca09be96477d3393" ON "workout_assignments" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0a568ca9e4b5c0dc4c29a9a81" ON "workout_assignments" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_templatetype_enum" AS ENUM('weight_loss', 'muscle_gain', 'strength_building', 'endurance', 'general_fitness', 'cutting', 'bulking', 'maintenance', 'rehabilitation', 'beginner_program', 'intermediate_program', 'advanced_program')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_status_enum" AS ENUM('draft', 'active', 'archived', 'published')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."templates_difficulty_enum" AS ENUM('beginner', 'intermediate', 'advanced')`,
    );
    await queryRunner.query(
      `CREATE TABLE "templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "templateType" "public"."templates_templatetype_enum" NOT NULL, "coachId" uuid NOT NULL, "status" "public"."templates_status_enum" NOT NULL DEFAULT 'draft', "durationWeeks" integer NOT NULL, "difficulty" "public"."templates_difficulty_enum" NOT NULL, "schedule" jsonb NOT NULL, "targetCriteria" jsonb NOT NULL, "nutritionTargets" jsonb NOT NULL, "fitnessTargets" jsonb NOT NULL, "equipmentRequired" text array NOT NULL DEFAULT '{}', "prerequisites" jsonb, "tags" text array NOT NULL DEFAULT '{}', "isPublic" boolean NOT NULL DEFAULT false, "usageCount" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "ratingCount" integer NOT NULL DEFAULT '0', "estimatedWeeklyCost" numeric(8,2), "successRate" numeric(5,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "publishedAt" TIMESTAMP, CONSTRAINT "PK_515948649ce0bbbe391de702ae5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5624219dd33b4644599d4d4b23" ON "templates" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56d512b37178cdc2b10f1592cc" ON "templates" ("templateType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b77a6e77bf029854287fd12db" ON "templates" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3b6caf43de736d35830a3b973b" ON "templates" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84d69471a288d1efc5ebd9fa41" ON "templates" ("difficulty") `,
    );
    await queryRunner.query(
      `CREATE TABLE "template_recommendations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "templateId" uuid NOT NULL, "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "score" numeric(5,2) NOT NULL, "matchingDetails" jsonb NOT NULL, "reason" text NOT NULL, "confidence" numeric(5,2) NOT NULL, "viewed" boolean NOT NULL DEFAULT false, "accepted" boolean NOT NULL DEFAULT false, "dismissed" boolean NOT NULL DEFAULT false, "coachFeedback" text, "isAutoGenerated" boolean NOT NULL DEFAULT true, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "viewedAt" TIMESTAMP, "acceptedAt" TIMESTAMP, "dismissedAt" TIMESTAMP, CONSTRAINT "PK_7a9f1d896536bd29520daf47975" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_158dae7598be8adcddd8938b40" ON "template_recommendations" ("templateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_44903061db2039720bf2cf3e03" ON "template_recommendations" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22c83e3508f19dab32fb0306d2" ON "template_recommendations" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_341fa88855a4f3e5298f995030" ON "template_recommendations" ("score") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_639f094dcfb3e65f117dbfd2c8" ON "template_recommendations" ("viewed") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d1d169b5de37f50678cd0fc5b7" ON "template_recommendations" ("accepted") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8df8d567fcd953e2d972fa0a88" ON "template_recommendations" ("dismissed") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."template_assignments_status_enum" AS ENUM('scheduled', 'active', 'paused', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "template_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "templateId" uuid NOT NULL, "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "status" "public"."template_assignments_status_enum" NOT NULL DEFAULT 'scheduled', "startDate" date NOT NULL, "endDate" date NOT NULL, "customizations" jsonb, "instructions" text, "priority" integer NOT NULL DEFAULT '1', "progress" jsonb, "autoAdjustments" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "actualStartDate" TIMESTAMP, "completedAt" TIMESTAMP, CONSTRAINT "PK_0a6dab5a9e55a1f3906f709961e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0341a4fc5b964a86148f39498b" ON "template_assignments" ("templateId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f6d6a19f3988abdad28f30e467" ON "template_assignments" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_91b2dc13da17d0d5a80aeb48f3" ON "template_assignments" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2537eced6fbf07ea434bda553" ON "template_assignments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_05de962d6a82e65f7e187a729b" ON "template_assignments" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_submissions_status_enum" AS ENUM('submitted', 'approved', 'rejected', 'needs_revision')`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "taskId" uuid NOT NULL, "submittedById" uuid NOT NULL, "status" "public"."task_submissions_status_enum" NOT NULL DEFAULT 'submitted', "submissionData" jsonb NOT NULL, "notes" text, "attachments" text array NOT NULL DEFAULT '{}', "timeTaken" integer, "difficultyRating" integer, "satisfactionRating" integer, "reviewedById" uuid, "coachFeedback" text, "coachRating" integer, "pointsAwarded" integer NOT NULL DEFAULT '0', "isLatest" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "reviewedAt" TIMESTAMP, "submissionNumber" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_8d19d6b5dd776e373113de50018" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b64cdeb41cbea6ce153dde488" ON "task_submissions" ("taskId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f54c3e1e61739da647e781592d" ON "task_submissions" ("submittedById") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6e7875a3da6d99184946ed193" ON "task_submissions" ("status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_tasktype_enum" AS ENUM('workout', 'meal_log', 'weight_check', 'progress_photo', 'measurement', 'habit_tracking', 'reflection', 'education', 'goal_setting', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'overdue', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_frequency_enum" AS ENUM('once', 'daily', 'weekly', 'monthly', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "description" text, "taskType" "public"."tasks_tasktype_enum" NOT NULL, "coachId" uuid NOT NULL, "traineeId" uuid NOT NULL, "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium', "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending', "frequency" "public"."tasks_frequency_enum" NOT NULL DEFAULT 'once', "dueDate" TIMESTAMP, "startDate" TIMESTAMP, "estimatedMinutes" integer, "taskConfig" jsonb, "instructions" text, "tags" text array NOT NULL DEFAULT '{}', "points" integer NOT NULL DEFAULT '10', "isVisible" boolean NOT NULL DEFAULT true, "requiresApproval" boolean NOT NULL DEFAULT false, "maxSubmissions" integer NOT NULL DEFAULT '1', "allowLateSubmission" boolean NOT NULL DEFAULT true, "reminderSettings" jsonb, "recurrencePattern" jsonb, "completionData" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "completedAt" TIMESTAMP, "parentTaskId" character varying, "sequenceNumber" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_067be4bd67747aa64451933929" ON "tasks" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8d80d40a279fe32679253bb50b" ON "tasks" ("taskType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_69bb95eb394586a3031393e2c1" ON "tasks" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d21eaa56a61ec50a79486ad7e0" ON "tasks" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bd213ab7fa55f02309c5f23bbc" ON "tasks" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6086c8dafbae729a930c04d865" ON "tasks" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c300d154a85801889174e92a3d" ON "tasks" ("dueDate") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_profiles_gender_enum" AS ENUM('male', 'female', 'other', 'prefer_not_to_say')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_profiles_fitnessareas_enum" AS ENUM('weight_loss', 'strength_training', 'cardio', 'yoga', 'pilates', 'hiit', 'crossfit', 'bodybuilding', 'flexibility', 'nutrition', 'sports_specific', 'rehabilitation', 'senior_fitness', 'prenatal_fitness', 'functional_training')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coach_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "bio" text, "specialization" character varying, "yearsOfExperience" integer, "certificates" jsonb DEFAULT '[]', "hourlyRate" numeric(10,2) NOT NULL DEFAULT '0', "profilePictureUrl" character varying, "gender" "public"."coach_profiles_gender_enum", "age" integer, "location" character varying, "fitnessAreas" "public"."coach_profiles_fitnessareas_enum" array DEFAULT '{}', "isVerified" boolean NOT NULL DEFAULT false, "rating" integer NOT NULL DEFAULT '0', "totalRatings" integer NOT NULL DEFAULT '0', "availableDays" text NOT NULL DEFAULT '', "availableHours" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "onboardingCompleted" boolean NOT NULL DEFAULT false, CONSTRAINT "REL_e6994e1be0dd7a878d437bbbcc" UNIQUE ("userId"), CONSTRAINT "PK_0f4001455b40350665f589642dc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."packages_skilllevel_enum" AS ENUM('Rookie', 'Warrior', 'Legend')`,
    );
    await queryRunner.query(
      `CREATE TABLE "packages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "country" character varying NOT NULL, "price" numeric(10,2) NOT NULL, "fitnessAreas" text array NOT NULL, "duration" integer NOT NULL, "features" text array, "sessionsNumber" integer, "sessionPeriod" integer, "skillLevel" "public"."packages_skilllevel_enum", "targetAudienceId" character varying, "imageUrl" character varying, "limitedAvailability" boolean NOT NULL DEFAULT false, "discountOptionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "coachId" uuid, CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_requests_requesttype_enum" AS ENUM('subscription', 'package_purchase', 'consultation')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_requests_status_enum" AS ENUM('pending', 'approved', 'rejected', 'cancelled', 'expired', 'active')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_requests_paymentstatus_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_requests_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscription_requests_source_enum" AS ENUM('search', 'referral', 'social_media', 'advertisement', 'website')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscription_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "packageId" uuid, "requestType" "public"."subscription_requests_requesttype_enum" NOT NULL DEFAULT 'subscription', "status" "public"."subscription_requests_status_enum" NOT NULL DEFAULT 'pending', "traineeMessage" text, "coachResponse" text, "traineeGoals" jsonb, "subscriptionDetails" jsonb, "coachTerms" jsonb, "startDate" TIMESTAMP, "endDate" TIMESTAMP, "monthlyFee" numeric(10,2), "currency" character varying(3) NOT NULL DEFAULT 'USD', "paymentStatus" "public"."subscription_requests_paymentstatus_enum" NOT NULL DEFAULT 'pending', "priority" "public"."subscription_requests_priority_enum" NOT NULL DEFAULT 'medium', "source" "public"."subscription_requests_source_enum" NOT NULL DEFAULT 'search', "coachRatingAtRequest" numeric(3,2), "canMessage" boolean NOT NULL DEFAULT true, "canViewProfile" boolean NOT NULL DEFAULT true, "autoApprovalSettings" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "respondedAt" TIMESTAMP, "activatedAt" TIMESTAMP, "lastInteractionAt" TIMESTAMP, "messageCount" integer NOT NULL DEFAULT '0', "expiresAt" TIMESTAMP, "remindersSent" integer NOT NULL DEFAULT '0', "isRenewal" boolean NOT NULL DEFAULT false, "previousSubscriptionId" character varying, CONSTRAINT "PK_7f97babb1f4d7eeef9d5c2937be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cbc6d58cb79a94acd8de124fbb" ON "subscription_requests" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fd39c0e957730a65e9e43131b1" ON "subscription_requests" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f5abb2fb6fa85f2cfe4b4d67b3" ON "subscription_requests" ("requestType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b23ef9d3d2385240d65401c168" ON "subscription_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_57be42a92dce8b26937c2f0339" ON "subscription_requests" ("traineeId", "coachId", "status") WHERE status IN ('pending', 'approved', 'active')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promoted_businesses_businesstype_enum" AS ENUM('gym', 'nutrition_restaurant', 'supplement_store', 'sports_equipment', 'wellness_center', 'health_clinic', 'fitness_apparel')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promoted_businesses_status_enum" AS ENUM('active', 'inactive', 'pending', 'expired', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."promoted_businesses_promotiontype_enum" AS ENUM('featured', 'banner', 'sponsored', 'premium', 'standard')`,
    );
    await queryRunner.query(
      `CREATE TABLE "promoted_businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessName" character varying NOT NULL, "description" text NOT NULL, "tagline" character varying, "businessType" "public"."promoted_businesses_businesstype_enum" NOT NULL, "status" "public"."promoted_businesses_status_enum" NOT NULL DEFAULT 'pending', "promotionType" "public"."promoted_businesses_promotiontype_enum" NOT NULL DEFAULT 'standard', "location" jsonb NOT NULL, "contact" jsonb NOT NULL, "businessHours" jsonb NOT NULL, "images" jsonb NOT NULL, "features" jsonb NOT NULL, "offers" jsonb, "targeting" jsonb NOT NULL, "contract" jsonb NOT NULL, "metrics" jsonb NOT NULL, "priority" integer NOT NULL DEFAULT '5', "isFeatured" boolean NOT NULL DEFAULT false, "rating" numeric(3,2) NOT NULL DEFAULT '0', "reviewCount" integer NOT NULL DEFAULT '0', "priceRange" integer, "categories" text, "certifications" text, "isVerified" boolean NOT NULL DEFAULT false, "contractStartDate" TIMESTAMP WITH TIME ZONE NOT NULL, "contractEndDate" TIMESTAMP WITH TIME ZONE NOT NULL, "lastPaymentDate" TIMESTAMP WITH TIME ZONE, "nextPaymentDate" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "city" character varying NOT NULL, CONSTRAINT "PK_8d0f50731b0a1352b66818b7a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_62fd1b71db6e3f86b8258f0219" ON "promoted_businesses" ("businessType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0d9fda8294ab85a3782323c474" ON "promoted_businesses" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9865f69076a396ba7e07b6d88b" ON "promoted_businesses" ("promotionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_daa8543b2567969a2ea2260814" ON "promoted_businesses" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b51f01949410bbc88612c91b0" ON "promoted_businesses" ("contractEndDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ab5768ece2f4ce8b2a8181d557" ON "promoted_businesses" ("promotionType", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d37c31e842ecb29f14d8b824e" ON "promoted_businesses" ("businessType", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."business_user_interactions_interactiontype_enum" AS ENUM('view', 'click', 'call', 'website_visit', 'directions', 'offer_view', 'offer_redeem', 'share', 'save', 'review_click', 'photo_view', 'hours_check', 'location_click')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_user_interactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "businessId" uuid NOT NULL, "userId" uuid NOT NULL, "interactionType" "public"."business_user_interactions_interactiontype_enum" NOT NULL, "metadata" jsonb, "ipAddress" character varying, "userAgent" text, "sessionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c40ced596304646cd994f0d3f9d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_12ca39fc4b8712fd091866ea0e" ON "business_user_interactions" ("businessId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_63250a3df7e3fd913f8ce4194a" ON "business_user_interactions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2be4ceb323a52e0eddbd701263" ON "business_user_interactions" ("interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6d9f165baf7e76ae71c0076219" ON "business_user_interactions" ("sessionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_958ce231f676e2f701b25a4e71" ON "business_user_interactions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7110b4d8b35ce2e4a0af91a9ea" ON "business_user_interactions" ("userId", "interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ccc7f3cd516512fed72604385" ON "business_user_interactions" ("businessId", "interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5ff34516a5fd563a80b5463dcc" ON "business_user_interactions" ("businessId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_plan_enum" AS ENUM('basic', 'premium', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('active', 'cancelled', 'expired', 'suspended', 'trial', 'pending', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."subscriptions_billingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly', 'weekly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "coachId" character varying, "plan" "public"."subscriptions_plan_enum" NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'pending', "billingCycle" "public"."subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly', "price" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "appleSubscriptionId" character varying, "googleSubscriptionId" character varying, "stripeSubscriptionId" character varying, "paypalSubscriptionId" character varying, "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP, "trialEndDate" TIMESTAMP, "nextBillingDate" TIMESTAMP, "lastBillingDate" TIMESTAMP, "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "cancelledAt" TIMESTAMP, "cancellationReason" text, "autoRenew" boolean NOT NULL DEFAULT true, "isTrial" boolean NOT NULL DEFAULT false, "trialDays" integer, "coachRevenueShare" numeric(5,2) NOT NULL DEFAULT '70', "platformFee" numeric(5,2) NOT NULL DEFAULT '30', "features" jsonb, "usageLimits" jsonb, "currentUsage" jsonb, "discount" jsonb, "paymentFailure" jsonb, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fbdba4e2ac694cf8c9cecf4dc8" ON "subscriptions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9aecc30cbc2f4574eaa7d3c5b0" ON "subscriptions" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ccf973355b70645eff37774de" ON "subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_97892dded66dbd86b221384f41" ON "subscriptions" ("nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_76778389cca711308247efcd86" ON "subscriptions" ("status", "nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a0e2a221fc5f18d9f3f7b2f591" ON "subscriptions" ("coachId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f2a37d226c4f58242548e53c6b" ON "subscriptions" ("userId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymentmethod_enum" AS ENUM('apple_iap', 'google_play', 'stripe', 'paypal', 'bank_transfer', 'credit_card')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_paymenttype_enum" AS ENUM('subscription', 'one_time', 'package_purchase', 'physical_product', 'service_fee', 'coach_payout', 'refund')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'expired', 'disputed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_currency_enum" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "paymentMethod" "public"."payments_paymentmethod_enum" NOT NULL, "paymentType" "public"."payments_paymenttype_enum" NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "amount" numeric(10,2) NOT NULL, "currency" "public"."payments_currency_enum" NOT NULL DEFAULT 'USD', "platformFee" numeric(10,2) NOT NULL DEFAULT '0', "serviceFee" numeric(10,2) NOT NULL DEFAULT '0', "netAmount" numeric(10,2) NOT NULL, "externalTransactionId" character varying, "appleProductId" character varying, "googleProductId" character varying, "appleReceiptData" text, "googlePurchaseToken" text, "stripePaymentIntentId" character varying, "paypalOrderId" character varying, "subscriptionId" character varying, "packageId" character varying, "coachId" character varying, "description" text, "metadata" jsonb, "validationData" jsonb, "refundData" jsonb, "billingAddress" jsonb, "taxInfo" jsonb, "failureReason" text, "retryCount" integer NOT NULL DEFAULT '0', "nextRetryAt" TIMESTAMP, "isRecurring" boolean NOT NULL DEFAULT false, "isTest" boolean NOT NULL DEFAULT false, "processingFee" numeric(10,2) NOT NULL DEFAULT '0', "completedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d35cb3c13a18e1ea1705b2817b" ON "payments" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_021f86cbb1b0595df0523b81d1" ON "payments" ("externalTransactionId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f778c2ef7901a0dc0b91038552" ON "payments" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83a1fcd814a2aa9baf61141e9f" ON "payments" ("paymentMethod", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e9210b4560e083026af787ec3" ON "payments" ("userId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_type_enum" AS ENUM('subscription', 'coaching_package', 'workout_plan', 'nutrition_plan', 'personal_training', 'group_class', 'equipment', 'supplement', 'course', 'consultation')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('active', 'inactive', 'draft', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_currency_enum" AS ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_subscriptionplan_enum" AS ENUM('basic', 'premium', 'pro', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_billingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly', 'weekly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_allowedpaymentmethods_enum" AS ENUM('apple_iap', 'google_play', 'stripe', 'paypal', 'bank_transfer', 'credit_card')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "type" "public"."products_type_enum" NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "basePrice" numeric(10,2) NOT NULL, "currency" "public"."products_currency_enum" NOT NULL DEFAULT 'USD', "salePrice" numeric(10,2), "subscriptionPlan" "public"."products_subscriptionplan_enum", "billingCycle" "public"."products_billingcycle_enum", "trialDays" integer, "appleProductId" character varying, "googleProductId" character varying, "stripePriceId" character varying, "paypalPlanId" character varying, "isStoreCompliant" boolean NOT NULL DEFAULT true, "allowedPaymentMethods" "public"."products_allowedpaymentmethods_enum" array NOT NULL DEFAULT '{apple_iap,google_play}', "features" jsonb, "limitations" jsonb, "pricingTiers" jsonb, "images" jsonb, "seo" jsonb, "categories" text, "targetAudience" text, "coachRevenueShare" numeric(5,2) NOT NULL DEFAULT '70', "platformFee" numeric(5,2) NOT NULL DEFAULT '30', "minimumCoachLevel" character varying, "launchDate" TIMESTAMP, "discontinueDate" TIMESTAMP, "salesCount" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "reviewCount" integer NOT NULL DEFAULT '0', "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_77865cb2730afd486057f235c2c" UNIQUE ("appleProductId"), CONSTRAINT "UQ_59401c617f060381ce00d05e8c2" UNIQUE ("googleProductId"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d5662d5ea5da62fc54b0f12a46" ON "products" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1846199852a695713b1f8f5e9a" ON "products" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cbbb65aafb83210a9315141dbb" ON "products" ("isStoreCompliant") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_479966780b26c7a2935bc8dc4e" ON "products" ("status", "isStoreCompliant") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5d3059a2cdc79e4869e4f414e" ON "products" ("type", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_subscriptions_plan_enum" AS ENUM('starter', 'professional', 'elite', 'enterprise')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_subscriptions_status_enum" AS ENUM('active', 'cancelled', 'expired', 'suspended', 'trial', 'pending', 'past_due', 'paused')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_subscriptions_billingcycle_enum" AS ENUM('monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coach_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL, "plan" "public"."coach_subscriptions_plan_enum" NOT NULL DEFAULT 'starter', "status" "public"."coach_subscriptions_status_enum" NOT NULL DEFAULT 'trial', "billingCycle" "public"."coach_subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly', "price" numeric(10,2) NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'USD', "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE, "trialEndDate" TIMESTAMP WITH TIME ZONE, "nextBillingDate" TIMESTAMP WITH TIME ZONE, "lastBillingDate" TIMESTAMP WITH TIME ZONE, "currentPeriodStart" TIMESTAMP WITH TIME ZONE, "currentPeriodEnd" TIMESTAMP WITH TIME ZONE, "autoRenew" boolean NOT NULL DEFAULT true, "isTrial" boolean NOT NULL DEFAULT false, "trialDays" integer, "cancelledAt" TIMESTAMP WITH TIME ZONE, "cancellationReason" text, "features" jsonb NOT NULL, "currentUsage" jsonb NOT NULL, "platformFee" numeric(5,2) NOT NULL DEFAULT '25', "coachRevenueShare" numeric(5,2) NOT NULL DEFAULT '75', "metadata" jsonb, "appleSubscriptionId" character varying, "googleSubscriptionId" character varying, "stripeSubscriptionId" character varying, "paypalSubscriptionId" character varying, "failedPaymentAttempts" integer NOT NULL DEFAULT '0', "lastFailedPaymentDate" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c869bfdb35b2c7bb29dff88ad2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5538599575845c30f5c6adea5" ON "coach_subscriptions" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82ec7722d5faca0bd0405035f6" ON "coach_subscriptions" ("plan") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fa0c07bdea11df27e83497c376" ON "coach_subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bcd2b02631941021ce40a11683" ON "coach_subscriptions" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34501a3ee4a36114cbb1f90c62" ON "coach_subscriptions" ("nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5d997bfa079c869923e6c27f33" ON "coach_subscriptions" ("isTrial") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d051c8b4acdec804f5860aa976" ON "coach_subscriptions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d00a7b029d6bcf9916bbab344b" ON "coach_subscriptions" ("plan", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f3dd08924f7dd74dae9a2ce221" ON "coach_subscriptions" ("status", "nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90bff3fc3cc3ebc2f6101795e7" ON "coach_subscriptions" ("coachId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_boosts_boosttype_enum" AS ENUM('search_priority', 'featured_badge', 'home_recommendations', 'top_placement', 'premium_listing', 'sponsored_content')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_boosts_status_enum" AS ENUM('active', 'expired', 'paused', 'cancelled', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coach_boosts_duration_enum" AS ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coach_boosts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL, "boostType" "public"."coach_boosts_boosttype_enum" NOT NULL DEFAULT 'search_priority', "status" "public"."coach_boosts_status_enum" NOT NULL DEFAULT 'pending', "duration" "public"."coach_boosts_duration_enum" NOT NULL DEFAULT 'monthly', "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE NOT NULL, "totalAmount" numeric(10,2) NOT NULL, "amountSpent" numeric(10,2) NOT NULL DEFAULT '0', "remainingBudget" numeric(10,2) NOT NULL, "priority" integer NOT NULL DEFAULT '5', "currency" character varying(3) NOT NULL DEFAULT 'USD', "metrics" jsonb NOT NULL, "targeting" jsonb, "settings" jsonb NOT NULL, "badgeText" character varying, "badgeColor" character varying, "promotionText" text, "featuredImageUrl" character varying, "autoRenew" boolean NOT NULL DEFAULT false, "nextRenewalDate" TIMESTAMP WITH TIME ZONE, "cancelledAt" TIMESTAMP WITH TIME ZONE, "cancellationReason" text, "paymentMethod" character varying, "transactionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cb851c5fd30206daa9830ca6419" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c8fb8169e3d6d4bb58d01fb994" ON "coach_boosts" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec16c2713d6e378cb73548d740" ON "coach_boosts" ("boostType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7d2ec17b914b620285f36a97e6" ON "coach_boosts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da4d18197329f9e4001a427d42" ON "coach_boosts" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_133a9826c7a22ca254401ebc64" ON "coach_boosts" ("endDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_375b847bd54850854aea53d17b" ON "coach_boosts" ("priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4d76a7a94c9fb43145a29e0af2" ON "coach_boosts" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7eabdf2fc5b082fbef5240ee2c" ON "coach_boosts" ("status", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_da6bcb348f9ddb1a94d7b64a22" ON "coach_boosts" ("startDate", "endDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5da2aea0716b3ed4ca8b688b6" ON "coach_boosts" ("boostType", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02340bc28bc97d1dc649e69f94" ON "coach_boosts" ("coachId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_subscriptions_plan_enum" AS ENUM('basic_coaching', 'premium_coaching', 'elite_coaching', 'custom_plan')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_subscriptions_status_enum" AS ENUM('active', 'cancelled', 'expired', 'suspended', 'trial', 'pending', 'past_due', 'paused')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_subscriptions_billingcycle_enum" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."client_subscriptions_cancelledby_enum" AS ENUM('client', 'coach', 'admin', 'system')`,
    );
    await queryRunner.query(
      `CREATE TABLE "client_subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "coachId" uuid NOT NULL, "plan" "public"."client_subscriptions_plan_enum" NOT NULL DEFAULT 'basic_coaching', "status" "public"."client_subscriptions_status_enum" NOT NULL DEFAULT 'trial', "billingCycle" "public"."client_subscriptions_billingcycle_enum" NOT NULL DEFAULT 'monthly', "clientPrice" numeric(10,2) NOT NULL, "coachEarnings" numeric(10,2) NOT NULL, "platformCommission" numeric(10,2) NOT NULL, "platformCommissionRate" numeric(5,2) NOT NULL DEFAULT '20', "currency" character varying(3) NOT NULL DEFAULT 'USD', "startDate" TIMESTAMP WITH TIME ZONE NOT NULL, "endDate" TIMESTAMP WITH TIME ZONE, "trialEndDate" TIMESTAMP WITH TIME ZONE, "nextBillingDate" TIMESTAMP WITH TIME ZONE, "lastBillingDate" TIMESTAMP WITH TIME ZONE, "currentPeriodStart" TIMESTAMP WITH TIME ZONE, "currentPeriodEnd" TIMESTAMP WITH TIME ZONE, "autoRenew" boolean NOT NULL DEFAULT true, "isTrial" boolean NOT NULL DEFAULT false, "trialDays" integer, "cancelledAt" TIMESTAMP WITH TIME ZONE, "cancellationReason" text, "cancelledBy" "public"."client_subscriptions_cancelledby_enum", "features" jsonb NOT NULL, "currentUsage" jsonb NOT NULL, "metadata" jsonb, "appleSubscriptionId" character varying, "googleSubscriptionId" character varying, "stripeSubscriptionId" character varying, "paypalSubscriptionId" character varying, "failedPaymentAttempts" integer NOT NULL DEFAULT '0', "lastFailedPaymentDate" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cffe99851f66762f21e0c80d5e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8eabc3de6306e9d2030f220172" ON "client_subscriptions" ("clientId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_de231a307f0ae83e6436196f62" ON "client_subscriptions" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4b636212e7587079c10b264c8a" ON "client_subscriptions" ("plan") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a2af4e5b733b86bdb0304faf73" ON "client_subscriptions" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cba4f4c973d53d5b3403c9c28f" ON "client_subscriptions" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92b19f47a85870de86ef381ad0" ON "client_subscriptions" ("nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d4acf8af1019fe55020667afe" ON "client_subscriptions" ("isTrial") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1b759f901eb0d36c9148f4b831" ON "client_subscriptions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3ec5ca5ff208301099be95e9c8" ON "client_subscriptions" ("status", "nextBillingDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0ea0d9259d088679d19b1293c5" ON "client_subscriptions" ("coachId", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b625f4e9482843f90451ff5eb5" ON "client_subscriptions" ("clientId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('task_completed', 'missed_task', 'new_trainee_joined', 'message_received', 'payment_due', 'workout_reminder', 'meal_reminder', 'goal_achieved', 'subscription_expired', 'certificate_expiring', 'profile_incomplete', 'system_update', 'promotional')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_status_enum" AS ENUM('read', 'unread')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."notifications_type_enum" NOT NULL, "header" character varying(200) NOT NULL, "description" text NOT NULL, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'unread', "navigationLink" character varying, "userId" uuid NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}', "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "readAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aef1c7aef3725068e5540f8f00" ON "notifications" ("type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92f5d3a7779be163cbea7916c6" ON "notifications" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5f0cceaef187f5c7884891c9e0" ON "notifications" ("timestamp") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'pending', 'blocked', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'pending', "lastMessageContent" character varying, "lastMessageAt" TIMESTAMP, "traineeUnreadCount" integer NOT NULL DEFAULT '0', "coachUnreadCount" integer NOT NULL DEFAULT '0', "traineeArchived" boolean NOT NULL DEFAULT false, "coachArchived" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6db7d3e03a320370797d2c9d7a3" UNIQUE ("traineeId", "coachId"), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_44efb470396aa0e5ddf011afe6" ON "conversations" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_88395af2d46ab8392edbbf0e06" ON "conversations" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b853c3320df7cf06b7bfa413c8" ON "conversations" ("lastMessageAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum" AS ENUM('text', 'image', 'file', 'audio', 'video', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('sent', 'delivered', 'read', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversationId" uuid NOT NULL, "senderId" uuid NOT NULL, "receiverId" uuid NOT NULL, "content" text NOT NULL, "type" "public"."messages_type_enum" NOT NULL DEFAULT 'text', "status" "public"."messages_status_enum" NOT NULL DEFAULT 'sent', "metadata" jsonb, "isArchived" boolean NOT NULL DEFAULT false, "readAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "messages" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2db9cf2b3ca111742793f6c37c" ON "messages" ("senderId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_acf951a58e3b9611dd96ce8904" ON "messages" ("receiverId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6ce6acdb0801254590f8a78c08" ON "messages" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meals_mealtype_enum" AS ENUM('breakfast', 'lunch', 'dinner', 'snacks', 'drinks')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "calories" numeric(8,2) NOT NULL, "protein" numeric(8,2) NOT NULL, "fat" numeric(8,2) NOT NULL, "carbs" numeric(8,2) NOT NULL, "ingredients" text array NOT NULL, "preparation" text NOT NULL, "imageUrl" character varying, "mealType" "public"."meals_mealtype_enum" NOT NULL, "description" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e6f830ac9b463433b58ad6f1a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meal_plans_plantype_enum" AS ENUM('weight_loss', 'muscle_gain', 'maintenance', 'cutting', 'bulking', 'keto', 'vegetarian', 'vegan', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meal_plans_status_enum" AS ENUM('draft', 'active', 'completed', 'paused')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."meal_plans_dietaryrestrictions_enum" AS ENUM('none', 'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'low_carb', 'keto', 'paleo', 'halal', 'kosher')`,
    );
    await queryRunner.query(
      `CREATE TABLE "meal_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" text, "planType" "public"."meal_plans_plantype_enum" NOT NULL, "durationDays" integer NOT NULL, "coachId" uuid NOT NULL, "traineeId" uuid, "status" "public"."meal_plans_status_enum" NOT NULL DEFAULT 'draft', "schedule" jsonb NOT NULL, "nutritionTargets" jsonb NOT NULL, "dietaryRestrictions" "public"."meal_plans_dietaryrestrictions_enum" array NOT NULL DEFAULT '{none}', "preferences" jsonb, "shoppingList" jsonb, "isTemplate" boolean NOT NULL DEFAULT false, "usageCount" integer NOT NULL DEFAULT '0', "averageRating" numeric(3,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "startDate" date, "endDate" date, "estimatedWeeklyCost" numeric(8,2), CONSTRAINT "PK_6270d3206d074e2a2520f8d0a0b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_70bb55d113bdeecf410885b9dc" ON "meal_plans" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a6f0b3e2e9cc0a62f994c3ffb0" ON "meal_plans" ("planType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_65f0ca4c180ebd05a88bb26cc0" ON "meal_plans" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b15990f181f7904a82bd37a6f4" ON "meal_plans" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d0435a4a74fe25df25fd6c3827" ON "meal_plans" ("status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "nutrition_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "traineeId" uuid NOT NULL, "mealId" uuid NOT NULL, "mealPlanId" uuid, "logDate" date NOT NULL, "mealTime" TIME NOT NULL, "mealCategory" character varying(50) NOT NULL, "portionSize" numeric(4,2) NOT NULL DEFAULT '1', "actualCalories" numeric(8,2) NOT NULL, "actualProtein" numeric(8,2) NOT NULL, "actualCarbs" numeric(8,2) NOT NULL, "actualFat" numeric(8,2) NOT NULL, "additionalNutrition" jsonb, "notes" text, "rating" integer, "photoUrl" text, "wasPlanned" boolean NOT NULL DEFAULT true, "location" character varying(100), "moodAfterEating" integer, "hungerLevelBefore" integer, "satietyLevelAfter" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_db04b9c87b71efdbfff6e50afb9" UNIQUE ("traineeId", "logDate", "mealId", "mealTime"), CONSTRAINT "PK_dd9d41be1c628a937e0faceb41b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_428763b9aefaf53c3d6c4d663f" ON "nutrition_logs" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a9f6a0f7d00b3b5de9068f3b35" ON "nutrition_logs" ("mealId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c74db1be4d44db96c88b16e900" ON "nutrition_logs" ("mealPlanId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1366fdfe3934b08a2ba2a8a9d0" ON "nutrition_logs" ("logDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_82e54afc931ad2895eed825c68" ON "nutrition_logs" ("mealCategory") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."message_requests_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "message_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "initialMessage" text NOT NULL, "reason" text, "status" "public"."message_requests_status_enum" NOT NULL DEFAULT 'pending', "responseMessage" text, "respondedAt" TIMESTAMP, "expiresAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_254cdba4327d6e56ba9580b4df6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f541ae86739e9aa0e10d3c83f7" ON "message_requests" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_84688fd1d996e6eacfa73672ad" ON "message_requests" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_421b8593e115ee6d3c9ece8787" ON "message_requests" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_43633a2b0511c521726a2e8733" ON "message_requests" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "meal_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mealPlanId" uuid NOT NULL, "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "customizations" jsonb, "instructions" text, "priority" integer NOT NULL DEFAULT '1', "progress" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fb8fc6d78ecb801e8ced0e6615" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ec1283ff77c3502ed5b6a00e2b" ON "meal_assignments" ("mealPlanId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0b4b31e4d81f07865aadb903b" ON "meal_assignments" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6879ee4da6849ab279ceeb6acd" ON "meal_assignments" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_547aa52dec064ba2b4f053a550" ON "meal_assignments" ("startDate") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_47050f62ed305cf4204331e4b4" ON "meal_assignments" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_posts_posttype_enum" AS ENUM('text', 'image', 'video', 'workout_tip', 'nutrition_tip', 'motivation', 'success_story', 'announcement', 'challenge', 'poll', 'live_session', 'recipe', 'exercise_demo', 'progress_update')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_posts_status_enum" AS ENUM('draft', 'published', 'scheduled', 'archived', 'deleted')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_posts_visibility_enum" AS ENUM('all_clients', 'specific_clients', 'subscription_tier', 'public', 'premium_only')`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "coachId" uuid NOT NULL, "postType" "public"."feed_posts_posttype_enum" NOT NULL DEFAULT 'text', "status" "public"."feed_posts_status_enum" NOT NULL DEFAULT 'draft', "visibility" "public"."feed_posts_visibility_enum" NOT NULL DEFAULT 'all_clients', "title" character varying NOT NULL, "content" text NOT NULL, "summary" character varying, "media" jsonb, "challenge" jsonb, "poll" jsonb, "liveSession" jsonb, "recipe" jsonb, "workoutTip" jsonb, "hashtags" text, "targetAudience" text, "targetClientIds" text, "requiredSubscriptionTier" character varying, "scheduledAt" TIMESTAMP WITH TIME ZONE, "publishedAt" TIMESTAMP WITH TIME ZONE, "expiresAt" TIMESTAMP WITH TIME ZONE, "priority" integer NOT NULL DEFAULT '5', "isPinned" boolean NOT NULL DEFAULT false, "allowComments" boolean NOT NULL DEFAULT true, "allowLikes" boolean NOT NULL DEFAULT true, "allowShares" boolean NOT NULL DEFAULT true, "engagement" jsonb NOT NULL, "metadata" jsonb, "slug" character varying, "externalUrl" character varying, "ctaText" character varying, "ctaUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91d985d29dfb9db30f565391830" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ad1fb017dbb1cc72c1ac5aa329" ON "feed_posts" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0428f7d43ac57722032fe3245f" ON "feed_posts" ("postType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2d9f16a22e626224c6adcec680" ON "feed_posts" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_526a2e27bb87f43388a7c5b3d4" ON "feed_posts" ("visibility") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a4ceb22bc28ffae2dfa4cc4e04" ON "feed_posts" ("scheduledAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c1b4cb012424545f9e4e140215" ON "feed_posts" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_31151e59f81d350afed1701271" ON "feed_posts" ("postType", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a8a85978fcd5808ea0ba904e8a" ON "feed_posts" ("coachId", "status") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_interactions_interactiontype_enum" AS ENUM('like', 'comment', 'share', 'save', 'view', 'click', 'poll_vote', 'challenge_join', 'live_session_join', 'report', 'hide')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."feed_interactions_reactiontype_enum" AS ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry', 'thumbs_up', 'thumbs_down', 'fire', 'heart', 'muscle', 'clap')`,
    );
    await queryRunner.query(
      `CREATE TABLE "feed_interactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "interactionType" "public"."feed_interactions_interactiontype_enum" NOT NULL, "reactionType" "public"."feed_interactions_reactiontype_enum", "commentText" text, "pollOptionId" character varying, "metadata" jsonb, "ipAddress" character varying, "userAgent" character varying, "deviceType" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_dc5021448d1110f2671986ff79b" UNIQUE ("postId", "userId", "interactionType"), CONSTRAINT "PK_4f965cda810ebb3ee36c1ff6bb1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2aca10ba7d58b6f68968f928fb" ON "feed_interactions" ("postId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c08f80fa23bd3d4ba35e02f5c" ON "feed_interactions" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92351c757b672ca7c2432e1a77" ON "feed_interactions" ("interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26b5ca82c573f2bd3841c1a82b" ON "feed_interactions" ("createdAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_738f3ae8125d180084276877aa" ON "feed_interactions" ("postId", "interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_72e9bd06ff6a95d12e591e1f8a" ON "feed_interactions" ("userId", "interactionType") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c6d2a468bfa3865051693f9cb8" ON "feed_interactions" ("postId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trainee_progress_subscriptionstatus_enum" AS ENUM('active', 'pending', 'suspended', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."trainee_progress_lastactivitytype_enum" AS ENUM('workout_completed', 'meal_logged', 'weight_recorded', 'goal_achieved', 'check_in')`,
    );
    await queryRunner.query(
      `CREATE TABLE "trainee_progress" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "traineeId" uuid NOT NULL, "coachId" uuid NOT NULL, "workoutCompletionPercentage" numeric(5,2) NOT NULL DEFAULT '0', "totalWorkoutsCompleted" integer NOT NULL DEFAULT '0', "currentWeight" numeric(5,2), "targetWeight" numeric(5,2), "subscriptionStatus" "public"."trainee_progress_subscriptionstatus_enum" NOT NULL DEFAULT 'pending', "subscriptionStartDate" date, "subscriptionEndDate" date, "lastActivityDate" TIMESTAMP, "lastActivityType" "public"."trainee_progress_lastactivitytype_enum", "notes" text, "progressData" jsonb NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f06b03e5ee65802df8b60e18d89" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_34f98167c1630fe2d745824cce" ON "trainee_progress" ("traineeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_02ded207ca1dd40e85d29feefd" ON "trainee_progress" ("coachId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df1eb656efc9f5fda4f34565b3" ON "trainee_progress" ("subscriptionStatus") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_481bbe1139541276b3dd613e22" ON "trainee_progress" ("lastActivityDate") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quotes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "author" character varying(200) NOT NULL, "category" character varying(100) NOT NULL DEFAULT 'motivation', "isActive" boolean NOT NULL DEFAULT true, "timesServed" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99a0e8bcbcd8719d3a41f23c263" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8375e4aeb4b966f81293171fad" ON "quotes" ("category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3bfcdfdee741415b1f37b3b6bf" ON "quotes" ("isActive") `,
    );
    await queryRunner.query(
      `CREATE TABLE "client_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "bio" character varying, "age" integer, "weight" integer, "height" integer, "fitnessGoals" character varying, "healthConditions" character varying, "preferredWorkoutType" character varying, "profilePictureUrl" character varying, "gender" character varying, "location" character varying, "fitnessGoal" character varying, "fitnessLevel" character varying, "bodyShape" character varying, "mealsPerDay" integer, "specificDiet" boolean, "exerciseFrequency" integer, "sessionDuration" integer, "gymAccess" boolean, "healthConsiderations" character varying, "allergies" character varying, "medications" boolean, "medicalConditions" boolean, "medicalConditionsDescription" character varying, "smoke" boolean, "drinkAlcohol" boolean, "coachGenderPreference" character varying, "coachingMode" character varying, "budget" character varying, "preferredTime" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_af81cdb71317b2f0f6cb6bce77" UNIQUE ("userId"), CONSTRAINT "PK_fc4acd4b04f4a0537e7213f8ddd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5663ce0c730b2de83445e2fd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN "conversationId"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "metadata"`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "conversationId" uuid NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "messages" ADD "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "fileUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "fileType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "threadId" character varying`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."messages_type_enum" RENAME TO "messages_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum" AS ENUM('text', 'image', 'file', 'system')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" TYPE "public"."messages_type_enum" USING "type"::"text"::"public"."messages_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."messages_status_enum" RENAME TO "messages_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('sent', 'delivered', 'read')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" TYPE "public"."messages_status_enum" USING "status"::"text"::"public"."messages_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'sent'`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum_old"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "messages" ("conversationId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_befd307485dbf0559d17e4a4d2" ON "messages" ("status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_57eec5dc5b3e70ace7769466f8" ON "messages" ("isArchived") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_15f9bd2bf472ff12b6ee20012d" ON "messages" ("threadId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plans" ADD CONSTRAINT "FK_a01a994e3e18c920b5ec44752e6" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plans" ADD CONSTRAINT "FK_d2aeb70265e4bb1f7fca583ecb6" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_82cab13dc713bfb0cff9bb76c54" FOREIGN KEY ("workoutId") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_b238a1412ceaa33ad9eaa0fe50b" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_483ef263ab35975d9120a306a01" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" ADD CONSTRAINT "FK_f4c037a76bc4584cef6bcf939f8" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" ADD CONSTRAINT "FK_0f3ec9290d536ae8fde24753f09" FOREIGN KEY ("workoutPlanId") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" ADD CONSTRAINT "FK_81992da012ec8a002fd435b0e32" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" ADD CONSTRAINT "FK_92c9d441c288c0a1dd4eaf4cc99" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" ADD CONSTRAINT "FK_8b77a6e77bf029854287fd12db0" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" ADD CONSTRAINT "FK_158dae7598be8adcddd8938b40b" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" ADD CONSTRAINT "FK_44903061db2039720bf2cf3e03a" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" ADD CONSTRAINT "FK_22c83e3508f19dab32fb0306d2d" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" ADD CONSTRAINT "FK_0341a4fc5b964a86148f39498ba" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" ADD CONSTRAINT "FK_f6d6a19f3988abdad28f30e4671" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" ADD CONSTRAINT "FK_91b2dc13da17d0d5a80aeb48f3a" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" ADD CONSTRAINT "FK_8b64cdeb41cbea6ce153dde4881" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" ADD CONSTRAINT "FK_f54c3e1e61739da647e781592d0" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" ADD CONSTRAINT "FK_16d27915e88a6d5ba956e5ae3af" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_69bb95eb394586a3031393e2c11" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_d21eaa56a61ec50a79486ad7e0f" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_profiles" ADD CONSTRAINT "FK_e6994e1be0dd7a878d437bbbcc0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" ADD CONSTRAINT "FK_71b7c5e54bef5fa95df565979a3" FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" ADD CONSTRAINT "FK_cbc6d58cb79a94acd8de124fbbc" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" ADD CONSTRAINT "FK_fd39c0e957730a65e9e43131b1a" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" ADD CONSTRAINT "FK_a8c523873b2dd4f2534532d3f17" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_user_interactions" ADD CONSTRAINT "FK_12ca39fc4b8712fd091866ea0e0" FOREIGN KEY ("businessId") REFERENCES "promoted_businesses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_user_interactions" ADD CONSTRAINT "FK_63250a3df7e3fd913f8ce4194a8" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_subscriptions" ADD CONSTRAINT "FK_e5538599575845c30f5c6adea5f" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_boosts" ADD CONSTRAINT "FK_c8fb8169e3d6d4bb58d01fb9940" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_subscriptions" ADD CONSTRAINT "FK_8eabc3de6306e9d2030f2201722" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_subscriptions" ADD CONSTRAINT "FK_de231a307f0ae83e6436196f623" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_44efb470396aa0e5ddf011afe61" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_88395af2d46ab8392edbbf0e066" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_acf951a58e3b9611dd96ce89042" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_plans" ADD CONSTRAINT "FK_65f0ca4c180ebd05a88bb26cc0c" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_plans" ADD CONSTRAINT "FK_b15990f181f7904a82bd37a6f42" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" ADD CONSTRAINT "FK_428763b9aefaf53c3d6c4d663fa" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" ADD CONSTRAINT "FK_a9f6a0f7d00b3b5de9068f3b352" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" ADD CONSTRAINT "FK_c74db1be4d44db96c88b16e9001" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_requests" ADD CONSTRAINT "FK_f541ae86739e9aa0e10d3c83f77" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_requests" ADD CONSTRAINT "FK_84688fd1d996e6eacfa73672adf" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" ADD CONSTRAINT "FK_ec1283ff77c3502ed5b6a00e2bd" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" ADD CONSTRAINT "FK_e0b4b31e4d81f07865aadb903b6" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" ADD CONSTRAINT "FK_6879ee4da6849ab279ceeb6acd3" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_posts" ADD CONSTRAINT "FK_ad1fb017dbb1cc72c1ac5aa3298" FOREIGN KEY ("coachId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_interactions" ADD CONSTRAINT "FK_2aca10ba7d58b6f68968f928fbd" FOREIGN KEY ("postId") REFERENCES "feed_posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_interactions" ADD CONSTRAINT "FK_3c08f80fa23bd3d4ba35e02f5c4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" ADD CONSTRAINT "FK_34f98167c1630fe2d745824cce8" FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" ADD CONSTRAINT "FK_02ded207ca1dd40e85d29feefd1" FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_profiles" ADD CONSTRAINT "FK_af81cdb71317b2f0f6cb6bce776" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client_profiles" DROP CONSTRAINT "FK_af81cdb71317b2f0f6cb6bce776"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" DROP CONSTRAINT "FK_02ded207ca1dd40e85d29feefd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" DROP CONSTRAINT "FK_34f98167c1630fe2d745824cce8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_interactions" DROP CONSTRAINT "FK_3c08f80fa23bd3d4ba35e02f5c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_interactions" DROP CONSTRAINT "FK_2aca10ba7d58b6f68968f928fbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "feed_posts" DROP CONSTRAINT "FK_ad1fb017dbb1cc72c1ac5aa3298"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" DROP CONSTRAINT "FK_6879ee4da6849ab279ceeb6acd3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" DROP CONSTRAINT "FK_e0b4b31e4d81f07865aadb903b6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_assignments" DROP CONSTRAINT "FK_ec1283ff77c3502ed5b6a00e2bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_requests" DROP CONSTRAINT "FK_84688fd1d996e6eacfa73672adf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message_requests" DROP CONSTRAINT "FK_f541ae86739e9aa0e10d3c83f77"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" DROP CONSTRAINT "FK_c74db1be4d44db96c88b16e9001"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" DROP CONSTRAINT "FK_a9f6a0f7d00b3b5de9068f3b352"`,
    );
    await queryRunner.query(
      `ALTER TABLE "nutrition_logs" DROP CONSTRAINT "FK_428763b9aefaf53c3d6c4d663fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_plans" DROP CONSTRAINT "FK_b15990f181f7904a82bd37a6f42"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meal_plans" DROP CONSTRAINT "FK_65f0ca4c180ebd05a88bb26cc0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_acf951a58e3b9611dd96ce89042"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_88395af2d46ab8392edbbf0e066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_44efb470396aa0e5ddf011afe61"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_subscriptions" DROP CONSTRAINT "FK_de231a307f0ae83e6436196f623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client_subscriptions" DROP CONSTRAINT "FK_8eabc3de6306e9d2030f2201722"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_boosts" DROP CONSTRAINT "FK_c8fb8169e3d6d4bb58d01fb9940"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_subscriptions" DROP CONSTRAINT "FK_e5538599575845c30f5c6adea5f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_d35cb3c13a18e1ea1705b2817b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_fbdba4e2ac694cf8c9cecf4dc84"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_user_interactions" DROP CONSTRAINT "FK_63250a3df7e3fd913f8ce4194a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_user_interactions" DROP CONSTRAINT "FK_12ca39fc4b8712fd091866ea0e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" DROP CONSTRAINT "FK_a8c523873b2dd4f2534532d3f17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" DROP CONSTRAINT "FK_fd39c0e957730a65e9e43131b1a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subscription_requests" DROP CONSTRAINT "FK_cbc6d58cb79a94acd8de124fbbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "packages" DROP CONSTRAINT "FK_71b7c5e54bef5fa95df565979a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coach_profiles" DROP CONSTRAINT "FK_e6994e1be0dd7a878d437bbbcc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_d21eaa56a61ec50a79486ad7e0f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "FK_69bb95eb394586a3031393e2c11"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" DROP CONSTRAINT "FK_16d27915e88a6d5ba956e5ae3af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" DROP CONSTRAINT "FK_f54c3e1e61739da647e781592d0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_submissions" DROP CONSTRAINT "FK_8b64cdeb41cbea6ce153dde4881"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" DROP CONSTRAINT "FK_91b2dc13da17d0d5a80aeb48f3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" DROP CONSTRAINT "FK_f6d6a19f3988abdad28f30e4671"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_assignments" DROP CONSTRAINT "FK_0341a4fc5b964a86148f39498ba"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" DROP CONSTRAINT "FK_22c83e3508f19dab32fb0306d2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" DROP CONSTRAINT "FK_44903061db2039720bf2cf3e03a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "template_recommendations" DROP CONSTRAINT "FK_158dae7598be8adcddd8938b40b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "templates" DROP CONSTRAINT "FK_8b77a6e77bf029854287fd12db0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" DROP CONSTRAINT "FK_92c9d441c288c0a1dd4eaf4cc99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" DROP CONSTRAINT "FK_81992da012ec8a002fd435b0e32"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_assignments" DROP CONSTRAINT "FK_0f3ec9290d536ae8fde24753f09"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_f4c037a76bc4584cef6bcf939f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_483ef263ab35975d9120a306a01"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_b238a1412ceaa33ad9eaa0fe50b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_sessions" DROP CONSTRAINT "FK_82cab13dc713bfb0cff9bb76c54"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plans" DROP CONSTRAINT "FK_d2aeb70265e4bb1f7fca583ecb6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workout_plans" DROP CONSTRAINT "FK_a01a994e3e18c920b5ec44752e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_15f9bd2bf472ff12b6ee20012d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57eec5dc5b3e70ace7769466f8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_befd307485dbf0559d17e4a4d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5663ce0c730b2de83445e2fd1"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum_old" AS ENUM('sent', 'delivered', 'read', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" TYPE "public"."messages_status_enum_old" USING "status"::"text"::"public"."messages_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "status" SET DEFAULT 'sent'`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."messages_status_enum_old" RENAME TO "messages_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_type_enum_old" AS ENUM('text', 'image', 'file', 'audio', 'video', 'system')`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" TYPE "public"."messages_type_enum_old" USING "type"::"text"::"public"."messages_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "type" SET DEFAULT 'text'`,
    );
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."messages_type_enum_old" RENAME TO "messages_type_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "threadId"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "fileType"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "fileUrl"`);
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "metadata"`);
    await queryRunner.query(
      `ALTER TABLE "messages" DROP COLUMN "conversationId"`,
    );
    await queryRunner.query(`ALTER TABLE "messages" ADD "metadata" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "messages" ADD "conversationId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5663ce0c730b2de83445e2fd1" ON "messages" ("conversationId") `,
    );
    await queryRunner.query(`DROP TABLE "client_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3bfcdfdee741415b1f37b3b6bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8375e4aeb4b966f81293171fad"`,
    );
    await queryRunner.query(`DROP TABLE "quotes"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_481bbe1139541276b3dd613e22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_df1eb656efc9f5fda4f34565b3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_02ded207ca1dd40e85d29feefd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34f98167c1630fe2d745824cce"`,
    );
    await queryRunner.query(`DROP TABLE "trainee_progress"`);
    await queryRunner.query(
      `DROP TYPE "public"."trainee_progress_lastactivitytype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."trainee_progress_subscriptionstatus_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6d2a468bfa3865051693f9cb8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_72e9bd06ff6a95d12e591e1f8a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_738f3ae8125d180084276877aa"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26b5ca82c573f2bd3841c1a82b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92351c757b672ca7c2432e1a77"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c08f80fa23bd3d4ba35e02f5c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2aca10ba7d58b6f68968f928fb"`,
    );
    await queryRunner.query(`DROP TABLE "feed_interactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."feed_interactions_reactiontype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."feed_interactions_interactiontype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a8a85978fcd5808ea0ba904e8a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_31151e59f81d350afed1701271"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c1b4cb012424545f9e4e140215"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a4ceb22bc28ffae2dfa4cc4e04"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_526a2e27bb87f43388a7c5b3d4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2d9f16a22e626224c6adcec680"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0428f7d43ac57722032fe3245f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ad1fb017dbb1cc72c1ac5aa329"`,
    );
    await queryRunner.query(`DROP TABLE "feed_posts"`);
    await queryRunner.query(`DROP TYPE "public"."feed_posts_visibility_enum"`);
    await queryRunner.query(`DROP TYPE "public"."feed_posts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."feed_posts_posttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_47050f62ed305cf4204331e4b4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_547aa52dec064ba2b4f053a550"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6879ee4da6849ab279ceeb6acd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0b4b31e4d81f07865aadb903b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec1283ff77c3502ed5b6a00e2b"`,
    );
    await queryRunner.query(`DROP TABLE "meal_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_43633a2b0511c521726a2e8733"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_421b8593e115ee6d3c9ece8787"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_84688fd1d996e6eacfa73672ad"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f541ae86739e9aa0e10d3c83f7"`,
    );
    await queryRunner.query(`DROP TABLE "message_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."message_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82e54afc931ad2895eed825c68"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1366fdfe3934b08a2ba2a8a9d0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c74db1be4d44db96c88b16e900"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a9f6a0f7d00b3b5de9068f3b35"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_428763b9aefaf53c3d6c4d663f"`,
    );
    await queryRunner.query(`DROP TABLE "nutrition_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d0435a4a74fe25df25fd6c3827"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b15990f181f7904a82bd37a6f4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_65f0ca4c180ebd05a88bb26cc0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a6f0b3e2e9cc0a62f994c3ffb0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_70bb55d113bdeecf410885b9dc"`,
    );
    await queryRunner.query(`DROP TABLE "meal_plans"`);
    await queryRunner.query(
      `DROP TYPE "public"."meal_plans_dietaryrestrictions_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."meal_plans_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."meal_plans_plantype_enum"`);
    await queryRunner.query(`DROP TABLE "meals"`);
    await queryRunner.query(`DROP TYPE "public"."meals_mealtype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ce6acdb0801254590f8a78c08"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_acf951a58e3b9611dd96ce8904"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2db9cf2b3ca111742793f6c37c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5663ce0c730b2de83445e2fd1"`,
    );
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b853c3320df7cf06b7bfa413c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_88395af2d46ab8392edbbf0e06"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_44efb470396aa0e5ddf011afe6"`,
    );
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5f0cceaef187f5c7884891c9e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92f5d3a7779be163cbea7916c6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_aef1c7aef3725068e5540f8f00"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b625f4e9482843f90451ff5eb5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0ea0d9259d088679d19b1293c5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ec5ca5ff208301099be95e9c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1b759f901eb0d36c9148f4b831"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1d4acf8af1019fe55020667afe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92b19f47a85870de86ef381ad0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cba4f4c973d53d5b3403c9c28f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a2af4e5b733b86bdb0304faf73"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4b636212e7587079c10b264c8a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_de231a307f0ae83e6436196f62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8eabc3de6306e9d2030f220172"`,
    );
    await queryRunner.query(`DROP TABLE "client_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."client_subscriptions_cancelledby_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."client_subscriptions_billingcycle_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."client_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."client_subscriptions_plan_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_02340bc28bc97d1dc649e69f94"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5da2aea0716b3ed4ca8b688b6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da6bcb348f9ddb1a94d7b64a22"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7eabdf2fc5b082fbef5240ee2c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4d76a7a94c9fb43145a29e0af2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_375b847bd54850854aea53d17b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_133a9826c7a22ca254401ebc64"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_da4d18197329f9e4001a427d42"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d2ec17b914b620285f36a97e6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ec16c2713d6e378cb73548d740"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c8fb8169e3d6d4bb58d01fb994"`,
    );
    await queryRunner.query(`DROP TABLE "coach_boosts"`);
    await queryRunner.query(`DROP TYPE "public"."coach_boosts_duration_enum"`);
    await queryRunner.query(`DROP TYPE "public"."coach_boosts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."coach_boosts_boosttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_90bff3fc3cc3ebc2f6101795e7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f3dd08924f7dd74dae9a2ce221"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d00a7b029d6bcf9916bbab344b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d051c8b4acdec804f5860aa976"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5d997bfa079c869923e6c27f33"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_34501a3ee4a36114cbb1f90c62"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bcd2b02631941021ce40a11683"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fa0c07bdea11df27e83497c376"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82ec7722d5faca0bd0405035f6"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5538599575845c30f5c6adea5"`,
    );
    await queryRunner.query(`DROP TABLE "coach_subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."coach_subscriptions_billingcycle_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."coach_subscriptions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."coach_subscriptions_plan_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5d3059a2cdc79e4869e4f414e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_479966780b26c7a2935bc8dc4e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cbbb65aafb83210a9315141dbb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1846199852a695713b1f8f5e9a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d5662d5ea5da62fc54b0f12a46"`,
    );
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(
      `DROP TYPE "public"."products_allowedpaymentmethods_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."products_billingcycle_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."products_subscriptionplan_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."products_currency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5e9210b4560e083026af787ec3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_83a1fcd814a2aa9baf61141e9f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f778c2ef7901a0dc0b91038552"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_021f86cbb1b0595df0523b81d1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d35cb3c13a18e1ea1705b2817b"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_currency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymenttype_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_paymentmethod_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2a37d226c4f58242548e53c6b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0e2a221fc5f18d9f3f7b2f591"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_76778389cca711308247efcd86"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_97892dded66dbd86b221384f41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6ccf973355b70645eff37774de"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9aecc30cbc2f4574eaa7d3c5b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fbdba4e2ac694cf8c9cecf4dc8"`,
    );
    await queryRunner.query(`DROP TABLE "subscriptions"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscriptions_billingcycle_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscriptions_plan_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5ff34516a5fd563a80b5463dcc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3ccc7f3cd516512fed72604385"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7110b4d8b35ce2e4a0af91a9ea"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_958ce231f676e2f701b25a4e71"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d9f165baf7e76ae71c0076219"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2be4ceb323a52e0eddbd701263"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_63250a3df7e3fd913f8ce4194a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_12ca39fc4b8712fd091866ea0e"`,
    );
    await queryRunner.query(`DROP TABLE "business_user_interactions"`);
    await queryRunner.query(
      `DROP TYPE "public"."business_user_interactions_interactiontype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6d37c31e842ecb29f14d8b824e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ab5768ece2f4ce8b2a8181d557"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b51f01949410bbc88612c91b0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_daa8543b2567969a2ea2260814"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9865f69076a396ba7e07b6d88b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0d9fda8294ab85a3782323c474"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_62fd1b71db6e3f86b8258f0219"`,
    );
    await queryRunner.query(`DROP TABLE "promoted_businesses"`);
    await queryRunner.query(
      `DROP TYPE "public"."promoted_businesses_promotiontype_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."promoted_businesses_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."promoted_businesses_businesstype_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_57be42a92dce8b26937c2f0339"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b23ef9d3d2385240d65401c168"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f5abb2fb6fa85f2cfe4b4d67b3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_fd39c0e957730a65e9e43131b1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cbc6d58cb79a94acd8de124fbb"`,
    );
    await queryRunner.query(`DROP TABLE "subscription_requests"`);
    await queryRunner.query(
      `DROP TYPE "public"."subscription_requests_source_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_requests_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_requests_paymentstatus_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_requests_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."subscription_requests_requesttype_enum"`,
    );
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(`DROP TYPE "public"."packages_skilllevel_enum"`);
    await queryRunner.query(`DROP TABLE "coach_profiles"`);
    await queryRunner.query(
      `DROP TYPE "public"."coach_profiles_fitnessareas_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."coach_profiles_gender_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c300d154a85801889174e92a3d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6086c8dafbae729a930c04d865"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bd213ab7fa55f02309c5f23bbc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d21eaa56a61ec50a79486ad7e0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_69bb95eb394586a3031393e2c1"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8d80d40a279fe32679253bb50b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_067be4bd67747aa64451933929"`,
    );
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_frequency_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_tasktype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c6e7875a3da6d99184946ed193"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f54c3e1e61739da647e781592d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b64cdeb41cbea6ce153dde488"`,
    );
    await queryRunner.query(`DROP TABLE "task_submissions"`);
    await queryRunner.query(
      `DROP TYPE "public"."task_submissions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_05de962d6a82e65f7e187a729b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f2537eced6fbf07ea434bda553"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_91b2dc13da17d0d5a80aeb48f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f6d6a19f3988abdad28f30e467"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0341a4fc5b964a86148f39498b"`,
    );
    await queryRunner.query(`DROP TABLE "template_assignments"`);
    await queryRunner.query(
      `DROP TYPE "public"."template_assignments_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8df8d567fcd953e2d972fa0a88"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d1d169b5de37f50678cd0fc5b7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_639f094dcfb3e65f117dbfd2c8"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_341fa88855a4f3e5298f995030"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_22c83e3508f19dab32fb0306d2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_44903061db2039720bf2cf3e03"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_158dae7598be8adcddd8938b40"`,
    );
    await queryRunner.query(`DROP TABLE "template_recommendations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_84d69471a288d1efc5ebd9fa41"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3b6caf43de736d35830a3b973b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8b77a6e77bf029854287fd12db"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_56d512b37178cdc2b10f1592cc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5624219dd33b4644599d4d4b23"`,
    );
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TYPE "public"."templates_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE "public"."templates_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."templates_templatetype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a0a568ca9e4b5c0dc4c29a9a81"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7cd51efb36ca09be96477d3393"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92c9d441c288c0a1dd4eaf4cc9"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_81992da012ec8a002fd435b0e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0f3ec9290d536ae8fde24753f0"`,
    );
    await queryRunner.query(`DROP TABLE "workout_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d6d1479eb9e8db77e13eddcd70"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac620b163a93d66b4282a4e34c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f4c037a76bc4584cef6bcf939f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_483ef263ab35975d9120a306a0"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b238a1412ceaa33ad9eaa0fe50"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_82cab13dc713bfb0cff9bb76c5"`,
    );
    await queryRunner.query(`DROP TABLE "workout_sessions"`);
    await queryRunner.query(
      `DROP TYPE "public"."workout_sessions_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c4487fdb9015c70a67d21394c3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d2aeb70265e4bb1f7fca583ecb"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a01a994e3e18c920b5ec44752e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2c210a5f39dc39135e7fca9ccd"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_400375a1e2cfb4a0fe363b1b73"`,
    );
    await queryRunner.query(`DROP TABLE "workout_plans"`);
    await queryRunner.query(`DROP TYPE "public"."workout_plans_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."workout_plans_plantype_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f371d2426c88d4cafeec9b4f0f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7d1f61c30f0601093f80c5b053"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d84c274214f1881d1b9469841a"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f610bb716b9281f07dd9c11d9f"`,
    );
    await queryRunner.query(`DROP TABLE "workouts"`);
    await queryRunner.query(`DROP TYPE "public"."workouts_difficulty_enum"`);
    await queryRunner.query(`DROP TYPE "public"."workouts_workouttype_enum"`);
    await queryRunner.query(`DROP TABLE "discount_options"`);
    await queryRunner.query(`DROP TABLE "features"`);
    await queryRunner.query(`DROP TABLE "target_audiences"`);
  }
}
