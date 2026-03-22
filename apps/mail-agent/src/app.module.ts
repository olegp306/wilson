import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MailApplicationService } from './mail-application.service';
import { MailController } from './mail.controller';
import { MailProviderResolverService } from './mail/mail-provider-resolver.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController, MailController],
  providers: [MailApplicationService, MailProviderResolverService],
})
export class AppModule {}
