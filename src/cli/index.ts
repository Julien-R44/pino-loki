import pump from 'pump'
import { parseArgs } from 'node:util'

import build from '../index.ts'
import { options } from './args.ts'
import { printHelp } from './print_help.ts'
import type { LokiOptions } from '../types.ts'
import pkg from '../../package.json' with { type: 'json' }

/**
 * Create a PinoLokiOptionsContract from cli arguments
 */
export const createPinoLokiConfigFromArgs = () => {
  const { values } = parseArgs({ options })

  if (values.help) {
    printHelp(options)
    process.exit(0)
  }

  if (values.version) {
    console.log(`v${pkg.version}`)
    process.exit(0)
  }

  const propsLabels = (values.propsLabels ?? values.pl ?? '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)

  const config: LokiOptions = {
    host: values.hostname,
    endpoint: values.endpoint,
    timeout: values.timeout ? Number(values.timeout) : undefined,
    silenceErrors: values.silenceErrors,
    batching: values.batch,
    interval: values.interval ? Number(values.interval) : undefined,
    replaceTimestamp: values.replaceTimestamp,
    labels: values.labels ? JSON.parse(values.labels) : undefined,
    propsToLabels: propsLabels,
    structuredMetaKey: values.structuredMetaKey,
    convertArrays: values.convertArrays,
  }

  if (values.user && values.password) {
    config.basicAuth = { username: values.user, password: values.password }
  }

  return config
}

function main() {
  const config = createPinoLokiConfigFromArgs()
  const pinoLoki = build(config)
  pump(process.stdin, pinoLoki)
}

main()
