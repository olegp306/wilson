const orchestratorUrl = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3020';
const tenantId = process.env.WILSON_TENANT_ID ?? '11111111-1111-4111-8111-111111111111';
const employeeId = process.env.WILSON_EMPLOYEE_ID ?? '22222222-2222-4222-8222-222222222222';

async function dispatch(
  type: string,
  label: string,
  payload?: Record<string, unknown>,
) {
  const url = `${orchestratorUrl.replace(/\/$/, '')}/api/dispatch`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, tenantId, employeeId, payload }),
  });
  const data = await res.json();
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  console.log('Simulating telegram-bot → orchestrator → agent flows');
  await dispatch('GET_MY_TASKS', 'Flow A: /tasks');
  await dispatch('GET_MY_CALENDAR', 'Flow B: /calendar');
  await dispatch('GET_LATEST_MAIL_SUMMARY', 'Flow C: /mail-summary');
  await dispatch('GET_LATEST_EMAILS', 'Flow D: /mail');
  await dispatch('GENERATE_DRAFT_REPLY', 'Flow E: /draft-reply', { tone: 'professional' });

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);
  await dispatch('CREATE_CALENDAR_EVENT', 'Flow F: /newevent', {
    title: 'Wilson demo block',
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
