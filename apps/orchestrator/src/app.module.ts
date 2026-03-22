import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DispatchModule } from './dispatch/dispatch.module';
import { MessagingModule } from './messaging/messaging.module';
import { OrchestrationModule } from './orchestration/orchestration.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrchestrationModule, DispatchModule, MessagingModule],
  controllers: [AppController],
})
export class AppModule {}
