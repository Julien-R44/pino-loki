import 'dotenv/config'
import { pino } from 'pino'
import { LokiOptions } from '../src/types/index'

const transport = pino.transport<LokiOptions>({
  // 👇 Replace this with "pino-loki"
  target: '../dist/index.mjs',

  options: {
    // These labels will be added to every log
    labels: { application: 'MY-APP' },

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
