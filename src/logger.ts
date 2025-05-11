const pino = require("pino") as typeof import("pino").default;
import type { Logger } from "pino";

import pretty from "pino-pretty";
import { PassThrough } from "stream";

const { multistream } = pino;

/* --------------------------------------------------------------- */
/* 1.  JSON side-stream that consumers can listen to               */
/* --------------------------------------------------------------- */
export const logStream = new PassThrough({ objectMode: true });

/* --------------------------------------------------------------- */
/* 2.  Pretty print for terminal in dev mode                       */
/* --------------------------------------------------------------- */
const prettyStream =
  process.env.NODE_ENV === "production"
    ? undefined // keep JSON in prod logs
    : pretty({
        colorize: true,
        translateTime: "HH:MM:ss",
        singleLine: true,
        ignore: "hostname,pid,stack",
        messageFormat(log) {
          const l = log as Record<string, any>;
          const errMsg = l.err?.message ?? "";
          return `${String(l.levelLabel).padEnd(5)} ${l.msg ?? ""} ${errMsg}`;
        },
      });

/* --------------------------------------------------------------- */
/* 3.  Singleton guard (works across Next hot reloads)             */
/* --------------------------------------------------------------- */
declare global {
  // eslint-disable-next-line no-var
  var seLogger: Logger | undefined;
}

if (!global.seLogger) {
  global.seLogger = pino(
    {
      level: process.env.DEBUG_LEVEL ?? "info",
      formatters: {
        level(label) {
          return { levelLabel: label }; // expose plain label
        },
      },

      /* --------------------------------------------------------- */
      /* 4.  Hook: trim error objects, merge bindings, still print */
      /* --------------------------------------------------------- */
      hooks: {
        logMethod(args, method, levelNo) {
          const bindings = ((this as Logger).bindings?.() ?? {}) as Record<
            string,
            unknown
          >;

          // Optional first-argument meta
          const meta =
            args[0] && typeof args[0] === "object" && !Array.isArray(args[0])
              ? (args[0] as Record<string, unknown>)
              : {};

          Object.assign(meta, bindings); // ensure userId/agentId visible

          // Trim oversized err objects to { type, message }
          if (meta.err && typeof meta.err === "object") {
            const e = meta.err as Record<string, any>;
            meta.err = {
              type: e.type ?? "Error",
              message: typeof e.message === "string" ? e.message : "",
            };
          }

          // Pretty/JSON output to stdout
          //   - if first arg was an object: replace it with the trimmed+merged `meta`
          //   - if first arg was a string:  leave args untouched
          if (typeof args[0] === "object" && !Array.isArray(args[0])) {
            method.apply(this, [meta, ...args.slice(1)]);
          } else {
            method.apply(this, args);
          }

          /* push JSON to logStream exactly as before … */
          logStream.write({
            ...meta,
            level: pino.levels.labels[levelNo],
            msg:
              typeof args[1] === "string"
                ? args[1]
                : typeof args[0] === "string"
                ? args[0]
                : meta.err && typeof meta.err === "object"
                ? (meta.err as any).message
                : "",
            time: Date.now(),
          });
        },
      },
    },
    multistream(
      [
        prettyStream
          ? { stream: prettyStream, level: "debug" }
          : { stream: process.stdout }, // prod → JSON
      ],
      { dedupe: false }
    )
  );
}

/* --------------------------------------------------------------- */
/* 5.  Export the shared logger                                    */
/* --------------------------------------------------------------- */
export const baseLog = global.seLogger!;
