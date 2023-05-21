<p align="center">
  <img src="https://user-images.githubusercontent.com/8337858/188330582-cdbdde50-da1c-47e4-b251-10a32155e6c7.png">
</p>

This module provides a transport for pino that forwards messages to a Loki instance.

## Why pino-loki
Pino-loki is based upon the highly performant logging library pino. Loki usually gets the logs through Promtail which reads system logs from files. This setup may not always be possible or require additional infrastructure, especially in situations where logs are gathered application code deployed as a SaaS in the cloud. Pino-loki sends the pino logs directly to Loki.

Pino-loki is for Pino v7.0.0 and above, so the module can be configured to operate in a worker thread, which is the recommended way to use it.

## Usage

## In a worker thread

```ts
import pino from 'pino'
import type { LokiOptions } from 'pino-loki'

const transport = pino.transport<LokiTransportOptions>({
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

## In main process

See [the example](./examples/module_usage.ts)

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
  -b, --batch                    Should logs be sent in batch mode
  -i, --interval <interval>      The interval at which batched logs are sent in seconds
  -t, --timeout <timeout>        Timeout for request to Loki
  -s, --silenceErrors            If false, errors will be displayed in the console
  -r, --replaceTimestamp         Replace pino logs timestamps with Date.now()
  -l, --labels <label>           Additional labels to be added to all Loki logs
  -pl, --propsLabels <labels>    Fields in log line to convert to Loki labels (comma separated values)
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

## Options

- `batch` and `interval` are used to enable batching of logs. When enabled, logs are sent in batches every `interval` seconds. This is useful for reducing the number of requests to Loki.


# Limitations and considerations
## Out-of-order errors
Out-of-order Loki errors can occur due to the asynchronous nature of Pino. The fix to this is to allow for out-of-order logs in the Loki configuration. The reason why Loki doesn't have this enabled by default is because Promtail accounts for ordering constraints, however the same issue can also happen with promtail in high-load or when working with distributed networks.

## Dropped logs
If any network issues occur, the logs can be dropped. The recommendation is therefore to implement a failover solution, this will vary greatly from system to system.

## Developing

### Requirements
Running a local Loki for testing is probably required, and the easiest way to do that is to follow this guide: https://github.com/grafana/loki/tree/master/production#run-locally-using-docker. After that, Grafana Loki instance is available at `http://localhost:3100`, with a Grafana instance running at `http://localhost:3000`. Username `admin`, password `admin`. Add the Loki source with the URL `http://loki:3100`, and the explorer should work.

Refer to https://grafana.com/docs/loki/latest/api/ for documentation about the available endpoints, data formats etc.

## License

[MIT](./LICENSE) License © 2022 [Julien Ripouteau](https://github.com/Julien-R44)
