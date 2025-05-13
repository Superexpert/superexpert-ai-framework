import { PassThrough } from "stream";

export interface LogMeta {
  userId?: string;
  agentId?: string;
  component?: string;
}

/* single in-memory bus */
export const logStream = new PassThrough({ objectMode: true });

export function getServerLogger(bindings: LogMeta = {}) {
  const write = (level: string, msg: string, meta: Record<string, unknown>) => {
    const line = { time: Date.now(), level, msg, ...bindings, ...meta };
    console.log(JSON.stringify(line));   // terminal + Vercel
    logStream.write(line);               // fan-out to listeners
  };

  return {
    child(extra: LogMeta) { return getServerLogger({ ...bindings, ...extra }); },
    info (msg: string, meta: Record<string, unknown> = {}) { write('info',  msg, meta); },
    warn (msg: string, meta: Record<string, unknown> = {}) { write('warn',  msg, meta); },
    error(err: Error, msg = '') {
      write('error', msg || err.message, { err: { message: err.message } });
    },
  };
}
