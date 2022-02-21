'use strict'

const batch2 = require('batch2')
const split2 = require('split2')
const through2 = require('through2')
const fastJsonParse = require('fast-json-parse')

function batchStream(size) {
  return batch2.obj({ size })
}

function parseJsonStream() {
  return split2(function (str) {
    const result = fastJsonParse(str)
    if (result.err) return
    return result.value
  })
}

function levelToStatus(level) {
  if (level === 10 || level === 20) {
    return 'debug'
  }
  if (level === 40) {
    return 'warning'
  }
  if (level === 50) {
    return 'error'
  }
  if (level >= 60) {
    return 'critical'
  }
  return 'info'
}

function toLogEntry(item) {
  const timestamp = item.time || new Date().getTime()
  const status = levelToStatus(item.level)
  const message = item.msg || status
  const host = item.hostname || ''
  const service = item.service || ''
  const ddsource = item.ddsource || item.source || ''
  const tags = item.labels || item.tags || {}

  const entry = Object.assign({}, item, { timestamp, status, message, host, service, ddsource, tags })
  delete entry.time
  delete entry.level
  delete entry.hostname
  delete entry.source
  delete entry.labels
  if (!service) {
    delete entry.service
  }
  if (!ddsource) {
    delete entry.ddsource
  }
  return entry
}

function toLogEntryStream(options = {}) {
  return through2.obj(function transport(chunk, enc, cb) {
    const entry = toLogEntry(chunk)
    if (!options.keepMsg) {
      delete entry.msg
    }
    cb(null, entry)
  })
}

module.exports = {
  batchStream,
  parseJsonStream,
  toLogEntryStream
}
