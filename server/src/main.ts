import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const bootstrap = async () => {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 4000);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(port);
};

void bootstrap();
