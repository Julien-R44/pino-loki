import { LokiLog, LokiLogLevel, PinoLog } from '../Contracts'

/**
 * Converts a Pino log to a Loki log
 */
export class LogBuilder {
  private propsToLabel: string[]

  constructor(propsToLabel: string[] = []) {
    this.propsToLabel = propsToLabel
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
   * Build a loki log entry from a pino log
   */
  public build(
    log: PinoLog,
    replaceTimestamp?: boolean,
    additionalLabels?: Record<string, string>
  ): LokiLog {
    const hostname = log.hostname
    const status = this.statusFromLevel(log.level)

    delete log.hostname

    let time = (log.time * 1000000).toString()
    if (replaceTimestamp) {
      time = (new Date().getTime() * 1000000).toString()
    }

    const propsLabels = this.propsToLabel.reduce<{ [key: string]: any }>((acc, current) => {
      if (log[current]) {
        acc[current] = log[current]
      }
      return acc
    }, {})

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
