import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { createSuperAdmin } from './create-super-admin.seed';
import { createCryptomusWallets } from './create-cryptomus-wallets.seed';
import { createCategories } from './create-categories.seed';
import { createProducts } from './create-products.seed';
// Load the correct .env file
config({
  path: `.env.${process.env.NODE_ENV}`,
});
// Initialize TypeORM DataSource
const AppDataSource = new DataSource({
  url: process.env.DB_URL,
  synchronize: false,
  logging: true,
  type: 'postgres',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
  ssl: process.env.NODE_ENV !== 'development' ? {
    rejectUnauthorized: false,
  } : false,
});

const seed = async () => {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    console.log('Connected to the database!');
    
    await createSuperAdmin(AppDataSource);
    await createCryptomusWallets(AppDataSource);
    await createCategories(AppDataSource);
    await createProducts(AppDataSource);

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding industries:', error);
  } finally {
    await AppDataSource.destroy();
    console.log('Database connection closed.');
  }
};

seed();
