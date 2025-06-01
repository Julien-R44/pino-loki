/* eslint-disable @typescript-eslint/no-redeclare */
export const LokiLogLevel = {
  Info: 'info',
  Debug: 'debug',
  Error: 'error',
  Warning: 'warning',
  Critical: 'critical',
} as const

export type LokiLogLevel = (typeof LokiLogLevel)[keyof typeof LokiLogLevel]
