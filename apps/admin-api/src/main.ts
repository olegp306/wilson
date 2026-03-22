import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadRootEnv } from '@wilson/config';
import { AppModule } from './app.module';

async function bootstrap() {
  loadRootEnv();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wilson Admin API')
    .setDescription('Tenant and employee administration')
    .setVersion('0.1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-admin-key', in: 'header', description: 'Matches ADMIN_API_KEY when set' },
      'admin-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.ADMIN_API_PORT ?? 3000);
  await app.listen(port);
  console.log(`admin-api listening on http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
