import { FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { SwarmController, SwarmMethod } from './interfaces'
import { Swarm } from './Swarm'
import { checkAccess } from './tools/acl'
import { createFullRoute } from './tools/path'

export class Controllers {
  swarm: Swarm
  controllers: SwarmController[] = []

  constructor(instance: Swarm) {
    this.swarm = instance
  }

  get list() {
    return this.controllers
  }

  add(controller: any): void {
    const ret: SwarmController = {
      name: controller.prototype.constructor.name,
      instance: controller,
      methods: [],
      title: null,
      description: null,
      prefix: '/',
      root: false,
      version: ['v1']
    }

    this.swarm.log('debug', `Reading ${ret.name} controller`)

    // Apply controller options
    if (controller.prototype.swarm?.title !== undefined) {
      ret.title = controller.prototype.swarm.title
      this.swarm.log('debug', `${ret.name}: found title : ${ret.title}`)
    }
    if (controller.prototype.swarm?.description !== undefined) {
      ret.description = controller.prototype.swarm.description
      this.swarm.log(
        'debug',
        `${ret.name}: found description : ${ret.description}`
      )
    }
    if (controller.prototype.swarm?.prefix !== undefined) {
      ret.prefix = controller.prototype.swarm.prefix
      this.swarm.log('debug', `${ret.name}: found prefix : ${ret.prefix}`)
    }
    if (controller.prototype.swarm?.version !== undefined) {
      ret.version = controller.prototype.swarm.version
      this.swarm.log(
        'debug',
        `${ret.name}: found version : ${JSON.stringify(ret.version)}`
      )
    }
    if (controller.prototype.swarm?.root !== undefined) {
      ret.root = controller.prototype.swarm.root
      this.swarm.log(
        'debug',
        `${ret.name}: found root : ${ret.root ? 'Yes' : 'no'}`
      )
    }

    this.swarm.log('debug', `${ret.name}: reading methods`)
    for (let name of Object.getOwnPropertyNames(controller)) {
      if (typeof controller[name] !== 'function') continue

      this.swarm.log('debug', `${ret.name} reading ${name} method`)

      const method: SwarmMethod | null = this.parseMethod(
        controller,
        name,
        controller.prototype.swarm?.methods?.[name] ?? {},
        ret.prefix
      )

      if (method !== null) {
        ret.methods.push(method)
        this.swarm.log(
          'debug',
          `Registering ${name} method in ${ret.name} controller`
        )
      }
    }

    // If no method, no need to add controller
    if (ret.methods.length === 0) return

    this.controllers.push(ret)
    this.swarm.log(
      'info',
      `Handling ${ret.name} controller with following methods: ${ret.methods
        .map(m => m.name)
        .join(', ')}`
    )
  }

  private parseMethod(
    controller: any,
    name: string,
    prototype: any,
    prefix: string
  ): SwarmMethod | null {
    const ret: SwarmMethod = {
      name,
      instance: controller[name],
      fullRoute: '',
      method: null,
      route: null,
      title: null,
      description: null,
      access: null,
      accepts: null,
      returns: [],
      parameters: [],
      query: [],
      version: ['v1']
    }

    // Apply method options
    if (prototype.method !== undefined) {
      ret.method = prototype.method
      this.swarm.log('debug', `${name}: found method: ${ret.method}`)
    }
    if (prototype.route !== undefined) {
      ret.route = prototype.route
      this.swarm.log('debug', `${name}: found route: ${ret.route}`)
    }
    if (prototype.title !== undefined) {
      ret.title = prototype.title
      this.swarm.log('debug', `${name}: found title: ${ret.title}`)
    }
    if (prototype.description !== undefined) {
      ret.description = prototype.description
      this.swarm.log('debug', `${name}: found description: ${ret.description}`)
    }
    if (prototype.version !== undefined) {
      ret.version = prototype.version
      this.swarm.log(
        'debug',
        `${name}: found version: ${JSON.stringify(ret.version)}`
      )
    }
    if (prototype.access !== undefined) {
      ret.access = prototype.access
      this.swarm.log(
        'debug',
        `${name}: found access: ${JSON.stringify(ret.access, null, 4)}`
      )
    }
    if (prototype.accepts !== undefined) {
      ret.accepts = prototype.accepts
      this.swarm.log(
        'debug',
        `${name}: found accepts: ${JSON.stringify(ret.accepts, null, 4)}`
      )
    }
    if (prototype.returns !== undefined) {
      ret.returns = prototype.returns
      this.swarm.log(
        'debug',
        `${name}: found returns: ${JSON.stringify(ret.returns, null, 4)}`
      )
    }
    if (prototype.parameters !== undefined) {
      ret.parameters = prototype.parameters
      this.swarm.log(
        'debug',
        `${name}: found parameters: ${JSON.stringify(ret.parameters, null, 4)}`
      )
    }
    if (prototype.query !== undefined) {
      ret.query = prototype.query
      this.swarm.log(
        'debug',
        `${name}: found query: ${JSON.stringify(ret.query, null, 4)}`
      )
    }

    if (ret.method === null || ret.route === null) {
      this.swarm.log(
        'debug',
        `Method ${name} is missing method or route, cannot be handled`
      )
      return null
    }

    ret.fullRoute = createFullRoute(prefix, ret.route)
    this.swarm.log('debug', `${name} full route is: ${ret.fullRoute}`)

    return ret
  }

  private createHandlerForMethod(
    controller: SwarmController,
    method: SwarmMethod
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (method.access !== null) checkAccess(request, method.access)

      const startDate = +new Date()
      const response = await method.instance(request, reply)
      const endDate = +new Date()
      this.swarm.monitor.saveData(controller, method, endDate - startDate)
      return response
    }
  }

  register(): void {
    if (this.swarm.fastify === null) return

    for (const controller of this.controllers) {
      this.swarm.log('debug', `Adding routes for ${controller.name}`)

      for (const method of controller.methods) {
        for (let version of method.version) {
          const schema: any = this.swarm.schemas.generate(method)

          this.swarm.fastify.route({
            method: <HTTPMethods>method.method,
            url: controller.root
              ? method.fullRoute
              : `/${version}${method.fullRoute}`,
            schema,
            handler: this.createHandlerForMethod(controller, method)
          })
          this.swarm.log(
            'info',
            `Added route for ${controller.name}@${method.name}: ${
              method.method
            } ${controller.root ? '' : '/' + version}${method.fullRoute}`
          )
        }
      }
    }
  }
}
