import pino from 'pino';
import type { Logger as PinoLogger } from 'pino';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface Logger {
  child(bindings: Record<string, unknown>): Logger;
  fatal(obj: Record<string, unknown>, msg?: string): void;
  error(obj: Record<string, unknown>, msg?: string): void;
  warn(obj: Record<string, unknown>, msg?: string): void;
  info(obj: Record<string, unknown>, msg?: string): void;
  debug(obj: Record<string, unknown>, msg?: string): void;
  trace(obj: Record<string, unknown>, msg?: string): void;
}

function wrap(base: PinoLogger): Logger {
  return {
    child(bindings: Record<string, unknown>) {
      return wrap(base.child(bindings));
    },
    fatal(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.fatal(obj, msg);
      else base.fatal(obj);
    },
    error(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.error(obj, msg);
      else base.error(obj);
    },
    warn(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.warn(obj, msg);
      else base.warn(obj);
    },
    info(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.info(obj, msg);
      else base.info(obj);
    },
    debug(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.debug(obj, msg);
      else base.debug(obj);
    },
    trace(obj: Record<string, unknown>, msg?: string) {
      if (msg !== undefined) base.trace(obj, msg);
      else base.trace(obj);
    },
  };
}

export interface CreateLoggerOptions {
  name: string;
  level?: LogLevel;
  pretty?: boolean;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  const level = options.level ?? (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
  const pretty =
    options.pretty ??
    (process.env.NODE_ENV === 'development' || process.env.LOG_PRETTY === '1');

  const base = pino({
    base: { service: options.name },
    level,
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  });

  return wrap(base);
}
