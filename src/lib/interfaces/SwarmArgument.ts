export interface SwarmArgument {
  idx: number
  type: 'body' | 'query' | 'request' | 'response' | 'headers' | 'params'
  key?: string
}
