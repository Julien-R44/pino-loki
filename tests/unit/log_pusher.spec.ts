import { test } from '@japa/runner'
import { LogPusher } from '../../src/log_pusher/index.js'
import nock from 'nock'

test.group('LogPusher', () => {
  test('should send custom headers', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      headers: {
        'X-Custom-Header': 'custom-header-value',
        'X-Scope-OrgID': 'org-id',
      },
    })

    const scope = nock('http://localhost:3100', {
      reqheaders: {
        'X-Custom-Header': 'custom-header-value',
        'X-Scope-OrgID': 'org-id',
      },
    })
      .post('/loki/api/v1/push')
      .reply(204)

    await pusher.push({ level: 30 })

    assert.isTrue(scope.isDone())
  })

  test('should send basic auth', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      basicAuth: { username: 'user', password: 'pass' },
    })

    const scope = nock('http://localhost:3100')
      .post('/loki/api/v1/push')
      .basicAuth({ user: 'user', pass: 'pass' })
      .reply(204)

    await pusher.push({ level: 30 })

    assert.isTrue(scope.isDone())
  })

  test('should not output error when silenceErrors is true', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      silenceErrors: true,
    })

    const consoleError = console.error

    console.error = (...args: any) => {
      console.log(...args)
      assert.fail('Should not be called')
    }

    await pusher.push({ level: 30 })

    assert.isTrue(true)

    console.error = consoleError
  })

  test('clean error message when error is a RequestError', async ({ assert }) => {
    const pusher = new LogPusher({ host: 'http://localhost:3100' })
    const consoleError = console.error

    console.error = (...args: any) => {
      const fullLog = args.join(' ')

      assert.equal(
        fullLog,
        'Got error when trying to send log to Loki: connect ECONNREFUSED ::1:3100',
      )
    }

    await pusher.push({ level: 30 })

    console.error = consoleError
  })
})
