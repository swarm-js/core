import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HTTPMethods
} from 'fastify'
import { SwarmController, SwarmMethod, SwarmOptions } from './interfaces'
import { createFullRoute } from './tools/path'

export class Swarm {
  private controllers: SwarmController[] = []
  private options: SwarmOptions = {
    logLevel: 'error',
    documentationPath: '/swagger.json',
    documentationAccess: (_: FastifyRequest) => true,
    getUserAccess: (_: FastifyRequest) => [],
    monitor: false,
    monitorAccess: (_: FastifyRequest) => true,
    prefix: '/',
    schemasFolder: 'schemas'
  }
  private fastifyInstance: FastifyInstance | null = null

  constructor(conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
    this.fastifyInstance = fastify({})
  }

  private log(level: string, content: any) {
    if (
      level === 'error' &&
      ['error', 'warn', 'info', 'debug'].includes(this.options.logLevel) ===
        false
    )
      return
    if (
      level === 'warn' &&
      ['warn', 'info', 'debug'].includes(this.options.logLevel) === false
    )
      return
    if (
      level === 'info' &&
      ['info', 'debug'].includes(this.options.logLevel) === false
    )
      return
    if (
      level === 'debug' &&
      ['debug'].includes(this.options.logLevel) === false
    )
      return

    console.log(`[Swarm][${level}]`, content)
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
      parameters: []
    }

    // Apply method options
    if (prototype.method !== undefined) {
      ret.method = prototype.method
      this.log('debug', `${name}: found method: ${ret.method}`)
    }
    if (prototype.route !== undefined) {
      ret.route = prototype.route
      this.log('debug', `${name}: found route: ${ret.route}`)
    }
    if (prototype.title !== undefined) {
      ret.title = prototype.title
      this.log('debug', `${name}: found title: ${ret.title}`)
    }
    if (prototype.description !== undefined) {
      ret.description = prototype.description
      this.log('debug', `${name}: found description: ${ret.description}`)
    }
    if (prototype.access !== undefined) {
      ret.access = prototype.access
      this.log(
        'debug',
        `${name}: found access: ${JSON.stringify(ret.access, null, 4)}`
      )
    }
    if (prototype.accepts !== undefined) {
      ret.accepts = prototype.accepts
      this.log(
        'debug',
        `${name}: found accepts: ${JSON.stringify(ret.accepts, null, 4)}`
      )
    }
    if (prototype.returns !== undefined) {
      ret.returns = prototype.returns
      this.log(
        'debug',
        `${name}: found returns: ${JSON.stringify(ret.returns, null, 4)}`
      )
    }
    if (prototype.parameters !== undefined) {
      ret.parameters = prototype.parameters
      this.log(
        'debug',
        `${name}: found parameters: ${JSON.stringify(ret.parameters, null, 4)}`
      )
    }

    if (ret.method === null || ret.route === null) {
      this.log(
        'debug',
        `Method ${name} is missing method or route, cannot be handled`
      )
      return null
    }

    ret.fullRoute = createFullRoute(prefix, ret.route)
    this.log('debug', `${name} full route is: ${ret.fullRoute}`)

    return ret
  }

  addController(controller: any): void {
    const ret: SwarmController = {
      name: controller.prototype.constructor.name,
      instance: controller,
      methods: [],
      title: null,
      description: null,
      prefix: '/'
    }

    this.log('debug', `Reading ${ret.name} controller`)

    // Apply controller options
    if (controller.prototype.swarm?.title !== undefined) {
      ret.title = controller.prototype.swarm.title
      this.log('debug', `${ret.name}: found title : ${ret.title}`)
    }
    if (controller.prototype.swarm?.description !== undefined) {
      ret.description = controller.prototype.swarm.description
      this.log('debug', `${ret.name}: found description : ${ret.description}`)
    }
    if (controller.prototype.swarm?.prefix !== undefined) {
      ret.prefix = controller.prototype.swarm.prefix
      this.log('debug', `${ret.name}: found prefix : ${ret.prefix}`)
    }

    this.log('debug', `${ret.name}: reading methods`)
    for (let name of Object.getOwnPropertyNames(controller)) {
      if (typeof controller[name] !== 'function') continue

      this.log('debug', `${ret.name} reading ${name} method`)

      const method: SwarmMethod | null = this.parseMethod(
        controller,
        name,
        controller.prototype.swarm?.methods?.[name] ?? {},
        ret.prefix
      )

      if (method !== null) {
        ret.methods.push(method)
        this.log(
          'debug',
          `Registering ${name} method in ${ret.name} controller`
        )
      }
    }

    // If no method, no need to add controller
    if (ret.methods.length === 0) return

    this.controllers.push(ret)
    this.log(
      'info',
      `Handling ${ret.name} controller with following methods: ${ret.methods
        .map(m => m.name)
        .join(', ')}`
    )
  }

  private saveMonitorData(
    controllerName: string,
    methodName: string,
    duration: number
  ) {
    if (!this.options.monitor) return
    console.log(controllerName, methodName, duration)
  }

  private createHandlerForMethod(
    controller: SwarmController,
    method: SwarmMethod
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const startDate = +new Date()
      const response = await method.instance(request, reply)
      const endDate = +new Date()
      this.saveMonitorData(controller.name, method.name, endDate - startDate)
      return response
    }
  }

  async listen(port: number = 3000) {
    // Register routes
    if (this.fastifyInstance === null) return

    for (const controller of this.controllers) {
      this.log('debug', `Adding routes for ${controller.name}`)

      for (const method of controller.methods) {
        this.fastifyInstance.route({
          method: <HTTPMethods>method.method,
          url: method.fullRoute,
          handler: this.createHandlerForMethod(controller, method)
        })
        this.log(
          'info',
          `Added route for ${controller.name}@${method.name}: ${method.method} ${method.fullRoute}`
        )
      }
    }

    console.log(`Listening to port ${port}`)
  }
}
