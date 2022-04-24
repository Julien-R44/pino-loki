import { test } from '@japa/runner'
import { PinoLog } from '../src/Contracts'
import { LogBuilder } from '../src/LogBuilder'
import { sleep } from '../src/Utils'

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

  test('Build a loki log entry from a pino log', ({ assert }) => {
    const logBuilder = new LogBuilder()

    const currentTime = new Date()
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
    assert.deepEqual(+lokiLog.values[0][0], currentTime.getTime() * 1000000)
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
    const currentTime = new Date().getTime() * 1000000

    assert.closeTo(+lokiLog.values[0][0], +currentTime, 10000000)
  })
})
