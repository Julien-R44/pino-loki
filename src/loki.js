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

      Object.keys(item.tags).map(function(key, index) {
        item.tags[key] = item.tags[key].toString();
      })

      const toSend = { 
        streams: [{
          stream: {
            application: this._options.applicationTag,
            level: item.status,
            ...item.tags
          },
          values: [[
            (new Date().getTime() * 1000000).toString(),
            JSON.stringify(item.data)
          ]]
        }]
      };
      
      try {
        return await axios.post(url, toSend, { 
          timeout: this._options.timeout || 1800000, // Timeout after 30 minutes
          headers: { 'Content-Type': 'application/json' }
        })
      } catch(err){
        console.error(`Attempting to send Loki request failed with status '${err.response.status}: ${err.response.statusText}' returned reason: ${err.response.data.trim()}`);
      }
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