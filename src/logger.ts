export interface LogMeta { userId?: string; agentId?: string; component?: string }

export function getServerLogger(bindings: LogMeta = {}) {
  const write = (level: string, msg: string, meta: Record<string, unknown>) => {
    const line = { time: Date.now(), level, msg, ...bindings, ...meta };
    console.log(JSON.stringify(line));          // 1️⃣ goes to stdout
    logStream.write(line);                      // 2️⃣ goes to Postgres listener
  };
  return {
    child(extra: LogMeta) { return getServerLogger({ ...bindings, ...extra }); },
    info(msg: string, meta = {})  { write('info',  msg, meta); },
    warn(msg: string, meta = {})  { write('warn',  msg, meta); },
    error(err: Error, msg = '')   {
      write('error', msg || err.message, { err: { message: err.message } });
    },
  };
}

import { PassThrough } from 'stream';
export const logStream = new PassThrough({ objectMode: true });