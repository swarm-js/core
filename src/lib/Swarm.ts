import { FastifyRequest } from 'fastify'
import { SwarmController, SwarmMethod, SwarmOptions } from './interfaces'

export class Swarm {
  private controllers: SwarmController[] = []
  private options: SwarmOptions = {
    documentationPath: '/swagger.json',
    documentationAccess: (_: FastifyRequest) => true,
    getUserAccess: (_: FastifyRequest) => [],
    monitor: false,
    monitorAccess: (_: FastifyRequest) => true,
    prefix: '/',
    schemasFolder: 'schemas'
  }

  constructor (conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
  }

  addController (controller: any): void {
    const ret: SwarmController = {
      name: controller.prototype.constructor.name,
      instance: controller,
      methods: [],
      title: null,
      description: null,
      prefix: '/'
    }

    // Apply controller options
    if (controller.prototype.swarm?.title !== undefined)
      ret.title = controller.prototype.swarm.title
    if (controller.prototype.swarm?.description !== undefined)
      ret.description = controller.prototype.swarm.description
    if (controller.prototype.swarm?.prefix !== undefined)
      ret.prefix = controller.prototype.swarm.prefix

    for (let name of Object.getOwnPropertyNames(controller)) {
      if (typeof controller[name] !== 'function') continue

      const method: SwarmMethod = {
        name,
        instance: controller[name],
        method: null,
        route: null,
        title: null,
        description: null,
        access: null,
        accepts: null,
        returns: [],
        parameters: []
      }

      // Apply method options
      if (controller.prototype.swarm?.methods?.[name]?.method !== undefined)
        method.method = controller.prototype.swarm.methods[name].method
      if (controller.prototype.swarm?.methods?.[name]?.route !== undefined)
        method.route = controller.prototype.swarm.methods[name].route
      if (controller.prototype.swarm?.methods?.[name]?.title !== undefined)
        method.title = controller.prototype.swarm.methods[name].title
      if (
        controller.prototype.swarm?.methods?.[name]?.description !== undefined
      )
        method.description =
          controller.prototype.swarm.methods[name].description
      if (controller.prototype.swarm?.methods?.[name]?.access !== undefined)
        method.access = controller.prototype.swarm.methods[name].access
      if (controller.prototype.swarm?.methods?.[name]?.accepts !== undefined)
        method.accepts = controller.prototype.swarm.methods[name].accepts
      if (controller.prototype.swarm?.methods?.[name]?.returns !== undefined)
        method.returns = controller.prototype.swarm.methods[name].returns
      if (controller.prototype.swarm?.methods?.[name]?.parameters !== undefined)
        method.parameters = controller.prototype.swarm.methods[name].parameters

      if (method.method === null || method.route === null) continue

      ret.methods.push(method)
    }

    // If no method, no need to add controller
    if (ret.methods.length === 0) return

    this.controllers.push(ret)
  }

  async listen (port: number = 3000) {
    console.log(JSON.stringify(this.controllers, null, 4))
    console.log(`Listening to port ${port}`)
  }
}
