<p align="center">
  <img src="https://user-images.githubusercontent.com/8337858/188330582-cdbdde50-da1c-47e4-b251-10a32155e6c7.png">
</p>

This module provides a transport for pino that forwards messages to a Loki instance.

## Why pino-loki
Pino-loki is based upon the highly performant logging library pino. Loki usually gets the logs through Grafana Agent which reads system logs from files. This setup may not always be possible or require additional infrastructure, especially in situations where logs are gathered application code deployed as a SaaS in the cloud. Pino-loki sends the pino logs directly to Loki.

Pino-loki is for Pino v7.0.0 and above, so the module can be configured to operate in a worker thread, which is the recommended way to use it.

## Usage

### In a worker thread

```ts
import pino from 'pino'
import type { LokiOptions } from 'pino-loki'

const transport = pino.transport<LokiOptions>({
  target: "pino-loki",
  options: {
    batching: true,
    interval: 5,

    host: 'https://my-loki-instance:3100',
    basicAuth: {
      username: "username",
      password: "password",
    },
  },
});

const logger = pino(transport);
logger.error({ foo: 'bar' })
```

### In main process

See [the example](./examples/module_usage.ts)

### Library options

#### `labels`

Additional labels to be added to all Loki logs. This can be used to add additional context to all logs, such as the application name, environment, etc.

#### `propsToLabels`

A list of properties to be converted to loki labels. 

#### `levelMap`

A map of pino log levels to Loki log levels. This can be used to map pino log levels to different Loki log levels. This is the default map. Left is pino log level, right is Loki log level.

```ts
{
  10: LokiLogLevel.Debug,
  20: LokiLogLevel.Debug,
  30: LokiLogLevel.Info,
  40: LokiLogLevel.Warning,
  50: LokiLogLevel.Error,
  60: LokiLogLevel.Critical,
},
```

#### `host`

The URL for Loki. This is required.

#### `endpoint`

The path to the Loki push API. Defaults to `/loki/api/v1/push`.

#### `basicAuth`

Basic auth credentials for Loki. An object with the following shape:

```ts
{
  username: "username",
  password: "password",
}
```
#### `headers`

A list of headers to be sent to Loki. This can be useful for adding the `X-Scope-OrgID` header for Grafana Cloud Loki :

```ts
{
  "X-Scope-OrgID": "your-id",
})
```

#### `timeout`

A max timeout in miliseconds when sending logs to Loki. Defaults to `30_000`.

#### `silenceErrors`

If false, errors when sending logs to Loki will be displayed in the console. Defaults to `false`.

#### `batching`

Should logs be sent in batch mode. Defaults to `true`.

#### `interval`

The interval at which batched logs are sent in seconds. Defaults to `5`.

#### `replaceTimestamp` 

Defaults to `false`. If true, the timestamp in the pino log will be replaced with `Date.now()`. Be careful when using this option with `batching` enabled, as the logs will be sent in batches, and the timestamp will be the time of the batch, not the time of the log.

#### `structuredMetaKey`

The key in the pino log object that contains [structured metadata](https://grafana.com/docs/loki/latest/get-started/labels/structured-metadata/). Defaults to `undefined` which means that structured metadata will not be sent to Loki. If set to `meta` for example, `{ recordId: 123, traceId: 456 }` will be sent if using the following log : 

```ts
logger.info({ meta: { recordId: 123, traceId: 456 } }, 'Hello')
```

#### `convertArrays`

Defaults to `false`. As documented in the [Loki documentation](https://grafana.com/docs/loki/latest/query/log_queries/#json), Loki JSON parser will skip arrays. Setting this options to `true` will convert arrays to object with index as key. For example, `["foo", "bar"]` will be converted to `{ "0": "foo", "1": "bar" }`.


#### `logFormat`

Defaults to `false`. This option will let you convert the JSON pino log into a single string in a format that you set. 
The template can be either a string template ( not a string literal ! ) or a function that returns a string.
You can use dot notation to access nested properties in the pino log object, such as `{req.method}` or `{req.url}`.

```typescript
 const transport = pino.transport<LokiOptions>({
    target: 'pino-loki',
    options: {
      // String template
      logFormat: '{time} | {level} | {msg} {req.method} {req.url}',
      // Or a function ⚠️ Will not work out-of-the-box 
      // with worker threads. Read the warning below !
      logFormat: ({ time, level, msg, req }) => {
        return `${time} | ${level} | ${msg} ${req.method} ${req.url}`;
      },
    },
})
```
> [!NOTE]
> Want to use the `logFormat` option with worker threads? Check the below section about [Handling non-serializable options](#handling-non-serializable-options).

The log object has the following options:

- `lokiLevel`: The pino log level parsed to Loki log level ( 'debug', 'info', 'warning' etc.. )
- `{key}`: Any other key in the pino log object, such as `pid`, `hostname`, `msg` etc.



### Handling non-serializable options

Using the new pino v7+ transports not all options are serializable, for example if you want to use `logFormat` as a function you will need to wrap `pino-loki` in a custom module like this : 

```ts
// main.ts
import pino from 'pino'

const logger = pino({
  transport: {
    target: './my-custom-pino-loki.js',
    options: { labels: { application: 'MY-APP' } }
  },
})
```

```ts
// my-custom-pino-loki.js
import { pinoLoki } from 'pino-loki'

export default function customPinoLoki(options) {
  return pinoLoki({
    ...options,
    logFormat: (log) => {
      return `hello ${log.msg} ${log.lokilevel} ${log.req.id} ${log.level}`
    },
  })
}
```

This way you can use the `logFormat` option as a function, or any other non-serializable option.
## CLI usage
```shell
npm install -g pino-loki
node foo | pino-loki --hostname=http://hostname:3100
```

```
$ pino-loki -h
Options:
  -V, --version                  output the version number
  -u, --user <user>              Loki username
  -p, --password <password>      Loki password
  --hostname <hostname>          URL for Loki
  --endpoint <endpoint>          Path to the Loki push API
  --headers <headers>            Headers to be sent to Loki (Example: "X-Scope-OrgID=your-id,another-header=another-value")
  -b, --batch                    Should logs be sent in batch mode
  -i, --interval <interval>      The interval at which batched logs are sent in seconds
  -t, --timeout <timeout>        Timeout for request to Loki
  -s, --silenceErrors            If false, errors will be displayed in the console
  -r, --replaceTimestamp         Replace pino logs timestamps with Date.now()
  -l, --labels <label>           Additional labels to be added to all Loki logs
  -a, --convertArrays            If true, arrays will be converted to objects
  -pl, --propsLabels <labels>    Fields in log line to convert to Loki labels (comma separated values)
  --structuredMetaKey <key>      Key in the pino log object that contains structured metadata
  --no-stdout                    Disable output to stdout
  -h, --help                     display help for command
```

## Examples

Feel free to explore the different examples in the [examples](./examples) folder.

- [module_usage.ts](./examples/module_usage.ts) - Example of using pino-loki as a module in the main process
- [basic.ts](./examples/basic.ts) - Basic example of using pino-loki in a worker thread
- [batching.ts](./examples/batching.ts) - Example of using pino-loki in a worker thread with batching enabled
- [cli.ts](./examples/cli.ts) - Example of using pino-loki as a CLI
- [custom_timestamp.ts](./examples/custom_timestamp.ts) - Example of using pino-loki with nanoseconds timestamps

## Usage in AdonisJS

Since AdonisJS use Pino as the default logger, you can use pino-loki easily by adding a new transport to the logger, in the `config/logger.ts` file:

```ts
import type { LokiOptions } from 'pino-loki'
import app from '@adonisjs/core/services/app'
import { defineConfig, targets } from '@adonisjs/core/logger'

import env from '#start/env'

const loggerConfig = defineConfig({
  default: 'app',

  loggers: {
    app: {
      enabled: true,
      name: env.get('APP_NAME'),
      level: env.get('LOG_LEVEL'),
      transport: {
        targets: targets()
          .push({
            target: 'pino-loki',
            options: {
              labels: { application: 'MY-APP' },
              host: env.get('LOKI_HOST'),
              basicAuth: {
                username: env.get('LOKI_USERNAME'),
                password: env.get('LOKI_PASSWORD'),
              },
            } satisfies LokiOptions,
          })
          .toArray(),
      },
    },
  },
})
```

And you should be good to go! You can check our [full example](./examples/adonisjs/) for more details.

# Limitations and considerations
## Out-of-order errors
Out-of-order Loki errors can occur due to the asynchronous nature of Pino. The fix to this is to allow for out-of-order logs in the Loki configuration. The reason why Loki doesn't have this enabled by default is because Promtail accounts for ordering constraints, however the same issue can also happen with promtail in high-load or when working with distributed networks.

## Dropped logs
If any network issues occur, the logs can be dropped. The recommendation is therefore to implement a failover solution, this will vary greatly from system to system.

## Node v18+ Required
As the pino-loki library uses the native Node fetch, any consumer must be using a version of Node greater than v18.0.0.

## Developing

### Requirements
Running a local Loki for testing is probably required, and the easiest way to do that is to follow this guide: https://github.com/grafana/loki/tree/master/production#run-locally-using-docker. After that, Grafana Loki instance is available at `http://localhost:3100`, with a Grafana instance running at `http://localhost:3000`. Username `admin`, password `admin`. Add the Loki source with the URL `http://loki:3100`, and the explorer should work.

Refer to https://grafana.com/docs/loki/latest/api/ for documentation about the available endpoints, data formats etc.

## Sponsors

If you like this project, [please consider supporting it by sponsoring it](https://github.com/sponsors/Julien-R44/). It will help a lot to maintain and improve it. Thanks a lot !

![](https://github.com/julien-r44/static/blob/main/sponsorkit/sponsors.png?raw=true)

## License

[MIT](./LICENSE) License © 2022 [Julien Ripouteau](https://github.com/Julien-R44)
