/* ------------------------------------------------------------------ */
/* 0. imports that are always safe in both Node & Edge                */
/* ------------------------------------------------------------------ */
import type { Logger } from 'pino';
import { PassThrough } from 'stream';

/* Common-JS import so it’s callable without esModuleInterop = true   */
const pino = require('pino') as typeof import('pino').default;
const { multistream } = pino;

/* ------------------------------------------------------------------ */
/* 1. JSON side-stream for DB / SSE consumers                          */
/* ------------------------------------------------------------------ */
export const logStream = new PassThrough({ objectMode: true });

/* ------------------------------------------------------------------ */
/* 2. Build pretty stream ONLY when we’re actually running on Node    */
/*    (not during Edge bundle analysis).                              */
/* ------------------------------------------------------------------ */
let prettyStream: NodeJS.WritableStream | undefined;

if (process.env.NODE_ENV !== 'production') {
  try {
    /* use eval so webpack can’t statically detect the require()     */
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const _require = eval('require') as NodeRequire;

    const pretty = _require('pino-pretty') as typeof import('pino-pretty');

    prettyStream = pretty({
      colorize: true,
      translateTime: 'HH:MM:ss',
      singleLine: true,
      ignore: 'hostname,pid,stack',
      messageFormat(log) {
        const l      = log as Record<string, any>;
        const errMsg = l.err?.message ?? '';
        return `${String(l.levelLabel).padEnd(5)} ${l.msg ?? ''} ${errMsg}`;
      },
    });
  } catch {
    /* pino-pretty isn’t installed or we’re on Edge — fall back to JSON */
  }
}

/* ------------------------------------------------------------------ */
/* 3. Singleton guard so hot-reload doesn’t spawn multiple loggers    */
/* ------------------------------------------------------------------ */
declare global {
  // eslint-disable-next-line no-var
  var seLogger: Logger | undefined;
}

if (!global.seLogger) {
  global.seLogger = pino(
    {
      level: process.env.DEBUG_LEVEL ?? 'info',
      formatters: {
        level(label) {
          return { levelLabel: label }; // expose plain label for pretty formatter
        },
      },

      /* ----------------------------------------------------------- */
      /* 4. Hook – trim err, merge bindings, forward to logStream    */
      /* ----------------------------------------------------------- */
      hooks: {
        logMethod(args, method, levelNo) {
          const bindings = ((this as Logger).bindings?.() ??
            {}) as Record<string, unknown>;

          const meta =
            args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])
              ? (args[0] as Record<string, unknown>)
              : {};

          Object.assign(meta, bindings);

          if (meta.err && typeof meta.err === 'object') {
            const e = meta.err as Record<string, any>;
            meta.err = {
              type: e.type ?? 'Error',
              message: typeof e.message === 'string' ? e.message : '',
            };
          }

          /* stdout with pretty (or JSON) */
          method.apply(this, args);

          /* JSON copy for DB / SSE listeners */
          logStream.write({
            ...meta,
            level: pino.levels.labels[levelNo],
            msg:
              typeof args[1] === 'string'
                ? args[1]
                : typeof args[0] === 'string'
                  ? args[0]
                  : meta.err && typeof meta.err === 'object'
                    ? (meta.err as any).message
                    : '',
            time: Date.now(),
          });
        },
      },
    },

    /* multistream → pretty dev / JSON prod, plus logStream          */
    multistream(
      [
        prettyStream
          ? { stream: prettyStream, level: 'debug' }
          : { stream: process.stdout }, // prod / edge JSON
      ],
      { dedupe: false },
    ),
  );
}

/* ------------------------------------------------------------------ */
/* 5. Export the singleton                                            */
/* ------------------------------------------------------------------ */
export const baseLog = global.seLogger!;