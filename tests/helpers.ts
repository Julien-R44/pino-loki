import got from 'got'

interface QueryRangeResponse<StreamType extends Record<string, string>> {
  status: string
  data: {
    resultType: string
    result: {
      stream: StreamType
      values: [string, string][]
    }[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LokiClient {
  static client = got.extend({
    prefixUrl: process.env.LOKI_HOST!,
    username: process.env.LOKI_USERNAME!,
    password: process.env.LOKI_PASSWORD!,
  })

  static getLogs(query: string) {
    return this.client
      .get('loki/api/v1/query', { searchParams: { query, limit: 10 } })
      .json<QueryRangeResponse<any>>()
  }
}
