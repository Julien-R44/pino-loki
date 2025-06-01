import type { CustomParseArgsOptionsConfig } from './args'

export function printHelp(opts: CustomParseArgsOptionsConfig) {
  console.log(`Usage: pino-loki [options]\n\nOptions:`)

  const flagsData = Object.entries(opts).map(([key, option]) => ({
    flags:
      (option.short ? `-${option.short}, --${key}` : `--${key}`) +
      (option.type === 'boolean' ? '' : ` <value>`),
    help: option.help,
    default: option.default,
  }))

  const maxFlagsWidth = Math.max(...flagsData.map((item) => item.flags.length))

  for (const { flags, help, default: defaultValue } of flagsData) {
    const paddedFlags = flags.padEnd(maxFlagsWidth + 2)
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : ''

    console.log(`  ${paddedFlags}${help}${defaultText}`)
  }

  console.log(
    `\nExample:\n  pino-loki --hostname http://localhost:3100 --user myuser --password mypass --batch --interval 10`,
  )
}
