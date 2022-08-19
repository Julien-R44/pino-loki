import 'dotenv/config'
import pino from 'pino'
import { PinoLokiOptionsContract } from '../src/Contracts'
import { sleep } from '../src/Utils'

const transport = pino.transport<PinoLokiOptionsContract>({
  target: '../dist/index.mjs', // 👈 Replace this with "pino-loki"
  options: {
    batching: true,
    interval: 4,
    labels: { application: 'MY-APP' },

    host: process.env.LOKI_HOST!,
    basicAuth: {
      username: process.env.LOKI_USERNAME!,
      password: process.env.LOKI_PASSWORD!,
    },
  },
})

const logger = pino(transport)

async function main() {
  logger.warn({ warning: '1' })
  await sleep(1000)
  logger.error({ hey: '2' })
  await sleep(1000)
  logger.info({ test: '3' })
  await sleep(5000)
}

main()
