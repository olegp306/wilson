import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadRootEnv } from '@wilson/config';
import { AppModule } from './app.module';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.CALENDAR_AGENT_PORT ?? 3012);
  await app.listen(port);
  console.log(`calendar-agent listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
