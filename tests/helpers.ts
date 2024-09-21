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
    const url = new URL('loki/api/v1/query_range', process.env.LOKI_HOST!)
    url.searchParams.append('query', query)
    url.searchParams.append('limit', '10')

    return fetch(url, {
      headers: {
        ...(process.env.LOKI_USERNAME &&
          process.env.LOKI_PASSWORD && {
            Authorization:
              'Basic ' +
              Buffer.from(`${process.env.LOKI_USERNAME}:${process.env.LOKI_PASSWORD}`).toString(
                'base64',
              ),
          }),
      },
    }).then((response) => response.json() as Promise<QueryRangeResponse<any>>)
  }
}
