'use strict'

const loki = require('./loki')
const streams = require('./streams')
const pumpify = require('pumpify')

async function createWriteStream(options = {}) {
  return createWriteStreamSync(options)
}

function createWriteStreamSync(options = {}) {
  const { size = 1 } = options

  const parseJsonStream = streams.parseJsonStream()
  const toLogEntryStream = streams.toLogEntryStream(options)
  const batchStream = streams.batchStream(size)

  const client = new loki.Client(options)
  const writeStream = client.insertStream()

  return pumpify(parseJsonStream, toLogEntryStream, batchStream, writeStream)
}

module.exports.createWriteStream = createWriteStream
module.exports.createWriteStreamSync = createWriteStreamSync
