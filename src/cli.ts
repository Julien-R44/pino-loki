import pump from 'pump'
import { program } from 'commander'

import build from './index'
import pkg from '../package.json'
import type { LokiOptions } from './types/index'

/**
 * Parse cli arguments with commander
 */
export const parseArgs = () => {
  program
    .version(pkg.version)
    .option('-u, --user <user>', 'Loki username')
    .option('-p, --password <password>', 'Loki password')
    .option('--hostname <hostname>', 'URL for Loki')
    .option('-b, --batch', 'Should logs be sent in batch mode')
    .option('-i, --interval <interval>', 'The interval at which batched logs are sent in seconds')
    .option('-t, --timeout <timeout>', 'Timeout for request to Loki')
    .option('-s, --silenceErrors', 'If false, errors will be displayed in the console')
    .option('-r, --replaceTimestamp', 'Replace pino logs timestamps with Date.now()')
    .option('-l, --labels <label>', 'Additional labels to be added to all Loki logs')
    .option(
      '-pl, --propsLabels <labels>',
      'Fields in log line to convert to Loki labels (comma separated values)',
    )
    .option('--no-stdout', 'Disable output to stdout')

  program.parse(process.argv)

  return program.opts()
}

/**
 * Create a PinoLokiOptionsContract from cli arguments
 */
export const createPinoLokiConfigFromArgs = () => {
  const opts = parseArgs()

  const config: LokiOptions = {
    host: opts.hostname,
    timeout: opts.timeout,
    silenceErrors: opts.silenceErrors,
    batching: opts.batch,
    interval: opts.interval,
    replaceTimestamp: opts.replaceTimestamp,
    labels: opts.labels ? JSON.parse(opts.labels) : undefined,
    propsToLabels: opts.propsLabels ? opts.propsLabels.split(',') : [],
  }

  if (opts.user && opts.password) {
    config.basicAuth = { username: opts.user, password: opts.password }
  }

  return config
}

function main() {
  const config = createPinoLokiConfigFromArgs()
  const pinoLoki = build(config)
  pump(process.stdin, pinoLoki)
}

main()
