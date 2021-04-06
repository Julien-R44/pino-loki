const logger = require('pino')()

setInterval(() => { 
    logger.info('hello world')
}, 1000)