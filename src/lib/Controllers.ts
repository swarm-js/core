import { FastifyReply, FastifyRequest, HTTPMethods } from 'fastify'
import { SwarmArgument, SwarmController, SwarmMethod } from './interfaces'
import { Swarm } from './Swarm'
import { checkAccess } from './tools/acl'
import { createFullRoute } from './tools/path'
import { SwarmInjector } from './interfaces/SwarmInjector'
import { InternalServerError } from 'http-errors'

export class Controllers {
  swarm: Swarm
  controllers: SwarmController[] = []

  constructor(instance: Swarm) {
    this.swarm = instance
  }

  get list() {
    return this.controllers
  }

  addController(name: string, options: Partial<SwarmController> = {}): void {
    const conf: SwarmController = {
      name: name,
      methods: [],
      title: null,
      description: null,
      prefix: '/',
      root: false,
      version: [this.swarm.options.defaultVersion],
      access: null,
      parameters: [],
      ...options
    }

    let added = false
    this.controllers = this.controllers.map((controller: SwarmController) => {
      if (controller.name === name) {
        added = true
        return conf
      }
      return controller
    })

    if (!added) this.controllers.push(conf)

    this.swarm.log('info', `Adding controller ${conf.name}`)
  }

  addMethod(
    controllerName: string,
    method: any,
    options: Partial<SwarmMethod> = {}
  ): void {
    // Ensure controller is configured
    const controllerIdx = this.controllers.findIndex(
      (controller: SwarmController) => controller.name === controllerName
    )
    if (controllerIdx === -1) {
      this.swarm.log('error', `Controller ${controllerName} does not exists`)
      return
    }

    const conf: SwarmMethod = {
      name: method.name,
      instance: method,
      fullRoute: '',
      method: null,
      route: null,
      title: '',
      description: '',
      access: null,
      accepts: null,
      returns: [],
      parameters: [],
      query: [],
      version: [],
      args: [],
      rawBody: false,
      ...options
    }

    // If no args, add request and response
    if (conf.args.length === 0)
      conf.args = [
        { idx: 0, type: 'request' },
        { idx: 1, type: 'response' }
      ]

    // If no version is configured, take versions from the controller
    if (conf.version.length === 0)
      conf.version = this.controllers[controllerIdx].version

    if (conf.method === null || conf.route === null) {
      this.swarm.log(
        'debug',
        `Method ${method.name} is missing method or route, cannot be handled`
      )
      return
    }

    if (conf.fullRoute.length === 0) {
      conf.fullRoute = createFullRoute(
        this.controllers[controllerIdx].prefix,
        conf.route
      )
      this.swarm.log('debug', `${method.name} full route is: ${conf.fullRoute}`)
    }

    let added = false
    this.controllers[controllerIdx].methods = this.controllers[
      controllerIdx
    ].methods.map((m: SwarmMethod) => {
      if (m.name === conf.name) {
        added = true
        return conf
      }
      return m
    })

    if (!added) this.controllers[controllerIdx].methods.push(conf)

    this.swarm.log(
      'info',
      `Adding ${conf.name} method to controller ${controllerName}`
    )
  }

  add(controller: any): void {
    const ret: SwarmController = {
      name: controller.prototype.constructor.name,
      methods: [],
      title: null,
      description: null,
      prefix: '/',
      root: false,
      version: [this.swarm.options.defaultVersion],
      access: null,
      parameters: []
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
    if (controller.prototype.swarm?.access !== undefined) {
      ret.access = controller.prototype.swarm.access
      this.swarm.log(
        'debug',
        `${ret.name}: found access: ${JSON.stringify(ret.access, null, 4)}`
      )
    }
    if (controller.prototype.swarm?.parameters !== undefined) {
      ret.parameters = controller.prototype.swarm.parameters
      this.swarm.log(
        'debug',
        `${ret.name}: found parameters: ${JSON.stringify(
          ret.parameters,
          null,
          4
        )}`
      )
    }

    this.swarm.log('debug', `${ret.name}: reading methods`)
    this.addController(ret.name, ret)

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
        this.addMethod(ret.name, controller[name], method)

        this.swarm.log(
          'debug',
          `${name} method in ${ret.name} controller is : ${JSON.stringify(
            method,
            null,
            4
          )}`
        )
        this.swarm.log(
          'debug',
          `Registering ${name} method in ${ret.name} controller`
        )
      }
    }
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
      title: '',
      description: '',
      access: null,
      accepts: null,
      returns: [],
      parameters: [],
      query: [],
      version: [],
      args: [],
      rawBody: false
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
    if (prototype.rawBody !== undefined) {
      ret.rawBody = prototype.rawBody
      this.swarm.log('debug', `${name}: found rawBody: ${ret.rawBody}`)
    }
    if (prototype.args !== undefined) {
      ret.args = prototype.args
      this.swarm.log('debug', `${name}: found args: ${ret.args}`)
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

  private createMethodArgs(
    method: SwarmMethod,
    request: any,
    reply: FastifyReply
  ) {
    const maxIdx = Math.max(...method.args.map((a: SwarmArgument) => a.idx))
    const ret = Array(maxIdx + 1)
    for (let arg of method.args) {
      switch (arg.type) {
        case 'body':
          ret[arg.idx] = (arg.key ?? '').length
            ? request.body[arg.key ?? '']
            : request.body
          break
        case 'rawbody':
          ret[arg.idx] = request.rawBody
          break
        case 'query':
          ret[arg.idx] = (arg.key ?? '').length
            ? request.query[arg.key ?? '']
            : request.query
          break
        case 'request':
          ret[arg.idx] = request
          break
        case 'response':
          ret[arg.idx] = reply
          break
        case 'headers':
          ret[arg.idx] = (arg.key ?? '').length
            ? request.headers[arg.key ?? '']
            : request.headers
          break
        case 'params':
          ret[arg.idx] = (arg.key ?? '').length
            ? request.params[arg.key ?? '']
            : request.params
          break
        default:
          const injector = this.swarm
            .getOption('injectors')
            .find((i: SwarmInjector) => i.name === arg.type)
          if (injector) ret[arg.idx] = injector.getValue(request) ?? undefined
          break
      }
    }

    return ret
  }

  private createHandlerForMethod(
    controller: SwarmController,
    method: SwarmMethod
  ) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      if (this.swarm.isShutingDown) throw new InternalServerError()

      request = await this.swarm.hooks.run('preAccess', request)
      if (controller.access !== null || method.access !== null)
        checkAccess(
          request,
          method.access !== null ? method.access : controller.access
        )
      await this.swarm.hooks.run('postAccess')

      let hookState: any = { request, controller, method }
      hookState = await this.swarm.hooks.run('preHandler', hookState)

      let response = null
      try {
        response = await method.instance(
          ...this.createMethodArgs(method, request, reply)
        )
      } catch (err: any) {
        hookState.error = err
        await this.swarm.hooks.run('onError', hookState)
        throw err
      }
      await this.swarm.hooks.run('postHandler', hookState)
      response = await this.swarm.hooks.run('preResponse', response)

      return response
    }
  }

  register(): void {
    if (this.swarm.fastify === null) return

    for (const controller of this.controllers) {
      this.swarm.log('debug', `Adding routes for ${controller.name}`)

      for (const method of controller.methods) {
        for (let version of method.version) {
          const schema: any = this.swarm.schemas.generate(controller, method)

          this.swarm.fastify.register((plugin: any, _: any, next: any) => {
            if (method.rawBody) {
              plugin.addContentTypeParser(
                'application/json',
                { parseAs: 'buffer' },
                function (_: any, body: any, done: any) {
                  try {
                    done(null, body)
                  } catch (error: any) {
                    error.statusCode = 400
                    done(error, undefined)
                  }
                }
              )
            }
            plugin.route({
              method: <HTTPMethods>method.method,
              url: controller.root
                ? method.fullRoute
                : `/${version}${method.fullRoute}`,
              schema,
              handler: this.createHandlerForMethod(controller, method)
            })
            next()
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
