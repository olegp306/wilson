import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { loadRootEnv } from '@wilson/config';
import { AppModule } from './app.module';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  const port = Number(process.env.MAIL_AGENT_PORT ?? 3013);
  await app.listen(port);
  console.log(`mail-agent listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
