'use strict'

const axios = require('axios')
const stream = require('stream')

class Client {
  constructor(options = {}) {
    this._options = options
  }

  async insert(items = []) {
    const data = Array.isArray(items) ? items : [items]
    if (data.length <= 0) {
      return
    }

    data.forEach(async (item) => {
      const url = `${this._options.hostname}/loki/api/v1/push`

      Object.keys(item.tags).map(function (key, index) {
        item.tags[key] = item.tags[key].toString()
      })

      const toSend = {
        streams: [
          {
            stream: {
              application: this._options.applicationTag,
              level: item.status,
              ...item.tags
            },
            values: [[(new Date().getTime() * 1000000).toString(), JSON.stringify(item)]]
          }
        ]
      }

      try {
        return await axios.post(url, toSend, {
          timeout: this._options.timeout || 1800000, // Timeout after 30 minutes
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (err) {
        /**
         * If the the user has defined a custom error handler,
         * we will try to call it
         */
        if (this._options.errorHandler) {
          try {
            this._options.errorHandler(err)
          } catch (customHandlerError) {
            console.error('Got error from custom handler! Output:', customHandlerError)
          }
        }

        /**
         * If the user has defined silenceErrors, we will not
         * show any errors
         */
        if (this._options.silenceErrors !== true) {
          if (err.response) {
            console.error(
              `Attempting to send log to Loki failed with status '${err.response.status}: ${
                err.response.statusText
              }' returned reason: ${err.response.data.trim()}`
            )
          } else if (err.isAxiosError === true) {
            console.error(
              `Attempting to send log to Loki failed. Got an axios error, error code: '${err.code}' message: ${err.message}`
            )
          } else {
            console.error('Got unknown error when trying to send log to Loki, error output:', err)
          }
        }
      }
    })
  }

  insertStream() {
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
