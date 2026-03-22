/**
 * Calls agent HTTP endpoints only. Vendor SDKs (Google, Atlassian, IMAP, etc.) belong in agent
 * processes behind `@wilson/integration-sdk` — never import them here.
 */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  AGENT_HTTP_ROUTES,
  WILSON_HTTP_HEADERS,
  parseAgentResponseBody,
  type OrchestratorCommandEnvelope,
  type OrchestratorDispatchResponse,
} from '@wilson/event-contracts';
import type { JsonValue } from '@wilson/shared-types';
import { createLogger } from '@wilson/logger';
import { firstValueFrom } from 'rxjs';
import type { OrchestrationRuntime } from './orchestration-runtime.interface';

@Injectable()
export class HttpOrchestrationRuntime implements OrchestrationRuntime {
  private readonly log = createLogger({ name: 'orchestrator-http-runtime' });

  constructor(private readonly http: HttpService) {}

  async dispatch(command: OrchestratorCommandEnvelope): Promise<OrchestratorDispatchResponse> {
    const route = AGENT_HTTP_ROUTES[command.type];
    const baseUrl = process.env[route.baseUrlEnv];
    const correlationId = command.context.correlationId;
    const tenantId = command.context.tenantId;

    if (!baseUrl) {
      this.log.error(
        {
          event: 'agent_unavailable',
          correlationId,
          tenantId,
          env: route.baseUrlEnv,
          agentKey: route.agentKey,
        },
        'agent base URL not configured',
      );
      return {
        correlationId,
        outcome: {
          ok: false,
          error: {
            code: 'AGENT_UNAVAILABLE',
            message: `Missing environment variable ${route.baseUrlEnv}`,
          },
        },
      };
    }

    const url = `${baseUrl.replace(/\/$/, '')}${route.path}`;
    const headers: Record<string, string> = {
      [WILSON_HTTP_HEADERS.correlationId]: correlationId,
      [WILSON_HTTP_HEADERS.tenantId]: tenantId,
    };
    if (command.context.employeeId) {
      headers[WILSON_HTTP_HEADERS.employeeId] = command.context.employeeId;
    }

    this.log.info(
      {
        event: 'agent_request',
        correlationId,
        tenantId,
        commandType: command.type,
        agentKey: route.agentKey,
        method: route.method,
        url,
      },
      'dispatch to agent',
    );

    try {
      const response =
        route.method === 'GET'
          ? await firstValueFrom(
              this.http.get(url, {
                headers,
                validateStatus: () => true,
              }),
            )
          : await firstValueFrom(
              this.http.post(url, command.payload ?? {}, {
                headers,
                validateStatus: () => true,
              }),
            );

      if (response.status >= 400) {
        this.log.warn(
          {
            event: 'agent_http_error',
            correlationId,
            tenantId,
            agentKey: route.agentKey,
            status: response.status,
          },
          'agent returned error status',
        );
        return {
          correlationId,
          outcome: {
            ok: false,
            error: {
              code: 'AGENT_ERROR',
              message: `Agent returned HTTP ${response.status}`,
              details: response.data as JsonValue,
            },
          },
        };
      }

      const validated = parseAgentResponseBody(command.type, response.data);
      if (!validated.ok) {
        this.log.error(
          {
            event: 'agent_contract_violation',
            correlationId,
            tenantId,
            agentKey: route.agentKey,
            details: validated.details,
          },
          validated.message,
        );
        return {
          correlationId,
          outcome: {
            ok: false,
            error: {
              code: validated.code,
              message: validated.message,
              details: validated.details as JsonValue,
            },
          },
        };
      }

      return {
        correlationId,
        outcome: {
          ok: true,
          result: {
            agent: route.agentKey,
            data: validated.data,
          },
        },
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.log.error(
        {
          event: 'agent_request_failed',
          correlationId,
          tenantId,
          agentKey: route.agentKey,
          err: err instanceof Error ? { name: err.name, message: err.message } : String(err),
        },
        'agent request failed',
      );
      return {
        correlationId,
        outcome: {
          ok: false,
          error: { code: 'AGENT_REQUEST_FAILED', message },
        },
      };
    }
  }
}
