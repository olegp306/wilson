import type { IntegrationProvider, JsonValue } from '@wilson/shared-types';

/** Row-shaped credentials for wiring real adapters in Stage 3 (from `IntegrationConnection` or vault). */
export interface IntegrationCredentials {
  provider: IntegrationProvider;
  encryptedPayload: string;
  metadata: Record<string, JsonValue>;
}
