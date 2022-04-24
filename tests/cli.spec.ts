import { test } from '@japa/runner'
import { createPinoLokiConfigFromArgs } from '../src/cli'

test.group('Cli', () => {
  test('Should parse custom labels', ({ assert }) => {
    process.argv = ['node', 'src/cli.ts', '--labels', `{"test": "42", "hello": {"world": "42"}}`]
    const ret = createPinoLokiConfigFromArgs()

    assert.deepEqual(ret.labels, { test: '42', hello: { world: '42' } })
  })
})
