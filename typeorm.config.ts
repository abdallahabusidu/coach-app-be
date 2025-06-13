// typeorm.config.ts
const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

// Load environment variables based on NODE_ENV
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';

dotenv.config({ path: envFile });

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coach-app-db',
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/src/database/migrations/*.js'],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
});
