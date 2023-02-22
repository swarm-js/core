import fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  HTTPMethods
} from 'fastify'
import {
  SwarmController,
  SwarmMethod,
  SwarmOptions,
  SwarmParameter,
  SwarmQuery,
  SwarmReturn
} from './interfaces'
import { SwarmMonitorData } from './interfaces/SwarmMonitorData'
import { createFullRoute } from './tools/path'
import dayjs from 'dayjs'
import Monitoring from './controllers/Monitoring'
import { checkAccess } from './tools/acl'
import { createUserAccessMiddleware } from './middlewares/populateUserAccess'
import { getErrorMessage } from './tools/error'
import Swagger from './controllers/Swagger'
import fs from 'fs/promises'
import path from 'path'
const main = require('require-main-filename')()

declare module 'fastify' {
  interface FastifyRequest {
    // you must reference the interface and not the type
    userAccess: string[]
  }
}

export class Swarm {
  controllers: SwarmController[] = []
  options: SwarmOptions = {
    logLevel: 'error',
    documentationAccess: [],
    getUserAccess: (_: FastifyRequest) => [],
    monitor: false,
    monitorAccess: [],
    prefix: '/',
    schemasFolder: './schemas'
  }
  private fastifyInstance: FastifyInstance | null = null
  private monitorData: Map<string, SwarmMonitorData> = new Map<
    string,
    SwarmMonitorData
  >()
  private schemas: any = {}

  constructor(conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
    this.fastifyInstance = fastify({})
    Monitoring.init(this)
    Swagger.init(this)
  }

  getMonitorData() {
    return this.monitorData.values()
  }

  get fastify() {
    return this.fastifyInstance
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

  private async loadSchema(path: string, name: string) {
    try {
      const content: string = await fs.readFile(path, { encoding: 'utf8' })
      this.schemas[name] = JSON.parse(content)
      this.log('info', `Found schema ${name}`)
      const fastifySchema = JSON.parse(content)
      fastifySchema.$id = name
      this.fastifyInstance?.addSchema(fastifySchema)
    } catch {}
  }

  private async loadSchemas(dir: string, prefix: string = ''): Promise<void> {
    try {
      const files = await fs.readdir(dir)
      for (let file of files) {
        const filepath: string = path.join(dir, file)
        const stat = await fs.lstat(filepath)
        if (stat.isFile() && file.substring(file.length - 5) === '.json')
          await this.loadSchema(
            filepath,
            `${prefix.length ? prefix + '/' : ''}${file.substring(
              0,
              file.length - 5
            )}`
          )
        else if (stat.isDirectory()) {
          await this.loadSchemas(
            filepath,
            `${prefix}${prefix.length ? '/' : ''}${file}`
          )
        }
      }
    } catch {}
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
    if (prototype.query !== undefined) {
      ret.query = prototype.query
      this.log(
        'debug',
        `${name}: found query: ${JSON.stringify(ret.query, null, 4)}`
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
      root: false,
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
    if (controller.prototype.swarm?.root !== undefined) {
      ret.root = controller.prototype.swarm.root
      this.log('debug', `${ret.name}: found root : ${ret.root ? 'Yes' : 'no'}`)
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
      if (method.access !== null) checkAccess(request, method.access)

      const startDate = +new Date()
      const response = await method.instance(request, reply)
      const endDate = +new Date()
      this.saveMonitorData(controller, method, endDate - startDate)
      return response
    }
  }

  private generateSchema(method: SwarmMethod): any {
    const schema: any = {}

    if (method.accepts !== null) {
      let accepts = method.accepts
      if (accepts instanceof Array === false) accepts = [accepts]
      accepts = accepts
        .map((name: string) => this.schemas[name])
        .filter((s: any) => s !== undefined)

      switch (accepts.length) {
        case 0:
          break
        case 1:
          schema.body = accepts[0]
          break
        default:
          schema.body = {
            anyOf: accepts
          }
          break
      }
    }

    const params = method.parameters
      .map((param: SwarmParameter) => [
        param.name,
        typeof param.schema === 'string'
          ? this.schemas[param.schema]
          : param.schema
      ])
      .filter(a => a[1] !== undefined)
    if (params.length)
      schema.params = {
        type: 'object',
        properties: Object.fromEntries(params)
      }

    const queries = method.query
      .map((query: SwarmQuery) => [
        query.name,
        typeof query.schema === 'string'
          ? this.schemas[query.schema]
          : query.schema
      ])
      .filter(a => a[1] !== undefined)
    if (queries.length)
      schema.querystring = {
        type: 'object',
        properties: Object.fromEntries(queries)
      }

    const returns = method.returns
      .map((ret: SwarmReturn) => [
        ret.code,
        typeof ret.schema === 'string' ? this.schemas[ret.schema] : ret.schema
      ])
      .filter(a => a[1] !== undefined)
    if (returns.length) schema.response = Object.fromEntries(returns)

    return schema
  }

  private registerControllers(): void {
    if (this.fastifyInstance === null) return

    for (const controller of this.controllers) {
      this.log('debug', `Adding routes for ${controller.name}`)

      for (const method of controller.methods) {
        for (let version of method.version) {
          const schema: any = this.generateSchema(method)

          this.fastifyInstance.route({
            method: <HTTPMethods>method.method,
            url: controller.root
              ? method.fullRoute
              : `/${version}${method.fullRoute}`,
            schema,
            handler: this.createHandlerForMethod(controller, method)
          })
          this.log(
            'info',
            `Added route for ${controller.name}@${method.name}: ${
              method.method
            } ${controller.root ? '' : '/' + version}${method.fullRoute}`
          )
        }
      }
    }
  }

  async listen(port: number = 3000, host: string = '0.0.0.0') {
    // Register routes
    if (this.fastifyInstance === null) return

    await this.loadSchemas(
      path.join(path.dirname(main), this.options.schemasFolder)
    )

    // Decorate fastify instance to handle ACL
    this.fastifyInstance.decorateRequest('userAccess', function () {
      return []
    })
    this.fastifyInstance.addHook(
      'preHandler',
      createUserAccessMiddleware(this.options.getUserAccess)
    )

    this.addController(Swagger)

    // Add monitor route
    if (this.options.monitor) {
      this.addController(Monitoring)
    }

    this.registerControllers()

    try {
      await this.fastifyInstance.listen({ port, host })
      this.log('info', `Listening to ${host}:${port}`)
    } catch (err) {
      console.log(`Cannot listen to ${host}:${port}: ${getErrorMessage(err)}`)
      process.exit(1)
    }
  }
}
