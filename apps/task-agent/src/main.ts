import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { loadRootEnv } from '@wilson/config';
import { AppModule } from './app.module';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.TASK_AGENT_PORT ?? 3011);
  await app.listen(port);
  console.log(`task-agent listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
