import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      return;
    }
    try {
      await this.$connect();
    } catch {
      /* mail-agent can run with MAIL_FORCE_MOCK only */
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
