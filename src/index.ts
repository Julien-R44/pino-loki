import abstractTransportBuild from 'pino-abstract-transport'

import debug from './debug.ts'
import { LogPusher } from './log_pusher.ts'
import { LokiLogLevel } from './constants.ts'
import type { PinoLog, LokiOptions, BatchingOptions } from './types.ts'

interface ResolvedBatching {
  enabled: boolean
  interval: number
  maxBufferSize: number
}

function resolveBatching(batching: LokiOptions['batching']): ResolvedBatching {
  if (batching === false) return { enabled: false, interval: 5, maxBufferSize: 10_000 }

  return {
    enabled: true,
    interval: batching?.interval ?? 5,
    maxBufferSize: batching?.maxBufferSize ?? 10_000,
  }
}

/**
 * Resolves the options for the Pino Loki transport
 */
function resolveOptions(options: LokiOptions) {
  return {
    ...options,
    endpoint: options.endpoint ?? 'loki/api/v1/push',
    timeout: options.timeout ?? 30_000,
    silenceErrors: options.silenceErrors ?? false,
    batching: resolveBatching(options.batching),
    replaceTimestamp: options.replaceTimestamp ?? false,
    propsToLabels: options.propsToLabels ?? [],
    convertArrays: options.convertArrays ?? false,
    structuredMetaKey: options.structuredMetaKey === false ? undefined : (options.structuredMetaKey ?? 'meta'),
    logFormat: options.logFormat,
  }
}

function pinoLoki(userOptions: LokiOptions) {
  const options = resolveOptions(userOptions)
  const logPusher = new LogPusher(options)

  const { basicAuth: _, ...safeOptions } = options
  debug(`[PinoLoki] initialized with options: ${JSON.stringify(safeOptions)}`)

  let batchInterval: NodeJS.Timeout | undefined
  let pinoLogBuffer: PinoLog[] = []
  let isClosed = false

  return abstractTransportBuild(
    async (source) => {
      if (options.batching.enabled) {
        batchInterval = setInterval(() => {
          if (isClosed) return

          debug(`Batch interval reached, sending ${pinoLogBuffer.length} logs to Loki`)

          if (pinoLogBuffer.length === 0) return

          const logsToSend = pinoLogBuffer
          pinoLogBuffer = []
          logPusher.push(logsToSend)
        }, options.batching.interval * 1000)
      }

      for await (const obj of source) {
        if (options.batching.enabled) {
          if (
            options.batching.maxBufferSize > 0 &&
            pinoLogBuffer.length >= options.batching.maxBufferSize
          ) {
            const dropped = pinoLogBuffer.shift()
            debug(`[PinoLoki] Buffer full, dropping oldest log: ${JSON.stringify(dropped)}`)
          }
          pinoLogBuffer.push(obj)
          continue
        }

        logPusher.push(obj)
      }
    },
    {
      /**
       * When transport is closed, push remaining logs to Loki
       * and clear the interval
       */
      async close() {
        if (options.batching.enabled) {
          isClosed = true
          clearInterval(batchInterval!)

          if (pinoLogBuffer.length > 0) {
            await logPusher.push(pinoLogBuffer)
          }
        }
      },
    },
  )
}

export default pinoLoki
export { LokiLogLevel, pinoLoki, type LokiOptions, type PinoLog, type BatchingOptions }
