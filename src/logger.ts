import { PassThrough } from 'stream';

export interface LogMeta {
  userId?: string;
  agentId?: string;
  component?: string;
}

/** single in-memory bus (stdout → listeners → DB) */
export const logStream = new PassThrough({ objectMode: true });

/** factory  ─────────────────────────────────────────────────────────────── */
export function getServerLogger(bindings: LogMeta = {}) {
  /* internal write helper */
  const write = (
    level: string,
    msg: string,
    meta: Record<string, unknown>,
  ) => {
    const line = { time: Date.now(), level, msg, ...bindings, ...meta };

    /* 1️⃣  terminal / Vercel */
    console.log(JSON.stringify(line));

    /* 2️⃣  fan-out to Postgres listener */
    logStream.write(line);
  };

  /* public API */
  return {
    child(extra: LogMeta) { return getServerLogger({ ...bindings, ...extra }); },
    info (msg: string, meta: Record<string, unknown> = {}) { write('info',  msg, meta); },
    warn (msg: string, meta: Record<string, unknown> = {}) { write('warn',  msg, meta); },
    error(err: Error, msg = '') {
      write('error', msg || err.message, { err: { message: err.message } });
    },

    /** new flush: waits, but emits **no** dummy row */
    flush(): Promise<void> {
      return new Promise((res) => {
        if (logStream.writableLength === 0) return res();     // already drained
        logStream.once('drain', res);                         // wait for listeners
      });
    },
  };
}