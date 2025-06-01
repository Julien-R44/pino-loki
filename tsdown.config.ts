import { defineConfig } from 'tsdown/config'

export default [
  defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'node',
    dts: true,
  }),
  defineConfig({
    entry: { cli: 'src/cli/index.ts' },
    format: ['esm'],
    platform: 'node',
  }),
]
