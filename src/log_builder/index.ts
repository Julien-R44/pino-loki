import { LokiLogLevel } from '../types/index'
import type { LokiLog, PinoLog, LokiOptions } from '../types/index'

const NANOSECONDS_LENGTH = 19

type BuilderOptions = Pick<LokiOptions, 'propsToLabels' | 'levelMap'>

/**
 * Recursively converts an array to an object with index position as key
 */
export function convertArray(data: unknown): unknown {
  if (typeof data !== 'object' || !data) {
    return data
  }
  if (Array.isArray(data)) {
    return Object.fromEntries(data.map((value, index) => [index, convertArray(value)]))
  }
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, convertArray(value)]))
}

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
  build(
    log: PinoLog,
    replaceTimestamp?: boolean,
    additionalLabels?: Record<string, string>,
    convertArrays?: boolean,
  ): LokiLog {
    const status = this.statusFromLevel(log.level)
    const time = this.#buildTimestamp(log, replaceTimestamp)
    const propsLabels = this.#buildLabelsFromProps(log)

    const hostname = log.hostname
    log.hostname = undefined

    const converted = convertArrays ? convertArray(log) : log

    return {
      stream: {
        level: status,
        hostname,
        ...additionalLabels,
        ...propsLabels,
      },
      values: [[time, JSON.stringify(converted)]],
    }
  }
}
