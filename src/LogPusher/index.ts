import axios, { AxiosInstance } from 'axios'
import { PinoLog, PinoLokiOptionsContract } from '../Contracts'
import { LogBuilder } from '../LogBuilder'

/**
 * Responsible for pushing logs to Loki
 */
export class LogPusher {
  private options: PinoLokiOptionsContract
  private logBuilder: LogBuilder
  private client: AxiosInstance

  constructor(options: PinoLokiOptionsContract) {
    this.options = options
    this.client = axios.create({
      baseURL: this.options.host,
      timeout: this.options.timeout,
    })

    if (this.options.basicAuth) {
      this.client.defaults.auth = this.options.basicAuth
    }

    this.logBuilder = new LogBuilder()
  }

  /**
   * Handle push failures
   */
  private handleFailure(err: any) {
    if (this.options.silenceErrors === true) {
      return
    }

    if (err.response) {
      return console.error(
        `Attempting to send log to Loki failed with status '${err.response.status}: ${
          err.response.statusText
        }' returned reason: ${JSON.stringify(err.response.data)}`
      )
    }

    if (err.isAxiosError === true) {
      return console.error(
        `Attempting to send log to Loki failed. Got an axios error, error code: '${err.code}' message: ${err.message}`
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
      this.logBuilder.build(log, this.options.replaceTimestamp, this.options.labels)
    )

    await this.client
      .post(`/loki/api/v1/push`, { streams: lokiLogs })
      .catch(this.handleFailure.bind(this))
  }
}
