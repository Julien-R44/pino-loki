import build from 'pino-abstract-transport'
import { PinoLog, PinoLokiOptionsContract } from './Contracts'
import { LogPusher } from './LogPusher'

export default async function (options: PinoLokiOptionsContract) {
  options.timeout ??= 30000
  options.silenceErrors ??= false
  options.batching ??= true
  options.interval ??= 5
  options.replaceTimestamp ??= false

  const logPusher = new LogPusher(options)

  return build(async (source: any) => {
    let pinoLogBuffer: PinoLog[] = []

    if (options.batching) {
      setInterval(async () => {
        if (pinoLogBuffer.length === 0) {
          return
        }

        logPusher.push(pinoLogBuffer)
        pinoLogBuffer = []
      }, options.interval! * 1000)
    }

    for await (let obj of source) {
      if (options.batching) {
        pinoLogBuffer.push(obj)
        continue
      }

      logPusher.push(obj)
    }
  })
}
