import type { LokiOptions } from 'pino-loki'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

import env from '#start/env'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .pushIf(!app.inProduction, targets.pretty())
          .push({
            target: 'pino-loki',
            options: {
              labels: { application: 'MY-APP' },
              host: env.get('LOKI_HOST'),
              basicAuth: {
                username: env.get('LOKI_USERNAME'),
                password: env.get('LOKI_PASSWORD'),
              },
            } satisfies LokiOptions,
          })
          .toArray(),
      },
    },
  },
})

export default loggerConfig

/**
 * Inferring types for the list of loggers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface LoggersList extends InferLoggers<typeof loggerConfig> {}
}
