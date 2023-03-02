import { SwarmParameter } from './SwarmParameter'
import { SwarmQuery } from './SwarmQuery'
import { SwarmReturn } from './SwarmReturn'

export interface SwarmMethod {
  name: string
  instance: any
  fullRoute: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | null
  route: string | null
  title: string | null
  description: string | null
  access: string | string[] | null
  accepts: any | null
  returns: SwarmReturn[]
  parameters: SwarmParameter[]
  query: SwarmQuery[]
  version: string[]
}
