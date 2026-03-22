import { Module } from '@nestjs/common';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { MessagingModule } from '../messaging/messaging.module';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [OrchestrationModule, MessagingModule],
  controllers: [DispatchController],
  providers: [DispatchService],
})
export class DispatchModule {}
