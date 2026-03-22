import { Module } from '@nestjs/common';
import { createStubIntegrationHub, WILSON_INJECTION } from '@wilson/integration-sdk';
import { AppController } from './app.controller';
import { TaskApplicationService } from './task-application.service';
import { TasksController } from './tasks.controller';

const hub = createStubIntegrationHub();

@Module({
  controllers: [AppController, TasksController],
  providers: [
    TaskApplicationService,
    { provide: WILSON_INJECTION.TASK_PROVIDER, useFactory: () => hub.taskProvider() },
  ],
})
export class AppModule {}
