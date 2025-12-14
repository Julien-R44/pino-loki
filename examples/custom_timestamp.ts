/**
 * This example shows how to use a custom timestamp function
 *
 * Can be useful to use nanoseconds instead of milliseconds
 * if you need more precision
 *
 * But note that Pino will be slower, see
 * https://github.com/pinojs/pino/blob/master/docs/api.md#timestamp-boolean--function
 */

import 'dotenv/config'

import pino from 'pino'

import type { LokiOptions } from '../src/index.ts'

const loadNs = process.hrtime()
const loadMs = new Date().getTime()

function nanoseconds() {
  const diffNs = process.hrtime(loadNs)
  return BigInt(loadMs) * BigInt(1e6) + BigInt(diffNs[0] * 1e9 + diffNs[1])
}

const transport = pino.transport<LokiOptions>({
  // 👇 Replace this with "pino-loki"
  target: '../dist/index.js',

  options: {
    // These labels will be added to every log
    labels: { application: 'MY-APP' },
    batching: false,

    // Credentials for our Loki instance
    host: process.env.LOKI_HOST!,
    basicAuth: {
      username: process.env.LOKI_USERNAME!,
      password: process.env.LOKI_PASSWORD!,
    },
  },
})

const logger = pino(
  {
    // 👇 Will replace default pino timestamp with our custom one
    timestamp: () => `,"time":${nanoseconds()}`,
  },
  transport,
)

logger.info('custom timestamp 1!')
logger.info('custom timestamp 2!')
logger.info('custom timestamp 3!')
