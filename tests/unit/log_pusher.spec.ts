import { test } from '@japa/runner'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

import { LogPusher } from '../../src/log_pusher'

test.group('LogPusher', (group) => {
  const server = setupServer(
    http.post('http://localhost:3100/loki/api/v1/push', () => {
      return new Response(null, { status: 204 })
    }),
  )

  group.setup(() => {
    server.listen()
  })

  group.each.teardown(() => {
    server.resetHandlers()
    server.events.removeAllListeners()
  })

  group.teardown(() => {
    server.close()
  })

  test('should send custom headers', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      headers: {
        'X-Custom-Header': 'custom-header-value',
        'X-Scope-OrgID': 'org-id',
      },
    })

    let requestHeaders: unknown[] = []
    server.events.on('request:start', ({ request }) => {
      requestHeaders = Array.from(request.headers.entries())
    })

    await pusher.push({ level: 30 })

    assert.includeDeepMembers(requestHeaders, [
      ['x-custom-header', 'custom-header-value'],
      ['x-scope-orgid', 'org-id'],
    ])
  })

  test('should send basic auth', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      basicAuth: { username: 'user', password: 'pass' },
    })

    let basicAuthHeader: string | null = ''
    server.events.on('request:start', ({ request }) => {
      basicAuthHeader = request.headers.get('authorization')
    })

    await pusher.push({ level: 30 })

    assert.equal(basicAuthHeader, 'Basic ' + Buffer.from('user:pass').toString('base64'))
  })

  test('should not output error when silenceErrors is true', async ({ assert }) => {
    const pusher = new LogPusher({
      host: 'http://localhost:3100',
      silenceErrors: true,
    })

    server.use(
      http.post('http://localhost:3100/loki/api/v1/push', () => {
        return HttpResponse.text('error', { status: 500 })
      }),
    )

    const consoleError = console.error

    console.error = (...args: any) => {
      console.log(...args)
      assert.fail('Should not be called')
    }

    await pusher.push({ level: 30 })

    assert.isTrue(true)

    console.error = consoleError
  })
})
