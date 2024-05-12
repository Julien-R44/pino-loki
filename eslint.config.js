// eslint-disable-next-line @typescript-eslint/no-var-requires
const { julr } = require('@julr/tooling-configs/eslint')

module.exports = julr(
  {},
  {
    ignores: ['examples/adonisjs/**/*'],
  },
)
