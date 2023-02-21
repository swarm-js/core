import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HTTPMethods
} from 'fastify'
import { SwarmController, SwarmMethod, SwarmOptions } from './interfaces'
import { SwarmMonitorData } from './interfaces/SwarmMonitorData'
import { createFullRoute } from './tools/path'
import dayjs from 'dayjs'
import Monitoring from './controllers/Monitoring'
import { checkAccess } from './tools/acl'

declare module 'fastify' {
  interface FastifyRequest {
    // you must reference the interface and not the type
    userAccess: string[]
  }
}

export class Swarm {
  private controllers: SwarmController[] = []
  private options: SwarmOptions = {
    logLevel: 'error',
    documentationPath: '/swagger.json',
    documentationAccess: [],
    getUserAccess: (_: FastifyRequest) => [],
    monitor: false,
    monitorAccess: [],
    prefix: '/',
    schemasFolder: 'schemas'
  }
  private fastifyInstance: FastifyInstance | null = null
  private monitorData: Map<string, SwarmMonitorData> = new Map<
    string,
    SwarmMonitorData
  >()

  constructor(conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
    this.fastifyInstance = fastify({})
    Monitoring.init(this)
  }

  getOptions() {
    return this.options
  }

  getMonitorData() {
    return this.monitorData.values()
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
      parameters: [],
      version: ['v1']
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
    if (prototype.version !== undefined) {
      ret.version = prototype.version
      this.log(
        'debug',
        `${name}: found version: ${JSON.stringify(ret.version)}`
      )
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
      prefix: '/',
      version: ['v1']
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
    if (controller.prototype.swarm?.version !== undefined) {
      ret.version = controller.prototype.swarm.version
      this.log(
        'debug',
        `${ret.name}: found version : ${JSON.stringify(ret.version)}`
      )
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
    controller: SwarmController,
    method: SwarmMethod,
    duration: number
  ) {
    if (!this.options.monitor) return

    let data: SwarmMonitorData | undefined = this.monitorData.get(
      `${controller.name}@${method.name}`
    )
    if (data === undefined)
      data = {
        controllerName: controller.name,
        methodName: method.name,
        method: method.method,
        path: method.fullRoute,
        calls: 0,
        totalDuration: 0,
        minDuration: null,
        maxDuration: null,
        perDay: {}
      }
    data.calls++
    data.totalDuration += duration
    if (data.minDuration === null || data.minDuration > duration)
      data.minDuration = duration
    if (data.maxDuration === null || data.maxDuration < duration)
      data.maxDuration = duration

    const today = dayjs().format('YYYY-MM-DD')
    if (data.perDay[today] === undefined)
      data.perDay[today] = {
        calls: 0,
        totalDuration: 0,
        minDuration: null,
        maxDuration: null
      }
    data.perDay[today].calls++
    data.perDay[today].totalDuration += duration
    if (data.minDuration === null || data.perDay[today].minDuration > duration)
      data.perDay[today].minDuration = duration
    if (
      data.perDay[today].maxDuration === null ||
      data.perDay[today].maxDuration < duration
    )
      data.perDay[today].maxDuration = duration
    this.monitorData.set(`${controller.name}@${method.name}`, data)
  }

  private createHandlerForMethod(
    controller: SwarmController,
    method: SwarmMethod
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      request.userAccess = []
      if (this.options.getUserAccess)
        request.userAccess = await this.options.getUserAccess(request)

      if (method.access !== null) checkAccess(request, method.access)

      const startDate = +new Date()
      const response = await method.instance(request, reply)
      const endDate = +new Date()
      this.saveMonitorData(controller, method, endDate - startDate)
      return response
    }
  }

  async listen(port: number = 3000) {
    // Register routes
    if (this.fastifyInstance === null) return

    // Add monitor route
    if (this.options.monitor) {
      this.addController(Monitoring)
    }

    for (const controller of this.controllers) {
      this.log('debug', `Adding routes for ${controller.name}`)

      for (const method of controller.methods) {
        for (let version of method.version) {
          this.fastifyInstance.route({
            method: <HTTPMethods>method.method,
            url: `/api/${version}${method.fullRoute}`,
            handler: this.createHandlerForMethod(controller, method)
          })
          this.log(
            'info',
            `Added route for ${controller.name}@${method.name}: ${method.method} /api/${version}${method.fullRoute}`
          )
        }
      }
    }

    console.log(`Listening to port ${port}`)
  }
}
