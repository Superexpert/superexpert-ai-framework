// packages/framework/src/logger.ts  (final, minimal)

import type { Logger } from 'pino';
const pino = require('pino') as typeof import('pino').default;
import { PassThrough } from 'stream';

export const logStream = new PassThrough({ objectMode: true });

declare global { var seLogger: Logger | undefined; }

if (!global.seLogger) {
  global.seLogger = pino(
    {
      level: process.env.DEBUG_LEVEL ?? 'info',
      formatters: {
        level: l => ({ level: l }),
      },
      hooks: {
        logMethod(args, method, levelNo) {
          const line = (args[0] && typeof args[0] === 'object') ? args[0] : {};
          method.apply(this, args);         // stdout (JSON)

          logStream.write({
            ...line,
            level: pino.levels.labels[levelNo],
            msg:   typeof args[1] === 'string' ? args[1] : '',
            time:  Date.now(),
          });
        },
      },
    },
    pino.destination(1),                    // stdout only
  );
}

export const baseLog = global.seLogger!;