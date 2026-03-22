import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CalendarApplicationService } from './calendar-application.service';
import { CalendarController } from './calendar.controller';
import { CalendarIntegrationResolverService } from './calendar/calendar-integration-resolver.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, CalendarController],
  providers: [CalendarApplicationService, CalendarIntegrationResolverService],
})
export class AppModule {}
