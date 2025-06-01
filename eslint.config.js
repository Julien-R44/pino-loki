// eslint-disable-next-line @typescript-eslint/no-require-imports
const { julr } = require('@julr/tooling-configs/eslint')

module.exports = julr({ ignores: ['examples/adonisjs/**/*'] })
