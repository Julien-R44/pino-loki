import type { LogDescriptor } from 'pino'

import type { LokiLogLevel } from './constants.ts'

type Timestamp = string

type LogLine = string

type StructuredMetadata = Record<string, any>

/**
 * Shape for a Loki log entry
 */
export interface LokiLog {
  stream: {
    level: LokiLogLevel
    [key: string]: string
  }
  values: ([Timestamp, LogLine] | [Timestamp, LogLine, StructuredMetadata])[]
}

/**
 * Shape for a Pino log entry
 */
export interface PinoLog {
  level: number
  msg?: string
  [key: string]: any
}

/**
 * Batching configuration options
 */
export interface BatchingOptions {
  /**
   * The interval at which batched logs are sent in seconds
   *
   * @default 5
   */
  interval?: number

  /**
   * Maximum number of logs to buffer before dropping the oldest ones.
   * Set to 0 for unlimited buffer (not recommended).
   *
   * @default 10_000
   */
  maxBufferSize?: number
}

/**
 * Options for the Pino-Loki transport
 */
export interface LokiOptions {
  /**
   * URL for Loki
   */
  host: string

  /**
   * Url for Loki push API
   *
   * @default loki/api/v1/push
   */
  endpoint?: string

  /**
   * Timeout for request to Loki
   *
   * @default 30_000
   */
  timeout?: number

  /**
   * If false, errors will be displayed in the console
   *
   * @default false
   */
  silenceErrors?: boolean

  /**
   * Batching configuration. Set to `false` to disable batching entirely.
   *
   * @default { enabled: true, interval: 5, maxBufferSize: 10_000 }
   */
  batching?: false | BatchingOptions

  /**
   * Replace pino logs timestamps with Date.now()
   *
   * Be careful when using batch mode, that will cause all logs
   * to have the same timestamp
   *
   * @default false
   */
  replaceTimestamp?: boolean

  /**
   * Additional labels to be added to all Loki logs
   */
  labels?: {
    [key: string]: string
  }

  /**
   * Custom pino to loki log level mapping, merged with the default one.
   * @default
   *    10: LokiLogLevel.Trace,
        20: LokiLogLevel.Debug,
        30: LokiLogLevel.Info,
        40: LokiLogLevel.Warning,
        50: LokiLogLevel.Error,
        60: LokiLogLevel.Critical
   */

  levelMap?: {
    [key: number]: LokiLogLevel
  }

  /**
   * Basic auth credentials to be used when sending logs to Loki
   */
  basicAuth?: {
    username: string
    password: string
  }

  /**
   * Headers to be sent when pushing logs to Loki API
   */
  headers?: Record<string, string>

  /**
   * Select log message's props to set as Loki labels
   */
  propsToLabels?: string[]

  /**
   * Convert arrays in log messages to objects with index as key
   *
   * @default false
   */
  convertArrays?: boolean

  /**
   * Key to be used for the structured metadata.
   * Set to `false` to disable structured metadata.
   *
   * See https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/
   *
   * @default 'meta'
   */
  structuredMetaKey?: string | false

  /**
   * Format output of log that will be sent to Loki.
   * @default false
   */
  logFormat?: LogFormat
}

export type LogFormatExpectedObject = LogDescriptor & {
  lokilevel: LokiLogLevel
  time: number
  level: number
  msg?: string
  [key: string]: any
}

export type LogFormat = false | string | ((log: LogFormatExpectedObject) => string)
