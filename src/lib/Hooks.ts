import { SwarmHook } from './interfaces'
import { Swarm } from './Swarm'

export class Hooks {
  swarm: Swarm
  hooks: any = {}

  constructor (instance: Swarm) {
    this.swarm = instance
  }

  add (hook: SwarmHook, handler: any): void {
    if (this.hooks[hook] === undefined) this.hooks[hook] = []
    this.hooks[hook].push(handler)
  }

  async run (hook: SwarmHook, params: any = undefined): Promise<any> {
    for (let handler of this.hooks[hook] ?? []) {
      params = await handler(params)
    }
    return params
  }
}
