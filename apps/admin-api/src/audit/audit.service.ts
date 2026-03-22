import { Injectable } from '@nestjs/common';
import { writeAuditLog } from '@wilson/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(params: Parameters<typeof writeAuditLog>[1]) {
    return writeAuditLog(this.prisma, params);
  }
}
