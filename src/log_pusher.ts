import type { Got } from 'got'
import got, { RequestError } from 'got'

import debug from './debug'
import { LogBuilder } from './log_builder'
import type { PinoLog, LokiOptions } from './types'

/**
 * Responsible for pushing logs to Loki
 */
export class LogPusher {
  #options: LokiOptions
  #logBuilder: LogBuilder
  #client: Got

  constructor(options: LokiOptions) {
    this.#options = options

    this.#client = got.extend({
      ...(this.#options.host && { prefixUrl: this.#options.host }),
      timeout: { request: this.#options.timeout ?? 30_000 },
      headers: options.headers ?? {},
      ...(this.#options.basicAuth && {
        username: this.#options.basicAuth?.username,
        password: this.#options.basicAuth?.password,
      }),
    })

    this.#logBuilder = new LogBuilder({
      levelMap: options.levelMap,
      propsToLabels: options.propsToLabels,
      messageField: options.messageField,
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
      console.error(
        'Got error when trying to send log to Loki:',
        err.message + '\n' + err.response?.body,
      )
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

    await this.#client
      .post(`loki/api/v1/push`, { json: { streams: lokiLogs } })
      .catch(this.#handleFailure.bind(this))

    debug(`[LogPusher] pushed ${lokiLogs.length} logs to Loki`, { logs: lokiLogs })
  }
}
