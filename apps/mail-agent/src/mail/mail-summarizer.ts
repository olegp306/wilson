import type { MailMessageRef } from '@wilson/integration-sdk';

export function heuristicBriefSummary(messages: MailMessageRef[]): string {
  if (messages.length === 0) {
    return 'No recent messages in this folder.';
  }
  return messages
    .slice(0, 5)
    .map((m) => `• ${m.subject} — ${m.from}`)
    .join('\n');
}

export async function maybeLlmBriefSummary(
  messages: MailMessageRef[],
  apiKey: string | undefined,
): Promise<string | undefined> {
  if (!apiKey || messages.length === 0) {
    return undefined;
  }
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const body = messages
    .slice(0, 8)
    .map((m) => `${m.from}: ${m.subject}\n${m.snippet}`)
    .join('\n---\n');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: `Write 2–3 short neutral sentences summarizing these inbox snippets for a busy user. Do not invent senders.\n\n${body}`,
        },
      ],
      max_tokens: 200,
    }),
  });
  if (!res.ok) {
    return undefined;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  return text || undefined;
}

export async function maybeLlmDraftReply(
  subject: string,
  bodyPreview: string,
  tone: 'professional' | 'casual' | 'brief',
  apiKey: string | undefined,
): Promise<string | undefined> {
  if (!apiKey) {
    return undefined;
  }
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: `Draft a ${tone} email reply (no greeting name) regarding subject: "${subject}". Context:\n${bodyPreview}\n\nDo not send the email; draft text only.`,
        },
      ],
      max_tokens: 400,
    }),
  });
  if (!res.ok) {
    return undefined;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim();
}
