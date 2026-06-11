import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4000);
  const frontendUrl = process.env.FRONTEND_URL;

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  if (!frontendUrl) {
    throw new Error('FRONTEND_URL is required');
  }

  app.enableCors({
    origin: frontendUrl.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  await app.listen(port);
};

void bootstrap();
