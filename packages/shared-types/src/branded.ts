export type Brand<T, B extends string> = T & { readonly __brand: B };

export type TenantId = Brand<string, 'TenantId'>;
export type UserId = Brand<string, 'UserId'>;
export type EmployeeId = Brand<string, 'EmployeeId'>;

export function tenantId(value: string): TenantId {
  return value as TenantId;
}

export function userId(value: string): UserId {
  return value as UserId;
}

export function employeeId(value: string): EmployeeId {
  return value as EmployeeId;
}
