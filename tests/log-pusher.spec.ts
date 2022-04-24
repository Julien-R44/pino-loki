import { test } from '@japa/runner'
import { LogPusher } from '../src/LogPusher'
import nock from 'nock'

// TODO: add some log pusher tests
test.group('Log Pusher', () => {
  test('Push should call loki endpoint with correct payload', async () => {
    const logPusher = new LogPusher({
      host: 'localhost',
    })

    let sentBody = null
    nock('localhost').post(/.*/, (body) => {
      sentBody = body
      return sentBody
    })

    await logPusher.push({
      level: 30,
      msg: 'helldddo world',
      time: '2022-04-23T19:55:09.877Z',
      v: 1,
    })
  }).skip()
})
