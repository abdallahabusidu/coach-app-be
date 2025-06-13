import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardTables1746080400000 implements MigrationInterface {
  name = 'CreateDashboardTables1746080400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."activity_type_enum" AS ENUM(
        'workout_completed', 'meal_logged', 'weight_recorded', 'goal_achieved', 'check_in'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."subscription_status_enum" AS ENUM(
        'active', 'pending', 'suspended', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."message_type_enum" AS ENUM(
        'text', 'image', 'file', 'system'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."message_status_enum" AS ENUM(
        'sent', 'delivered', 'read'
      )
    `);

    // Create quotes table
    await queryRunner.query(`
      CREATE TABLE "quotes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "text" text NOT NULL,
        "author" character varying(200) NOT NULL,
        "category" character varying(100) NOT NULL DEFAULT 'motivation',
        "isActive" boolean NOT NULL DEFAULT true,
        "timesServed" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_quotes" PRIMARY KEY ("id")
      )
    `);

    // Create trainee_progress table
    await queryRunner.query(`
      CREATE TABLE "trainee_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "traineeId" uuid NOT NULL,
        "coachId" uuid NOT NULL,
        "workoutCompletionPercentage" numeric(5,2) NOT NULL DEFAULT 0,
        "totalWorkoutsCompleted" integer NOT NULL DEFAULT 0,
        "currentWeight" numeric(5,2),
        "targetWeight" numeric(5,2),
        "subscriptionStatus" "public"."subscription_status_enum" NOT NULL DEFAULT 'pending',
        "subscriptionStartDate" date,
        "subscriptionEndDate" date,
        "lastActivityDate" TIMESTAMP,
        "lastActivityType" "public"."activity_type_enum",
        "notes" text,
        "progressData" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_trainee_progress" PRIMARY KEY ("id")
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "senderId" uuid NOT NULL,
        "receiverId" uuid NOT NULL,
        "content" text NOT NULL,
        "type" "public"."message_type_enum" NOT NULL DEFAULT 'text',
        "status" "public"."message_status_enum" NOT NULL DEFAULT 'sent',
        "fileUrl" character varying,
        "fileType" character varying,
        "readAt" TIMESTAMP,
        "isArchived" boolean NOT NULL DEFAULT false,
        "threadId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_quotes_category" ON "quotes" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_quotes_isActive" ON "quotes" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trainee_progress_traineeId" ON "trainee_progress" ("traineeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trainee_progress_coachId" ON "trainee_progress" ("coachId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trainee_progress_status" ON "trainee_progress" ("subscriptionStatus")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_trainee_progress_lastActivity" ON "trainee_progress" ("lastActivityDate")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_senderId" ON "messages" ("senderId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_receiverId" ON "messages" ("receiverId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_status" ON "messages" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_isArchived" ON "messages" ("isArchived")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_threadId" ON "messages" ("threadId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_messages_createdAt" ON "messages" ("createdAt")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "trainee_progress" 
      ADD CONSTRAINT "FK_trainee_progress_trainee" 
      FOREIGN KEY ("traineeId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "trainee_progress" 
      ADD CONSTRAINT "FK_trainee_progress_coach" 
      FOREIGN KEY ("coachId") REFERENCES "coach_profiles"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_sender" 
      FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_receiver" 
      FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_receiver"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_sender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" DROP CONSTRAINT "FK_trainee_progress_coach"`,
    );
    await queryRunner.query(
      `ALTER TABLE "trainee_progress" DROP CONSTRAINT "FK_trainee_progress_trainee"`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_createdAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_threadId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_isArchived"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_receiverId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_messages_senderId"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_trainee_progress_lastActivity"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_trainee_progress_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_trainee_progress_coachId"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_trainee_progress_traineeId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_quotes_isActive"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_quotes_category"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "trainee_progress"`);
    await queryRunner.query(`DROP TABLE "quotes"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."message_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."activity_type_enum"`);
  }
}
