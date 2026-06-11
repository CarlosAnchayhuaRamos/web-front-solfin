import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const productionOrigins = ['https://solfin-web-pilot.onrender.com'];
const developmentOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const normalizeOrigin = (origin: string) => {
  const trimmed = origin.trim().replace(/^['"]|['"]$/g, '');

  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
};

const getAllowedOrigins = () => {
  const frontendUrl = process.env.FRONTEND_URL;
  const configuredOrigins = frontendUrl?.split(',').map(normalizeOrigin).filter(Boolean) ?? [];

  if (process.env.NODE_ENV === 'production') return [...new Set([...productionOrigins, ...configuredOrigins])];
  return [...new Set([...developmentOrigins, ...configuredOrigins])];
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
