import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // CORS_ALLOW_ANY=1 is for temporary public tunnel testing only.
  const allowAnyCors = process.env.CORS_ALLOW_ANY === '1';
  app.enableCors({
    origin: allowAnyCors ? true : origins,
    credentials: true,
  });

  const uploadDir = process.env.UPLOAD_DIR ?? './uploads';
  const uploadPath = join(process.cwd(), uploadDir);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }
  app.useStaticAssets(uploadPath, { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  console.log(`Rajeeta API listening on http://${host}:${port}`);
}

bootstrap();
