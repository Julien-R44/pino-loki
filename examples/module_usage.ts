/**
 * Example for using pino-loki in the main process
 * instead of as a worker thread.
 *
 * THIS IS NOT RECOMMENDED FOR PRODUCTION USE, but
 * maybe someone can find a valid use case for it ?
 */

import 'dotenv/config'
import { pino } from 'pino'
import pinoLoki from '../src/index.js'

const logger = pino(
  { level: 'info' },
  pinoLoki({
    batching: false,

    // These labels will be added to every log
    labels: { application: 'MY-APP' },

    // Credentials for our Loki instance
    host: process.env.LOKI_HOST!,
    basicAuth: {
      username: process.env.LOKI_USERNAME!,
      password: process.env.LOKI_PASSWORD!,
    },
  }),
)

logger.info('Module 1!')
logger.warn('Module 2!')
logger.error('Module 3!')
