import { randomUUID } from 'node:crypto';

/**
 * Hits mail-agent directly (no orchestrator). Set MAIL_AGENT_URL and Wilson headers.
 * For IMAP, ensure IntegrationConnection exists or MAIL_FORCE_MOCK=1 for dev.
 */
const base = process.env.MAIL_AGENT_URL ?? 'http://localhost:3013';
const tenantId = process.env.WILSON_TENANT_ID ?? '11111111-1111-4111-8111-111111111111';
const employeeId = process.env.WILSON_EMPLOYEE_ID ?? '22222222-2222-4222-8222-222222222222';

async function main() {
  const url = `${base.replace(/\/$/, '')}/mail/latest`;
  const res = await fetch(url, {
    headers: {
      'x-tenant-id': tenantId,
      'x-employee-id': employeeId,
      'x-correlation-id': randomUUID(),
    },
  });
  const text = await res.text();
  console.log(res.status, text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
