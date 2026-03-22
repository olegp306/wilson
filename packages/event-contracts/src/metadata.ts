import type { EmployeeId, TenantId } from '@wilson/shared-types';

export interface CorrelationContext {
  correlationId: string;
  tenantId: TenantId;
  employeeId?: EmployeeId;
  traceId?: string;
  causationId?: string;
}
