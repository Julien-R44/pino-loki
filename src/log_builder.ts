import { LokiLogLevel } from './constants.ts'
import { formatLog } from './format_mesage.ts'
import type { LokiLog, PinoLog, LokiOptions, LogFormat, LogFormatExpectedObject } from './types.ts'

const NANOSECONDS_LENGTH = 19

type BuilderOptions = Pick<LokiOptions, 'propsToLabels' | 'levelMap'>

/**
 * Converts a Pino log to a Loki log
 */
export class LogBuilder {
  #propsToLabels: string[]
  #levelMap: { [key: number]: LokiLogLevel }

  constructor(options?: BuilderOptions) {
    this.#propsToLabels = options?.propsToLabels || []
    this.#levelMap = Object.assign(
      {
        10: LokiLogLevel.Debug,
        20: LokiLogLevel.Debug,
        30: LokiLogLevel.Info,
        40: LokiLogLevel.Warning,
        50: LokiLogLevel.Error,
        60: LokiLogLevel.Critical,
      },
      options?.levelMap,
    )
  }

  /**
   * Builds a timestamp string from a Pino log object.
   * @returns A string representing the timestamp in nanoseconds.
   */
  #buildTimestamp(log: PinoLog, replaceTimestamp?: boolean): string {
    if (replaceTimestamp) {
      return (new Date().getTime() * 1_000_000).toString()
    }

    const time = log.time || Date.now()
    const strTime = time.toString()

    // Returns the time if it's already in nanoseconds
    if (strTime.length === NANOSECONDS_LENGTH) {
      return strTime
    }

    // Otherwise, find the missing factor to convert it to nanoseconds
    const missingFactor = 10 ** (19 - strTime.length)
    return (time * missingFactor).toString()
  }

  /**
   * Stringify the log object. If convertArrays is true then it will convert
   * arrays to objects with indexes as keys.
   */
  #stringifyLog(log: PinoLog, convertArrays?: boolean): string {
    return JSON.stringify(log, (_, value) => {
      if (!convertArrays) return value

      if (Array.isArray(value)) {
        return Object.fromEntries(value.map((value, index) => [index, value]))
      }

      return value
    })
  }

  #buildLabelsFromProps(log: PinoLog) {
    const labels: Record<string, string> = {}

    for (const prop of this.#propsToLabels) {
      if (log[prop]) {
        labels[prop] = log[prop]
      }
    }

    return labels
  }

  /**
   * Convert a level to a human readable status
   */
  statusFromLevel(level: number) {
    return this.#levelMap[level] || LokiLogLevel.Info
  }

  /**
   * Build a loki log entry from a pino log
   */
  build(options: {
    log: PinoLog
    replaceTimestamp?: boolean
    additionalLabels?: Record<string, string>
    convertArrays?: boolean
    structuredMetaKey?: string
    logFormat?: LogFormat
  }): LokiLog {
    const status = this.statusFromLevel(options.log.level)
    const time = this.#buildTimestamp(options.log, options.replaceTimestamp)
    const propsLabels = this.#buildLabelsFromProps(options.log)

    const hostname = options.log.hostname
    options.log.hostname = undefined

    const structuredMetadata: Record<string, any> = options.structuredMetaKey
      ? options.log[options.structuredMetaKey]
      : undefined

    const formattedMessage = options.logFormat
      ? formatLog({
          logFormat: options.logFormat,
          log: { ...options.log, lokilevel: status } as LogFormatExpectedObject,
        })
      : this.#stringifyLog(options.log, options.convertArrays)

    return {
      stream: {
        level: status,
        hostname,
        ...options.additionalLabels,
        ...propsLabels,
      },
      values: [
        // Make sure to exclude structured metadata from the log object
        // if not present because olders versions of Loki will not accept
        // it and will return an error.
        structuredMetadata
          ? [time, formattedMessage, structuredMetadata]
          : [time, formattedMessage],
      ],
    }
  }
}
