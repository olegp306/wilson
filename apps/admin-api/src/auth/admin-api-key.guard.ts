import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const path = req.path ?? req.url ?? '';
    if (path.includes('/health')) {
      return true;
    }

    const expected = process.env.ADMIN_API_KEY;
    if (!expected || expected.length === 0) {
      return true;
    }

    const provided = req.headers['x-admin-key'];
    const key = Array.isArray(provided) ? provided[0] : provided;
    if (key !== expected) {
      throw new UnauthorizedException('Invalid or missing x-admin-key');
    }
    return true;
  }
}
