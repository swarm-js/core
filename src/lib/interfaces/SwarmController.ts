import { SwarmMethod } from './SwarmMethod'

export interface SwarmController {
  name: string
  instance: any
  methods: SwarmMethod[]
  title: string | null
  description: string | null
  prefix: string
  root: boolean
  version: string[]
}
