import { test } from '@japa/runner'

import { LokiLogLevel } from '../../src/constants.ts'
import { formatLog } from '../../src/format_mesage.ts'

test.group('Format Message', (group) => {
  test('basic template string', ({ assert }) => {
    const result = formatLog({
      log: {
        level: 30,
        msg: 'Hello world',
        time: 1212,
        lokilevel: LokiLogLevel.Info,
        pinoLevel: 100,
        pid: 1234,
      },
      logFormat: '[log] - {msg}',
    })

    assert.equal(result, '[log] - Hello world')
  })

  test('dot notation', ({ assert }) => {
    const result = formatLog({
      log: {
        level: 30,
        msg: 'Hello world',
        time: 1212,
        lokilevel: LokiLogLevel.Info,
        pinoLevel: 100,
        pid: 1234,
        req: { id: 432, method: 'GET' },
      },
      logFormat: '{msg} {req.id} {req.method}',
    })

    assert.equal(result, 'Hello world 432 GET')
  })

  test('function logFormat', ({ assert }) => {
    const result = formatLog({
      log: {
        level: 30,
        msg: 'Hello world',
        time: 1212,
        lokilevel: LokiLogLevel.Info,
        pinoLevel: 100,
        pid: 1234,
      },
      logFormat: (log) => `Custom format: ${log.msg} at ${log.time}`,
    })

    assert.equal(result, 'Custom format: Hello world at 1212')
  })
})
