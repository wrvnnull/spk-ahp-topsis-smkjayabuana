import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

// Load environment variables from .env
dotenv.config({ path: '.env' });

// Verify critical env vars are loaded
console.log('[ENV] JWT_ACCESS_SECRET:', process.env.JWT_ACCESS_SECRET ? 'LOADED' : 'MISSING');
console.log('[ENV] JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? 'LOADED' : 'MISSING');
console.log('[ENV] DATABASE_URL:', process.env.DATABASE_URL ? 'LOADED' : 'MISSING');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`Backend API berjalan di http://localhost:${port}`);
}

bootstrap();
