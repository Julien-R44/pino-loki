import { test } from '@japa/runner'

import { sleep } from '../../src/utils'
import { LokiLogLevel } from '../../src/types'
import type { PinoLog } from '../../src/types'
import { LogBuilder } from '../../src/log_builder'

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

    const lokiLog = logBuilder.build({
      log,
      replaceTimestamp: false,
      additionalLabels: {
        application: 'MY-APP',
      },
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

    const lokiLog = logBuilder.build({
      log,
      replaceTimestamp: true,
      additionalLabels: { application: 'MY-APP' },
    })
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
    const lokiLog = logBuilder.build({
      log,
      replaceTimestamp: true,
      additionalLabels: { application: 'MY-APP' },
    })
    assert.equal(lokiLog.stream.appId, 123)
    assert.equal(lokiLog.stream.buildId, 'aaaa')
  })

  test('should not modify nanoseconds timestamps', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const now = nanoseconds().toString()

    const lokiLog = logBuilder.build({
      log: { hostname: 'localhost', level: 30, msg: 'hello world', time: now },
      replaceTimestamp: false,
      additionalLabels: { application: 'MY-APP' },
    })
    assert.deepEqual(lokiLog.values[0][0], now)
  })

  test('should convert timestamps to nanoseconds', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const now = new Date().getTime().toString()

    const lokiLog = logBuilder.build({
      log: { hostname: 'localhost', level: 30, msg: 'hello world', time: now },
      replaceTimestamp: false,
      additionalLabels: { application: 'MY-APP' },
    })

    assert.deepEqual(lokiLog.values[0][0], now + '000000')
  })

  test('convert arrays to indexed keys', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const log1 = logBuilder.build({
      log: { level: 30, msg: 'hello world', additional: [['x', 'y', 'z'], { a: 1, b: 2 }] },
      replaceTimestamp: true,
      convertArrays: true,
    })

    assert.deepEqual(JSON.parse(log1.values[0][1]), {
      level: 30,
      msg: 'hello world',
      additional: { 0: { 0: 'x', 1: 'y', 2: 'z' }, 1: { a: 1, b: 2 } },
    })

    const log2 = logBuilder.build({
      log: { level: 30, msg: 'hello world', additional: { foo: { bar: [{ a: 1, b: 2 }] } } },
      replaceTimestamp: true,
      convertArrays: true,
    })

    assert.deepEqual(JSON.parse(log2.values[0][1]), {
      level: 30,
      msg: 'hello world',
      additional: { foo: { bar: { 0: { a: 1, b: 2 } } } },
    })
  })

  test('messageField works', ({ assert }) => {
    const logBuilder = new LogBuilder({
      messageField: 'msg',
    })

    const log: PinoLog = {
      hostname: 'localhost',
      level: 30,
      msg: 'hello world',
      time: new Date(),
      v: 1,
    }
    const lokiLog = logBuilder.build({
      log,
      replaceTimestamp: true,
      additionalLabels: { application: 'MY-APP' },
    })
    assert.equal(lokiLog.values[0][1], 'hello world')
    assert.equal(lokiLog.stream.level, 'info')
  })
})
