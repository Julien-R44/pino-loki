import debug from './debug'
import { LogBuilder } from './log_builder'
import type { PinoLog, LokiOptions } from './types'

class RequestError extends Error {
  responseBody: string

  constructor(message: string, responseBody: string) {
    super(message)
    this.name = 'RequestError'
    this.responseBody = responseBody
  }
}

/**
 * Responsible for pushing logs to Loki
 */
export class LogPusher {
  #options: LokiOptions
  #logBuilder: LogBuilder

  constructor(options: LokiOptions) {
    this.#options = options

    this.#logBuilder = new LogBuilder({
      levelMap: options.levelMap,
      propsToLabels: options.propsToLabels,
    })
  }

  /**
   * Handle push failures
   */
  #handleFailure(err: any) {
    if (this.#options.silenceErrors === true) {
      return
    }

    if (err instanceof RequestError) {
      console.error(err.message + '\n' + err.responseBody)
      return
    }

    console.error('Got unknown error when trying to send log to Loki, error output:', err)
  }

  /**
   * Push one or multiples logs entries to Loki
   */
  async push(logs: PinoLog[] | PinoLog) {
    if (!Array.isArray(logs)) {
      logs = [logs]
    }

    const lokiLogs = logs.map((log) =>
      this.#logBuilder.build({
        log,
        replaceTimestamp: this.#options.replaceTimestamp,
        additionalLabels: this.#options.labels,
        convertArrays: this.#options.convertArrays,
      }),
    )

    debug(`[LogPusher] pushing ${lokiLogs.length} logs to Loki`)

    try {
      const response = await fetch(new URL('loki/api/v1/push', this.#options.host), {
        method: 'POST',
        signal: AbortSignal.timeout(this.#options.timeout ?? 30_000),
        headers: {
          ...this.#options.headers,
          ...(this.#options.basicAuth && {
            Authorization: Buffer.from(
              `${this.#options.basicAuth.username}:${this.#options.basicAuth.password}`,
            ).toString('base64'),
          }),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ streams: lokiLogs }),
      })

      if (!response.ok) {
        throw new RequestError('Got error when trying to send log to loki', await response.text())
      }
    } catch (err) {
      this.#handleFailure(err)
    }

    debug(`[LogPusher] pushed ${lokiLogs.length} logs to Loki`, { logs: lokiLogs })
  }
}
