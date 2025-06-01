// @ts-check
import { pinoLoki } from '../../src/index.ts'

/**
 * @argument {LokiOptions} options - Options for pino-loki
 */
export default function customPinoLoki(options) {
  return pinoLoki({
    ...options,
    logFormat: (log) => {
      return `hello ${log.msg} ${log.lokilevel} ${log.req.id} ${log.level}`
    },
  })
}
