import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim().replace(/^['"]|['"]$/g, '');

  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

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
    origin: frontendUrl.split(',').map(normalizeOrigin).filter(Boolean),
    credentials: true,
  });

  await app.listen(port);
};

void bootstrap();
