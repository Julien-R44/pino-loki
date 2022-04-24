import type { PinoLokiOptionsContract } from './Contracts'
import { program } from 'commander'
import pkg from '../package.json'
import build from './index'
import pump from 'pump'

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
    .option('--no-stdout', 'Disable output to stdout')

  program.parse(process.argv)

  return program.opts()
}

/**
 * Create a PinoLokiOptionsContract from cli arguments
 */
export const createPinoLokiConfigFromArgs = () => {
  const opts = parseArgs()

  const config: PinoLokiOptionsContract = {
    host: opts.hostname,
    timeout: opts.timeout,
    silenceErrors: opts.silenceErrors,
    batching: opts.batch,
    interval: opts.interval,
    replaceTimestamp: opts.replaceTimestamp,
    labels: opts.labels ? JSON.parse(opts.labels) : undefined,
    basicAuth: {
      username: opts.user,
      password: opts.password,
    },
  }

  return config
}

export async function main() {
  const config = createPinoLokiConfigFromArgs()
  const res = await build(config)

  pump(process.stdin, res)
}

main()
