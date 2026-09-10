import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser untuk membaca HttpOnly cookie (access_token, refresh_token)
  app.use(cookieParser());

  // CORS — development: izinkan localhost:3001 (frontend)
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
