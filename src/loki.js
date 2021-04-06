'use strict'

const axios = require('axios')
const stream = require('stream')

class Client {
  constructor (options = {}) {
    this._options = options
  }

  async insert (items = []) {
    const data = Array.isArray(items) ? items : [items]
    if (data.length <= 0) {
      return
    }

    data.forEach(async item => {
      const url = `${this._options.hostname}/loki/api/v1/push`
      const toSend = { 
        streams: [{
          stream: {
            application: this._options.applicationTag,
            type: 'INFO'
          },
          values: [[
            (new Date().getTime() * 1000000).toString(),
            item.message
          ]]
        }]
      };

      const result = await axios.post(url, toSend, { 
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return result
    })
  }

  insertStream () {
    const self = this
    const writeStream = new stream.Writable({
      objectMode: true,
      highWaterMark: 1
    })
    writeStream._write = function (chunk, encoding, callback) {
      self
        .insert(chunk)
        .then(() => {
          callback(null)
        })
        .catch(callback)
    }
    return writeStream
  }
}

module.exports = { Client }