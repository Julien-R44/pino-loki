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
  static async getLogs(query: string) {
    const url = new URL('loki/api/v1/query', process.env.LOKI_HOST!)
    url.searchParams.append('query', query)
    url.searchParams.append('limit', '10')

    return fetch(url).then((response) => response.json() as Promise<QueryRangeResponse<any>>)
  }
}
