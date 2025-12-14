import 'dotenv/config'

import pino from 'pino'

import { LokiLogLevel } from '../src/constants.ts'
import type { LokiOptions } from '../src/types.ts'

const transport = pino.transport<LokiOptions>({
  // 👇 Replace this with "pino-loki"
  target: '../dist/index.js',

  options: {
    // These labels will be added to every log
    labels: { application: 'MY-APP' },
    // custom log levels
    levelMap: {
      '5': LokiLogLevel.Debug, // Add a custom log level
      '10': LokiLogLevel.Info, // Override a default mapping
    },
    // Credentials for our Loki instance
    host: process.env.LOKI_HOST!,
    basicAuth: {
      username: process.env.LOKI_USERNAME!,
      password: process.env.LOKI_PASSWORD!,
    },
  },
})

const logger = pino(transport)

logger.info('Hello 1!')
logger.warn('Hello 2!')
logger.error('Hello 3!')
