/**
 * An example of using pino-loki with the CLI
 *
 * Run this example with:
 * pnpm ts-node-esm examples/cli.ts | pino-loki -h ... -u ... -p ...
 *
 * Or, if you have a compiled version of pino-loki:
 * pnpm ts-node-esm examples/cli.ts | ./dist/cli.mjs -h ... -u ... -p ...
 */

import 'dotenv/config'
import { pino } from 'pino'

const logger = pino({ level: 'info' }).child({ application: 'MY-APP' })

logger.info('CLI 1!')
logger.warn('CLI 2!')
logger.error('CLI 3!')
