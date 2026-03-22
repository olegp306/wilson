/** Mirrors orchestrator / agent HTTP headers for provider calls. */
export interface TenantExecutionContext {
  tenantId: string;
  employeeId?: string;
  correlationId: string;
}
