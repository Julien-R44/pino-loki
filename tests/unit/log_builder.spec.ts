import { test } from '@japa/runner'

import { sleep } from '../../src/utils/index'
import { LokiLogLevel } from '../../src/types/index'
import type { PinoLog } from '../../src/types/index'
import { LogBuilder, convertArray } from '../../src/log_builder/index'

const loadNs = process.hrtime()
const loadMs = new Date().getTime()

function nanoseconds() {
  const diffNs = process.hrtime(loadNs)
  return BigInt(loadMs) * BigInt(1e6) + BigInt(diffNs[0] * 1e9 + diffNs[1])
}

test.group('Log Builder', () => {
  test('Status mapper', ({ assert }) => {
    const logBuilder = new LogBuilder()

    assert.deepEqual(logBuilder.statusFromLevel(10), 'debug')
    assert.deepEqual(logBuilder.statusFromLevel(20), 'debug')
    assert.deepEqual(logBuilder.statusFromLevel(30), 'info')
    assert.deepEqual(logBuilder.statusFromLevel(40), 'warning')
    assert.deepEqual(logBuilder.statusFromLevel(50), 'error')
    assert.deepEqual(logBuilder.statusFromLevel(60), 'critical')
  })

  test('Custom levels', ({ assert }) => {
    const logBuilder = new LogBuilder({
      levelMap: { '5': LokiLogLevel.Debug, '20': LokiLogLevel.Info },
    })
    assert.deepEqual(logBuilder.statusFromLevel(5), 'debug') // custom
    assert.deepEqual(logBuilder.statusFromLevel(10), 'debug')
    assert.deepEqual(logBuilder.statusFromLevel(20), 'info') // override
    assert.deepEqual(logBuilder.statusFromLevel(30), 'info')
    assert.deepEqual(logBuilder.statusFromLevel(40), 'warning')
    assert.deepEqual(logBuilder.statusFromLevel(50), 'error')
    assert.deepEqual(logBuilder.statusFromLevel(60), 'critical')
  })

  test('Build a loki log entry from a pino log', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const currentTime = new Date().getTime()
    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: currentTime,
      v: 1,
    }

    const lokiLog = logBuilder.build(log, false, {
      application: 'MY-APP',
    })

    assert.deepEqual(lokiLog.stream.level, 'info')
    assert.deepEqual(lokiLog.stream.hostname, 'localhost')
    assert.deepEqual(lokiLog.stream.application, 'MY-APP')
    assert.deepEqual(lokiLog.values[0][1], JSON.stringify(log))
    assert.deepEqual(+lokiLog.values[0][0], currentTime * 1_000_000)
  })

  test('Replace timestamps', async ({ assert }) => {
    const logBuilder = new LogBuilder()

    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: new Date(),
      v: 1,
    }

    await sleep(1000)

    const lokiLog = logBuilder.build(log, true, { application: 'MY-APP' })
    const currentTime = new Date().getTime() * 1_000_000

    assert.closeTo(+lokiLog.values[0][0], +currentTime, 10_000_000)
  })

  test('Props to label', ({ assert }) => {
    const logBuilder = new LogBuilder({ propsToLabels: ['appId', 'buildId'] })

    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: new Date(),
      v: 1,
      appId: 123,
      buildId: 'aaaa',
    }
    const lokiLog = logBuilder.build(log, true, { application: 'MY-APP' })
    assert.equal(lokiLog.stream.appId, 123)
    assert.equal(lokiLog.stream.buildId, 'aaaa')
  })

  test('should not modify nanoseconds timestamps', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const now = nanoseconds().toString()

    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: now,
    }

    const lokiLog = logBuilder.build(log, false, { application: 'MY-APP' })
    assert.deepEqual(lokiLog.values[0][0], now)
  })

  test('should convert timestamps to nanoseconds', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const now = new Date().getTime().toString()

    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: now,
    }

    const lokiLog = logBuilder.build(log, false, { application: 'MY-APP' })

    assert.deepEqual(lokiLog.values[0][0], now + '000000')
  })

  test('test converting arrays to indexed keys', ({ assert }) => {
    assert.equal(convertArray(1), 1)
    assert.equal(convertArray('hello'), 'hello')
    assert.equal(convertArray(true), true)
    assert.equal(convertArray(false), false)
    assert.equal(convertArray(null), null)
    assert.equal(convertArray(undefined), undefined)
    assert.deepEqual(convertArray({}), {})

    assert.deepEqual(convertArray({ a: 1, b: 2, c: { d: 'e' } }), { a: 1, b: 2, c: { d: 'e' } })
    assert.deepEqual(convertArray({ a: ['x', 'y', 'z'], b: 4 }), {
      a: { 0: 'x', 1: 'y', 2: 'z' },
      b: 4,
    })
    assert.deepEqual(convertArray(['a', [{ b: 1, c: 2 }], { d: 'e' }]), {
      0: 'a',
      1: {
        0: {
          b: 1,
          c: 2,
        },
      },
      2: {
        d: 'e',
      },
    })

    const logBuilder = new LogBuilder({})

    const log: PinoLog = {
      level: 30,
      msg: 'hello world',
      additional: [
        ['x', 'y', 'z'],
        {
          a: 1,
          b: 2,
        },
      ],
    }

    const lokiLog = logBuilder.build(log, true, {}, true)
    const parsed = JSON.parse(lokiLog.values[0][1])
    assert.deepEqual(parsed, {
      level: 30,
      msg: 'hello world',
      additional: {
        0: {
          0: 'x',
          1: 'y',
          2: 'z',
        },
        1: {
          a: 1,
          b: 2,
        },
      },
    })
  })
})
