import type { EmployeeId, TenantId, UserId } from './branded';
import type { EmployeeRole } from './domain';

export interface TenantSummaryDto {
  id: TenantId;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeSummaryDto {
  id: EmployeeId;
  tenantId: TenantId;
  userId: UserId | null;
  email: string;
  displayName: string;
  role: EmployeeRole;
  createdAt: string;
  updatedAt: string;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
