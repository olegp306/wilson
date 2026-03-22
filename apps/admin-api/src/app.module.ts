import { Module } from '@nestjs/common';
import { AgentConfigModule } from './agent-config/agent-config.module';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { EmployeeModule } from './employee/employee.module';
import { IntegrationModule } from './integration/integration.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelegramBindingModule } from './telegram-binding/telegram-binding.module';
import { TenantModule } from './tenant/tenant.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    TenantModule,
    EmployeeModule,
    AgentConfigModule,
    IntegrationModule,
    TelegramBindingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
