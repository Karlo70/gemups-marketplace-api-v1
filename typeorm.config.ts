import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

config({
  path: `.env.${process.env.NODE_ENV}`,
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  migrations: ['migrations/**'],
  entities: ['./dist/modules/**/**.entity.ts'],
  logging: true, // Optional: Enable logging for debugging
  ...(process.env.NODE_ENV !== 'development' && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});
