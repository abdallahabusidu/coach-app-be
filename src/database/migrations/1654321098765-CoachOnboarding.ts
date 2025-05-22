import { MigrationInterface, QueryRunner } from 'typeorm';

export class CoachOnboarding1654321098765 implements MigrationInterface {
  name = 'CoachOnboarding1654321098765';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add verification fields to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
      ADD "emailVerificationToken" VARCHAR,
      ADD "emailVerificationExpires" TIMESTAMP,
      ADD "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
      ADD "phoneVerificationCode" VARCHAR,
      ADD "phoneVerificationExpires" TIMESTAMP
    `);

    // Update coach_profiles table with new fields
    await queryRunner.query(`
      ALTER TABLE "coach_profiles" 
      ADD "bio" TEXT,
      ADD "certificates" JSONB DEFAULT '[]',
      ADD "gender" VARCHAR CHECK ("gender" IN ('male', 'female', 'other', 'prefer_not_to_say')),
      ADD "age" INTEGER,
      ADD "location" VARCHAR,
      ADD "fitnessAreas" VARCHAR[] DEFAULT '{}',
      ADD "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false
    `);

    // Convert fitnessAreas to enum type
    await queryRunner.query(`
      CREATE TYPE "public"."coach_profiles_fitness_areas_enum" AS ENUM(
        'weight_loss', 'strength_training', 'cardio', 'yoga', 'pilates',
        'hiit', 'crossfit', 'bodybuilding', 'flexibility', 'nutrition',
        'sports_specific', 'rehabilitation', 'senior_fitness', 
        'prenatal_fitness', 'functional_training'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "coach_profiles"
      ALTER COLUMN "fitnessAreas" TYPE "public"."coach_profiles_fitness_areas_enum"[] USING "fitnessAreas"::text::"public"."coach_profiles_fitness_areas_enum"[]
    `);

    // Create gender enum type
    await queryRunner.query(`
      CREATE TYPE "public"."coach_profiles_gender_enum" AS ENUM(
        'male', 'female', 'other', 'prefer_not_to_say'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "coach_profiles"
      ALTER COLUMN "gender" TYPE "public"."coach_profiles_gender_enum" USING "gender"::"public"."coach_profiles_gender_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert coach_profiles changes
    await queryRunner.query(`
      ALTER TABLE "coach_profiles"
      DROP COLUMN "onboardingCompleted",
      DROP COLUMN "fitnessAreas",
      DROP COLUMN "location",
      DROP COLUMN "age",
      DROP COLUMN "gender",
      DROP COLUMN "certificates",
      DROP COLUMN "bio"
    `);

    // Drop the enum types
    await queryRunner.query(
      `DROP TYPE "public"."coach_profiles_fitness_areas_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."coach_profiles_gender_enum"`);

    // Revert users table changes
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "phoneVerificationExpires",
      DROP COLUMN "phoneVerificationCode",
      DROP COLUMN "isPhoneVerified",
      DROP COLUMN "emailVerificationExpires",
      DROP COLUMN "emailVerificationToken",
      DROP COLUMN "isEmailVerified"
    `);
  }
}
