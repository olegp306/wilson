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
      // Allow orchestrator to start when the database is temporarily unavailable; persistence paths fail gracefully.
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
