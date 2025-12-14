import pino from 'pino'
import { test } from '@japa/runner'
import { setupServer } from 'msw/node'
import { http } from 'msw'
import { setTimeout } from 'node:timers/promises'

import { pinoLoki } from '../../src/index.ts'

test.group('Transport - Buffer', (group) => {
  const receivedLogs: any[] = []

  const server = setupServer(
    http.post('http://localhost:3100/loki/api/v1/push', async ({ request }) => {
      const body = (await request.json()) as { streams: any[] }
      receivedLogs.push(...body.streams)
      return new Response(null, { status: 204 })
    }),
  )

  group.setup(() => server.listen())
  group.teardown(() => server.close())

  group.each.setup(() => {
    receivedLogs.length = 0
  })

  group.each.teardown(() => {
    server.resetHandlers()
  })

  test('should drop oldest logs when buffer is full', async ({ assert }) => {
    const transport = pinoLoki({
      host: 'http://localhost:3100',
      batching: { interval: 10, maxBufferSize: 3 },
    })

    const logger = pino({ level: 'info' }, transport)

    logger.info({ msg: 'log-1' })
    logger.info({ msg: 'log-2' })
    logger.info({ msg: 'log-3' })
    logger.info({ msg: 'log-4' })
    logger.info({ msg: 'log-5' })

    await setTimeout(50)
    transport.end()
    await setTimeout(100)

    assert.equal(receivedLogs.length, 3)

    const messages = receivedLogs.map((log) => JSON.parse(log.values[0][1]).msg)
    assert.deepEqual(messages, ['log-3', 'log-4', 'log-5'])
  })

  test('should not drop logs when buffer is not full', async ({ assert }) => {
    const transport = pinoLoki({
      host: 'http://localhost:3100',
      batching: { interval: 10, maxBufferSize: 10 },
    })

    const logger = pino({ level: 'info' }, transport)

    logger.info({ msg: 'log-1' })
    logger.info({ msg: 'log-2' })
    logger.info({ msg: 'log-3' })

    await setTimeout(50)
    transport.end()
    await setTimeout(100)

    assert.equal(receivedLogs.length, 3)
  })

  test('should allow unlimited buffer when maxBufferSize is 0', async ({ assert }) => {
    const transport = pinoLoki({
      host: 'http://localhost:3100',
      batching: { interval: 10, maxBufferSize: 0 },
    })

    const logger = pino({ level: 'info' }, transport)

    for (let i = 0; i < 50; i++) logger.info({ msg: `log-${i}` })

    await setTimeout(50)
    transport.end()
    await setTimeout(100)

    assert.equal(receivedLogs.length, 50)
  })

  test('should use default maxBufferSize of 10000', async ({ assert }) => {
    const transport = pinoLoki({
      host: 'http://localhost:3100',
      batching: { interval: 10 },
    })

    const logger = pino({ level: 'info' }, transport)

    for (let i = 0; i < 50; i++) logger.info({ msg: `log-${i}` })

    await setTimeout(50)
    transport.end()
    await setTimeout(100)

    assert.equal(receivedLogs.length, 50)
  })
})
