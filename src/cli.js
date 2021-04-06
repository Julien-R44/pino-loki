#!/usr/bin/env node

const program = require('commander')
const pkg = require('../package.json')
const pinoLoki = require('././index')

function main () {
  program
    .version(pkg.version)
    .option('-u, --user <user>', 'Loki username')
    .option('-p, --password <password>', 'Loki password')
    .option('--hostname <hostname>', 'Default hostname for the logs')
    .option('-b, --batch <size>', 'The number of log messages to send as a single batch (defaults to 1)')
    .option('-a, --application <appName>', 'Name of application. Added as Loki Tag.')
    .option('--no-stdout', 'Disable output to stdout')
    .action(async options => {
      try {
        const config = {
          user: options.user || process.env.PL_USER,
          password: options.password || process.env.PL_USER,
          hostname: options.hostname || process.env.PL_HOSTNAME,
          applicationTag: options.application || 'App',
          size: options.batch || 1
        }
        const writeStream = await pinoLoki.createWriteStream(config)
        process.stdin.pipe(writeStream)

        if (options.stdout) {
          process.stdin.pipe(process.stdout)
        }
      } catch (error) {
        console.log(error.message)
      }
    })

  program.parse(process.argv)
}

main()