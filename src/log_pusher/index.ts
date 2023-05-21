import axios, { AxiosInstance } from 'axios'
import { PinoLog, LokiOptions } from '../types/index.js'
import { LogBuilder } from '../log_builder/index.js'
import debug from '../debug.js'

/**
 * Responsible for pushing logs to Loki
 */
export class LogPusher {
  #options: LokiOptions
  #logBuilder: LogBuilder
  #client: AxiosInstance

  constructor(options: LokiOptions) {
    this.#options = options
    this.#client = axios.create({
      baseURL: this.#options.host,
      timeout: this.#options.timeout,
    })

    if (this.#options.basicAuth) {
      this.#client.defaults.auth = this.#options.basicAuth
    }

    const propsToLabels = options.propsToLabels || []
    this.#logBuilder = new LogBuilder(propsToLabels)
  }

  /**
   * Handle push failures
   */
  #handleFailure(err: any) {
    console.error('Got error when trying to send log to Loki, error output:', err)
    if (this.#options.silenceErrors === true) {
      return
    }

    if (err.response) {
      return console.error(
        `Attempting to send log to Loki failed with status '${err.response.status}: ${
          err.response.statusText
        }' returned reason: ${JSON.stringify(err.response.data)}`,
      )
    }

    if (err.isAxiosError === true) {
      return console.error(
        `Attempting to send log to Loki failed. Got an axios error, error code: '${err.code}' message: ${err.message}`,
      )
    }

    console.error('Got unknown error when trying to send log to Loki, error output:', err)
  }

  /**
   * Push one or multiples logs entries to Loki
   */
  public async push(logs: PinoLog[] | PinoLog) {
    if (!Array.isArray(logs)) {
      logs = [logs]
    }

    const lokiLogs = logs.map((log) =>
      this.#logBuilder.build(log, this.#options.replaceTimestamp, this.#options.labels),
    )

    debug(`[LogPusher] pushing ${lokiLogs.length} logs to Loki`)

    await this.#client
      .post(`/loki/api/v1/push`, { streams: lokiLogs })
      .catch(this.#handleFailure.bind(this))

    debug(`[LogPusher] pushed ${lokiLogs.length} logs to Loki`, { logs: lokiLogs })
  }
}
