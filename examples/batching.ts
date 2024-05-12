/**
 * Example of pino-loki configured to send logs in batch mode
 */

import 'dotenv/config'

import { pino } from 'pino'

import type { LokiOptions } from '../src/types'

const transport = pino.transport<LokiOptions>({
  // 👇 Replace this with "pino-loki"
  target: '../dist/index.mjs',

  options: {
    batching: true,
    interval: 2,

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

async function main() {
  // These logs will be batched and sent to loki after 2 seconds
  logger.info('Hello 1!')
  logger.info('Hello 2!')
  logger.info('Hello 3!')

  await new Promise((resolve) => setTimeout(resolve, 3000))

  // These logs will also be batched but sent immediately since
  // our main process is about to exit
  logger.info('Hello 4!')
  logger.info('Hello 5!')
  logger.info('Hello 6!')
}

main()
