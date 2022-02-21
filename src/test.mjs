import pino from 'pino';
import * as pinoLoki from './index.js';
import pretty from 'pino-pretty';

const options = {
  hostname: '127.0.0.1:3100', 
  applicationTag: 'test_application_tag', 
  timeout:3000, // Set timeout to 3 seconds, default is 30 minutes.
  silenceErrors:false,
  errorHandler: (error)=>{
    // Custom error code here
  }
}

const streams = [
  { level: 'debug', stream: pinoLoki.createWriteStreamSync(options) },
  { level: 'debug', stream: pretty() }
];

let logger = pino({level:'info'}, pino.multistream(streams));
// Log message without tags to Loki
logger.info("Hello world!");
// Log message with custom tags to Loki
logger.info({message:"Hello world!", tags: {someCustomTag:"BEEP BOOP"}})