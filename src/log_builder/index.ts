import { LokiLog, LokiLogLevel, PinoLog } from '../types/index'

const NANOSECONDS_LENGTH = 19

/**
 * Converts a Pino log to a Loki log
 */
export class LogBuilder {
  #propsToLabel: string[]

  constructor(propsToLabel: string[] = []) {
    this.#propsToLabel = propsToLabel
  }

  /**
   * Convert a level to a human readable status
   */
  public statusFromLevel(level: number) {
    return (
      {
        10: LokiLogLevel.Debug,
        20: LokiLogLevel.Debug,
        30: LokiLogLevel.Info,
        40: LokiLogLevel.Warning,
        50: LokiLogLevel.Error,
        60: LokiLogLevel.Critical,
      }[level] || LokiLogLevel.Info
    )
  }

  /**
   * Builds a timestamp string from a Pino log object.
   * @returns A string representing the timestamp in nanoseconds.
   */
  #buildTimestamp(log: PinoLog, replaceTimestamp?: boolean): string {
    if (replaceTimestamp) {
      return (new Date().getTime() * 1000000).toString()
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

    for (const prop of this.#propsToLabel) {
      if (log[prop]) {
        labels[prop] = log[prop]
      }
    }

    return labels
  }

  /**
   * Build a loki log entry from a pino log
   */
  public build(
    log: PinoLog,
    replaceTimestamp?: boolean,
    additionalLabels?: Record<string, string>,
  ): LokiLog {
    const status = this.statusFromLevel(log.level)
    const time = this.#buildTimestamp(log, replaceTimestamp)
    const propsLabels = this.#buildLabelsFromProps(log)

    const hostname = log.hostname
    log.hostname = undefined

    return {
      stream: {
        level: status,
        hostname,
        ...additionalLabels,
        ...propsLabels,
      },
      values: [[time, JSON.stringify(log)]],
    }
  }
}
