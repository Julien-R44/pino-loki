import { get } from './get.ts'
import type { LogFormat, LogFormatExpectedObject } from './types.ts'

export function formatLog(options: { log: LogFormatExpectedObject; logFormat: LogFormat }): string {
  const { log, logFormat } = options

  if (logFormat && typeof logFormat === 'string') {
    return logFormat.replace(/{([^{}]+)}/g, (_match, p1) => get(log, p1) || '')
  }

  if (logFormat && typeof logFormat === 'function') {
    return logFormat(options.log)
  }

  throw new Error('Message format must be a string or a function. Received: ' + typeof logFormat)
}
