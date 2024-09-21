import { pino } from 'pino'
import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'

import pinoLoki from '../../src/index'
import { sleep } from '../../src/utils'
import { LokiClient } from '../helpers'
import type { LokiOptions } from '../../src/types'

const credentials = {
  host: process.env.LOKI_HOST!,
  basicAuth: { username: process.env.LOKI_USERNAME!, password: process.env.LOKI_PASSWORD! },
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

    await sleep(300)

    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 1)

    const log = result.data.result[0]
    assert.equal(log.stream.application, application)
    assert.deepInclude(JSON.parse(log.values[0][1]), { test: application })
  })

  test('send a log with message field', async ({ assert }) => {
    const application = randomUUID()

    const logger = pino(
      { level: 'info' },
      pinoLoki({
        ...credentials,
        batching: false,
        messageField: 'msg',
        propsToLabels: ['test'],
        labels: { application },
      }),
    )

    const logItem = { msg: 'Text message', test: application }
    logger.info(logItem)

    await sleep(300)

    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 1)

    const log = result.data.result[0]
    assert.equal(log.stream.application, application)
    assert.equal(log.stream.test, logItem.test)
    assert.deepInclude(log.values[0][1], logItem.msg)
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

    await sleep(600)
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

    await sleep(1200)
    const result = await LokiClient.getLogs(`{application="${application}"}`)

    assert.equal(result.status, 'success')
    assert.equal(result.data.result.length, 3)

    const logs = result.data.result.map((log) => JSON.parse(log.values[0][1]).test)
    assert.sameMembers(logs, [1, 2, 3])
  })

  test('batching mode should not drop logs when main process exits', async ({ assert }) => {
    const application = randomUUID()

    const logger = pino.transport<LokiOptions>({
      target: '../../dist/index.cjs',

      options: {
        ...credentials,
        batching: true,
        interval: 10,
        labels: { application },
      },
    })

    const pinoLogger = pino({}, logger)

    pinoLogger.info({ test: 1 })
    pinoLogger.info({ test: 2 })
    pinoLogger.info({ test: 3 })

    // Manually end the logger. This will be executed automatically
    // when the main process exits
    logger.end()

    await sleep(1000)

    const result = await LokiClient.getLogs(`{application="${application}"}`)
    assert.equal(result.status, 'success')

    const firstStream = result.data.result[0]

    assert.equal(firstStream.stream.application, application)
    assert.equal(firstStream.values.length, 3)
  })
})
