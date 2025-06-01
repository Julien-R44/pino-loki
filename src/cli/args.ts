import type { ParseArgsOptionDescriptor, ParseArgsOptionsConfig } from 'node:util'

interface CustomParseArgsOptionDescriptor extends ParseArgsOptionDescriptor {
  help?: string
}

export interface CustomParseArgsOptionsConfig extends ParseArgsOptionsConfig {
  [longOption: string]: CustomParseArgsOptionDescriptor
}

export const options = {
  'version': {
    type: 'boolean',
    short: 'v',
    help: `Print version number and exit`,
  },
  'user': {
    type: 'string',
    short: 'u',
    help: 'Loki username',
  },
  'password': {
    type: 'string',
    short: 'p',
    help: 'Loki password',
  },
  'hostname': {
    type: 'string',
    default: 'http://localhost:3100',
    help: 'URL for Loki',
  },
  'endpoint': {
    type: 'string',
    default: '/loki/api/v1/push',
    help: 'Path to the Loki push API',
  },
  'batch': {
    type: 'boolean',
    default: true,
    short: 'b',
    help: 'Should logs be sent in batch mode',
  },
  'interval': {
    type: 'string',
    default: '5',
    short: 'i',
    help: 'The interval at which batched logs are sent in seconds',
  },
  'timeout': { type: 'string', default: '2000', short: 't', help: 'Timeout for request to Loki' },
  'silenceErrors': {
    type: 'boolean',
    default: false,
    short: 's',
    help: 'If false, errors will be displayed in the console',
  },
  'replaceTimestamp': {
    type: 'boolean',
    default: false,
    short: 'r',
    help: 'Replace pino logs timestamps with Date.now()',
  },
  'labels': { type: 'string', short: 'l', help: 'Additional labels to be added to all Loki logs' },
  'convertArrays': {
    type: 'boolean',
    default: false,
    help: 'If true, arrays will be converted to objects',
  },
  'structuredMetaKey': {
    type: 'string',
    default: '',
    help: 'Key to use for structured metadata',
  },
  'propsLabels': {
    type: 'string',
    help: 'Fields in log line to convert to Loki labels (comma separated values)',
  },
  /**
   * Kept for backwards compatibility. node:util.parseArgs does not support short options
   * with multiple characters, and `-pl` was used with commander before
   */
  'pl': {
    type: 'string',
    help: 'Deprecated: Use --propsLabels instead. Fields in log line to convert to Loki labels (comma separated values)',
  },
  'no-stdout': {
    type: 'boolean',
    default: false,
    help: 'Disable output to stdout',
  },
  'headers': {
    type: 'string',
    help: 'Custom headers to be sent with the request to Loki (comma separated key=value pairs)',
  },
  'help': {
    type: 'boolean',
    short: 'h',
    default: false,
    help: 'Print this help message and exit',
  },
} as const
