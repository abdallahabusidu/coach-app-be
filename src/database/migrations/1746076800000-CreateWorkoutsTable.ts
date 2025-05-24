import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkoutsTable1746076800000 implements MigrationInterface {
  name = 'CreateWorkoutsTable1746076800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."workout_type_enum" AS ENUM('strength', 'cardio', 'flexibility')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."difficulty_level_enum" AS ENUM('beginner', 'intermediate', 'advanced')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."media_type_enum" AS ENUM('image', 'video', 'pdf')
    `);

    // Create workouts table
    await queryRunner.query(`
      CREATE TABLE "workouts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "workoutType" "public"."workout_type_enum" NOT NULL,
        "difficulty" "public"."difficulty_level_enum" NOT NULL,
        "duration" integer NOT NULL,
        "exercises" jsonb NOT NULL DEFAULT '[]',
        "media" jsonb NOT NULL DEFAULT '[]',
        "caloriesBurned" integer,
        "equipment" text array NOT NULL DEFAULT '{}',
        "targetMuscleGroups" text array NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_5b2319bf8b0d081b5cd4779632b" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_workout_name" ON "workouts" ("name")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workout_type" ON "workouts" ("workoutType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workout_difficulty" ON "workouts" ("difficulty")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workout_duration" ON "workouts" ("duration")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_workout_calories" ON "workouts" ("caloriesBurned")
    `);

    // Create unique constraint for workout name
    await queryRunner.query(`
      ALTER TABLE "workouts" ADD CONSTRAINT "UQ_workout_name" UNIQUE ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_workout_calories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_workout_duration"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_workout_difficulty"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_workout_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_workout_name"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "workouts"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."media_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."difficulty_level_enum"`);
    await queryRunner.query(`DROP TYPE "public"."workout_type_enum"`);
  }
}
