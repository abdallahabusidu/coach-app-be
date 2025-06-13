import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  ForeignKey,
} from 'typeorm';

export class CreateNotificationsTable1746080500000
  implements MigrationInterface
{
  name = 'CreateNotificationsTable1746080500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'task_completed',
        'missed_task', 
        'new_trainee_joined',
        'message_received',
        'payment_due',
        'workout_reminder',
        'meal_reminder',
        'goal_achieved',
        'subscription_expired',
        'certificate_expiring',
        'profile_incomplete',
        'system_update',
        'promotional'
      )
    `);

    // Create notification_status enum
    await queryRunner.query(`
      CREATE TYPE "notification_status_enum" AS ENUM ('read', 'unread')
    `);

    // Create notifications table
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'notification_type_enum',
            isNullable: false,
          },
          {
            name: 'header',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'notification_status_enum',
            default: "'unread'",
            isNullable: false,
          },
          {
            name: 'navigationLink',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'readAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_type', ['type']),
    );

    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_status', ['status']),
    );

    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_userId', ['userId']),
    );

    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_timestamp', ['timestamp']),
    );

    // Create composite indexes for common query patterns
    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_user_status', ['userId', 'status']),
    );

    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_user_type', ['userId', 'type']),
    );

    await queryRunner.createIndex(
      'notifications',
      new Index('IDX_notifications_user_timestamp', ['userId', 'timestamp']),
    );

    // Create foreign key constraint to users table
    await queryRunner.createForeignKey(
      'notifications',
      new ForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_notifications_user',
      }),
    );

    // Create partial index for unread notifications (more efficient for unread count queries)
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_unread" ON "notifications" ("userId") 
      WHERE "status" = 'unread'
    `);

    // Create index on metadata for queries on specific metadata fields
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_metadata_priority" ON "notifications" 
      USING GIN ((metadata->'priority'))
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_metadata_entity" ON "notifications" 
      USING GIN ((metadata->'entityId'), (metadata->'entityType'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('notifications', 'FK_notifications_user');

    // Drop custom indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_unread"');
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_notifications_metadata_priority"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_notifications_metadata_entity"',
    );

    // Drop table (this will also drop all other indexes)
    await queryRunner.dropTable('notifications');

    // Drop enums
    await queryRunner.query('DROP TYPE IF EXISTS "notification_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "notification_type_enum"');
  }
}
