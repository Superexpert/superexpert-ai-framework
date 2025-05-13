export interface LoggerContract {
  info (msg: string, meta?: Record<string, unknown>): Promise<void> | void;
  warn (msg: string, meta?: Record<string, unknown>): Promise<void> | void;
  error(err: Error, msg?: string): Promise<void> | void;
  child(extra: Record<string, unknown>): LoggerContract;
}