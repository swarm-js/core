import { SwarmParameter } from './SwarmParameter'
import { SwarmReturn } from './SwarmReturn'

export interface SwarmMethod {
  name: string
  instance: any
  method: string | null
  route: string | null
  title: string | null
  description: string | null
  access: any | null
  accepts: any | null
  returns: SwarmReturn[]
  parameters: SwarmParameter[]
}
