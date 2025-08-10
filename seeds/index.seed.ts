import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { createSuperAdmin } from './create-super-admin.seed';
// Load the correct .env file
config({
  path: `.env.${process.env.NODE_ENV}`,
});
// Initialize TypeORM DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  logging: true,
  ...(process.env.NODE_ENV !== 'development' && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

const seed = async () => {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    console.log('Connected to the database!');
    
    await createSuperAdmin(AppDataSource);

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding industries:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
};

seed();
