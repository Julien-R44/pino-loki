#!/usr/bin/env node

import pump from 'pump'
import { parseArgs } from 'node:util'

import { options } from './args.ts'
import { pinoLoki } from '../index.ts'
import { printHelp } from './print_help.ts'
import type { LokiOptions } from '../types.ts'
import pkg from '../../package.json' with { type: 'json' }

export function validateHeaders(headers: string): Record<string, string> {
  const headerPairs = headers.split(',').map((pair) => pair.trim())
  const headerObject: Record<string, string> = {}

  for (const pair of headerPairs) {
    const [key, value] = pair.split('=').map((part) => part.trim())
    if (!key || !value)
      throw new Error(`Invalid header format: "${pair}". Expected format is "key=value".`)

    headerObject[key] = value
  }

  return headerObject
}

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
    batching: values.batching === false
      ? false
      : {
          interval: values['batching-interval'] ? Number(values['batching-interval']) : undefined,
          maxBufferSize: values['batching-max-buffer-size']
            ? Number(values['batching-max-buffer-size'])
            : undefined,
        },
    replaceTimestamp: values.replaceTimestamp,
    labels: values.labels ? JSON.parse(values.labels) : undefined,
    propsToLabels: propsLabels,
    structuredMetaKey: values.structuredMetaKey,
    convertArrays: values.convertArrays,
    headers: values.headers ? validateHeaders(values.headers) : undefined,
  }

  if (values.user && values.password) {
    config.basicAuth = { username: values.user, password: values.password }
  }

  return config
}

function main() {
  pump(process.stdin, pinoLoki(createPinoLokiConfigFromArgs()))
}

main()
