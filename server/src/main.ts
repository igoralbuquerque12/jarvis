import express from 'express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BetterAuthService } from './auth/better-auth.service';
import { toNodeHandler } from 'better-auth/node';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  const webOrigin = process.env.WEB_ORIGIN?.trim() || 'http://localhost:5173';

  app.enableCors({
    origin: webOrigin,
    credentials: true,
  });

  const authService = app.get(BetterAuthService);

  app.use('/api/auth', toNodeHandler(authService.instance));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}.`);
}
void bootstrap();
