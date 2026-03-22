import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { HttpOrchestrationRuntime } from './http-orchestration.runtime';
import { OrchestratorApplicationService } from './orchestrator-application.service';
import { ORCHESTRATION_RUNTIME } from './tokens';

@Module({
  imports: [HttpModule],
  providers: [
    HttpOrchestrationRuntime,
    OrchestratorApplicationService,
    {
      provide: ORCHESTRATION_RUNTIME,
      useExisting: HttpOrchestrationRuntime,
    },
  ],
  exports: [ORCHESTRATION_RUNTIME, HttpOrchestrationRuntime, OrchestratorApplicationService],
})
export class OrchestrationModule {}
