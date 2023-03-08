import { SwarmMethod } from './SwarmMethod'
import { SwarmParameter } from './SwarmParameter'

export interface SwarmController {
  name: string
  methods: SwarmMethod[]
  title: string | null
  description: string | null
  prefix: string
  root: boolean
  version: string[]
  access: string | string[] | null
  parameters: SwarmParameter[]
}
