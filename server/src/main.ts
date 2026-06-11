import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim().replace(/^['"]|['"]$/g, '');

  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl) return frontendUrl.split(',').map(normalizeOrigin).filter(Boolean);
  if (process.env.NODE_ENV === 'production') throw new Error('FRONTEND_URL is required');
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
};

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4000);

  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  await app.listen(port);
};

void bootstrap();
