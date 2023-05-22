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

export class LokiClient {
  public static client = got.extend({
    prefixUrl: process.env.LOKI_HOST!,
    username: process.env.LOKI_USERNAME!,
    password: process.env.LOKI_PASSWORD!,
  })

  public static getLogs(query: string) {
    return this.client
      .get('loki/api/v1/query', { searchParams: { query, limit: 10 } })
      .json<QueryRangeResponse<any>>()
  }
}
