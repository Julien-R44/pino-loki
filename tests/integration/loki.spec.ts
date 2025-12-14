import pino from 'pino'
import { join } from 'node:path'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'

import { LokiClient } from '../helpers.ts'
import { pinoLoki } from '../../src/index.ts'
import type { LokiOptions } from '../../src/types.ts'

const credentials: { host: string; basicAuth?: { username: string; password: string } } = {
  host: process.env.LOKI_HOST!,
  ...(process.env.LOKI_USERNAME &&
    process.env.LOKI_PASSWORD && {
      basicAuth: { username: process.env.LOKI_USERNAME, password: process.env.LOKI_PASSWORD },
    }),
}

test.group('Loki integration', () => {
  test('send a log', async ({ assert }) => {
    const application = randomUUID()

    const logger = pino(
      { level: 'info' },
      pinoLoki({
        ...credentials,
        batching: false,
        labels: { application },
      }),
    )

    logger.info({ test: application })

    await setTimeout(300)

    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 1)

    const log = result.data.result[0]
    assert.equal(log.stream.application, application)
    assert.deepInclude(JSON.parse(log.values[0][1]), { test: application })
  })

  test('levels are mapped correctly', async ({ assert }) => {
    const application = randomUUID()

    const logger = pino(
      { level: 'info' },
      pinoLoki({
        ...credentials,
        batching: false,
        labels: { application },
      }),
    )

    logger.trace({ type: 'trace' })
    logger.debug({ type: 'debug' })

    logger.info({ type: 'info' })
    logger.warn({ type: 'warn' })
    logger.error({ type: 'error' })
    logger.fatal({ type: 'fatal' })

    await setTimeout(600)
    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 4)

    const levels = result.data.result.map((log) => log.stream.level)
    assert.sameDeepMembers(levels, ['critical', 'error', 'warning', 'info'])
  })

  test('send logs in batches', async ({ assert }) => {
    const application = randomUUID()

    const logger = pino(
      { level: 'info' },
      pinoLoki({
        ...credentials,
        batching: true,
        interval: 1,
        labels: { application },
      }),
    )

    logger.info({ test: 1 })
    logger.warn({ test: 2 })
    logger.fatal({ test: 3 })

    await setTimeout(1200)
    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 3)

    const logs = result.data.result.map((log) => JSON.parse(log.values[0][1]).test)
    assert.sameMembers(logs, [1, 2, 3])
  })

  test('batching mode should not drop logs when main process exits', async ({ assert }) => {
    const application = randomUUID()

    const transport = pino.transport<LokiOptions>({
      target: '../../dist/index.mjs',
      options: {
        ...credentials,
        batching: true,
        interval: 10,
        labels: { application },
      },
    })

    const logger = pino({}, transport)

    logger.info({ test: 1 })
    logger.info({ test: 2 })
    logger.info({ test: 3 })

    // Manually end the transport. This will be executed automatically
    // when the main process exits
    transport.end()

    await setTimeout(1000)

    const result = await LokiClient.getLogs(`{application="${application}"}`)
    assert.equal(result.status, 'success')

    const firstStream = result.data.result[0]

    assert.equal(firstStream.stream.application, application)
    assert.equal(firstStream.values.length, 3)
  })

  test('use custom transport worker with custom message format function', async ({ assert }) => {
    const application = randomUUID()

    const transport = pino.transport<LokiOptions>({
      target: join(import.meta.dirname, '../fixtures/custom_pino_loki.js'),
      options: { batching: false, ...credentials, labels: { application } },
    })

    const logger = pino(transport)
    // See tests/fixtures/custom_pino_loki.ts for the custom message format function
    const logMessage = `hello yup! info 432 30`

    logger.info({ req: { id: 432 } }, 'yup!')

    await setTimeout(300)

    const result = await LokiClient.getLogs(`{application="${application}"}`)
    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 1)

    const log = result.data.result[0]
    assert.equal(log.stream.application, application)
    assert.deepInclude(log.values[0][1], logMessage)
  })

  test('use logFormat template to format log messages', async ({ assert }) => {
    const application = randomUUID()

    const transport = pino.transport<LokiOptions>({
      target: '../../dist/index.mjs',
      options: {
        ...credentials,
        batching: false,
        labels: { application },
        logFormat: '{msg} {req.id} {level}',
      },
    })

    const logger = pino(transport)

    logger.info({ req: { id: 432 } }, 'yup!')

    await setTimeout(300)

    const result = await LokiClient.getLogs(`{application="${application}"}`)
    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 1)

    const log = result.data.result[0]
    assert.equal(log.stream.application, application)
    assert.deepInclude(log.values[0][1], 'yup! 432 30')
  })
})
