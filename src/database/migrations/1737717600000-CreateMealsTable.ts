import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMealsTable1737717600000 implements MigrationInterface {
  name = 'CreateMealsTable1737717600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create meal_type enum
    await queryRunner.query(`
      CREATE TYPE "public"."meals_meal_type_enum" AS ENUM(
        'breakfast', 'lunch', 'dinner', 'snacks', 'drinks'
      )
    `);

    // Create meals table
    await queryRunner.query(`
      CREATE TABLE "meals" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "calories" numeric(8,2) NOT NULL,
        "protein" numeric(8,2) NOT NULL,
        "fat" numeric(8,2) NOT NULL,
        "carbs" numeric(8,2) NOT NULL,
        "ingredients" text array NOT NULL,
        "preparation" text NOT NULL,
        "imageUrl" character varying,
        "mealType" "public"."meals_meal_type_enum" NOT NULL,
        "description" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_meals" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_meals_meal_type" ON "meals" ("mealType")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_meals_calories" ON "meals" ("calories")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_meals_protein" ON "meals" ("protein")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_meals_name" ON "meals" ("name")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_meals_name"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_meals_protein"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_meals_calories"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_meals_meal_type"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "meals"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "public"."meals_meal_type_enum"`);
  }
}
