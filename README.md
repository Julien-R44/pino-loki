# pino-loki
This module provides a transport for pino that forwards messages to a Loki instance.

## Why pino-loki
Pino-loki is based upon the highly performant logging library pino. Loki usually gets the logs through Promtail which reads system logs from files. This setup may not always be possible or require additional infrastructure, especially in situations where logs are gathered application code deployed as a SaaS in the cloud. Pino-loki sends the pino logs directly to Loki.
## CLI Instructions
```shell
npm install -g pino-loki
node foo | pino-loki --hostname=http://hostname:3100 -a ApplicationTag
```

## Node example
How to use pino-loki as a multistream with several streams, using pino-pretty and pino-loki as examples:
```js
import pino from 'pino';
import * as pinoLoki from 'pino-loki';
import pretty from 'pino-pretty';

const streams = [
  { level: 'debug', stream: pinoLoki.createWriteStreamSync({hostname: '127.0.0.1:3100', applicationTag: 'test_application_tag'}) },
  { level: 'debug', stream: pretty() }
];

let logger = pino({level:'info'}, pino.multistream(streams));
// Log message without tags to Loki
logger.info("Hello world!");
// Log message with custom tags to Loki
logger.info({message:"Hello world!", tags: {someCustomTag:"BEEP BOOP"}})
```
# Limitations and considerations
## Out-of-order errors
Out-of-order Loki errors can occur due to the asynchronous nature of Pino. The fix to this is to allow for out-of-order logs in the Loki configuration. The reason why Loki doesn't have this enabled by default is because Promtail accounts for ordering constraints, however the same issue can also happen with promtail in high-load or when working with distributed networks.
## Dropped logs
If any network issues occur, the logs can be dropped. The recommendation is therefore to implement a failover solution, this will vary greatly from system to system.