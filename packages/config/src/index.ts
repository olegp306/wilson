import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  NATS_URL: z.string().url().optional(),
  /** Real Telegram polling; omit to run dev simulation server instead */
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  ORCHESTRATOR_URL: z.string().optional(),
  WILSON_TENANT_ID: z.string().uuid().optional(),
  WILSON_EMPLOYEE_ID: z.string().uuid().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  TELEGRAM_BOT_DEV_PORT: z.coerce.number().int().positive().optional(),
  /** Force mock mail provider (1) even when DB + integration exist */
  MAIL_FORCE_MOCK: z.enum(['0', '1']).optional(),
  /** Force mock calendar (1) */
  CALENDAR_FORCE_MOCK: z.enum(['0', '1']).optional(),
  /** Optional IMAP defaults for local testing (integration secret still preferred) */
  IMAP_HOST: z.string().optional(),
  IMAP_PORT: z.string().optional(),
  IMAP_USER: z.string().optional(),
  IMAP_PASSWORD: z.string().optional(),
  /** OpenAI for mail summary / draft when set */
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  /**
   * Path to a JSON file with Google service account or OAuth client credentials,
   * or inline JSON string (see docs/stage-3.md).
   */
  GOOGLE_CALENDAR_CONFIG: z.string().optional(),
});

export type BaseEnv = z.infer<typeof baseSchema>;

export interface LoadEnvOptions {
  path?: string;
  override?: boolean;
}

export function loadRootEnv(options: LoadEnvOptions = {}): void {
  loadEnv({ path: options.path ?? '.env', override: options.override ?? false });
}

export function parseBaseEnv(env: NodeJS.ProcessEnv = process.env): BaseEnv {
  return baseSchema.parse(env);
}

export function createAppEnvSchema<T extends z.ZodRawShape>(extra: T) {
  return baseSchema.extend(extra);
}
