import { test } from '@japa/runner'

import { createPinoLokiConfigFromArgs } from '../../src/cli/index.ts'

test.group('Cli', () => {
  test('Should parse custom labels', ({ assert }) => {
    process.argv = ['node', 'src/cli.ts', '--labels', `{"test": "42", "hello": {"world": "42"}}`]
    const ret = createPinoLokiConfigFromArgs()

    assert.deepEqual(ret.labels, { test: '42', hello: { world: '42' } })
  })

  test('Should set props to labels', ({ assert }) => {
    process.argv = ['node', 'src/cli.ts', '--propsLabels', `foo,bar`]
    const ret = createPinoLokiConfigFromArgs()

    assert.deepEqual(ret.propsToLabels, ['foo', 'bar'])
  })

  test('structured metadata key', ({ assert }) => {
    process.argv = ['node', 'src/cli.ts', '--structuredMetaKey', `foo`]
    const ret = createPinoLokiConfigFromArgs()

    assert.equal(ret.structuredMetaKey, 'foo')
  })

  test('pass headers', ({ assert }) => {
    process.argv = [
      'node',
      'src/cli.ts',
      '--headers',
      'x-custom-header=value,x-another-header=another-value',
    ]
    const ret = createPinoLokiConfigFromArgs()

    assert.deepEqual(ret.headers, {
      'x-custom-header': 'value',
      'x-another-header': 'another-value',
    })
  })
})
