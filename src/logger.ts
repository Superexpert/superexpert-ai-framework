import { PassThrough } from "stream";

export interface LogMeta {
  userId?: string;
  agentId?: string;
  component?: string;
}

/* single in-memory bus */
export const logStream = new PassThrough({ objectMode: true });

/* ────────────────────────────────────────────────────────────────────────── */
export function getServerLogger(bindings: LogMeta = {}) {
  /*  internal helper  */
  const write = (level: string, msg: string, meta: Record<string, unknown>) => {
    const line = { time: Date.now(), level, msg, ...bindings, ...meta };

    /* 1️⃣ stdout → Terminal & Vercel */
    console.log(JSON.stringify(line));

    /* 2️⃣ push for any sinks (DB listener, Datadog, etc.) */
    logStream.write(line);
  };

  /*  public API  */
  return {
    child(extra: LogMeta) {
      return getServerLogger({ ...bindings, ...extra });
    },

    info(msg: string, meta: Record<string, unknown> = {}) {
      write("info", msg, meta);
    },
    warn(msg: string, meta: Record<string, unknown> = {}) {
      write("warn", msg, meta);
    },
    error(err: Error, msg = "") {
      write("error", msg || err.message, {
        err: { message: err.message },
      });
    },

    /** waits until everything already written has reached the listeners */
    flush(): Promise<void> {
      return new Promise((res) => {
        const waitDb = () => {
          const ls = logStream as typeof logStream & { __pending?: number };
          if (!ls.__pending) return res(); // no inserts in flight
          ls.once("db-drain", res); // wait for listener
        };

        if (logStream.writableLength === 0) {
          waitDb(); // nothing buffered
        } else {
          logStream.once("drain", waitDb); // wait for stream → then DB
        }
      });
    },
  };
}
