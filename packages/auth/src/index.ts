import type { EmployeeId, TenantId, UserId } from '@wilson/shared-types';

export interface AuthPrincipal {
  tenantId: TenantId;
  userId: UserId;
  employeeId?: EmployeeId;
  roles: string[];
}

export interface AuthContext {
  principal: AuthPrincipal | null;
  correlationId: string;
}

export interface AuthGuard {
  assertTenantAccess(tenantId: TenantId): void;
  assertRole(role: string): void;
}

export interface TokenVerifier {
  verify(token: string): Promise<AuthPrincipal | null>;
}
