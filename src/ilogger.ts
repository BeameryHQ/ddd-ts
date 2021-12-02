/**
 * Logger.
 *
 * Note:
 * - Logger format is based on PinoJS
 *   @see https://github.com/pinojs/pino
 */

interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: unknown[]): void;
  (obj: unknown, msg?: string, ...args: unknown[]): void;
}

export interface ILogger {
  fatal: LogFn;
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
}
