import 'dotenv/config'
import { pino } from 'pino'

const transport = pino.transport({
  targets: [
    {
      // 👇 Replace this with "pino-loki"
      target: '../dist/index.mjs',

      level: 'info',
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
    },
    {
      target: 'pino-pretty',
      level: 'info',
      options: {},
    },
  ],
})

const logger = pino(transport)

logger.info('multiple transport 1!')
logger.info('multiple transport 2!')
logger.info('multiple transport 3!')
