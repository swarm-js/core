import fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import { SwarmOptions } from './interfaces'
import Monitoring from './controllers/Monitoring'
import { createUserAccessMiddleware } from './middlewares/populateUserAccess'
import { getErrorMessage } from './tools/error'
import Swagger from './controllers/Swagger'
import path from 'path'
import { Monitor } from './Monitor'
import { Schemas } from './Schemas'
import { Controllers } from './Controllers'
const main = require('require-main-filename')()

declare module 'fastify' {
  interface FastifyRequest {
    // you must reference the interface and not the type
    userAccess: string[]
  }
}

export class Swarm {
  private fastifyInstance: FastifyInstance
  options: SwarmOptions = {
    logLevel: 'error',
    documentationAccess: [],
    getUserAccess: (_: FastifyRequest) => [],
    monitor: false,
    monitorAccess: [],
    prefix: '/',
    schemasFolder: './schemas'
  }
  monitor: Monitor
  schemas: Schemas
  controllers: Controllers

  constructor (conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
    this.fastifyInstance = fastify({})
    this.monitor = new Monitor(this)
    this.schemas = new Schemas(this)
    this.controllers = new Controllers(this)
    Monitoring.init(this)
    Swagger.init(this)
  }

  get fastify () {
    return this.fastifyInstance
  }

  log (level: string, content: any) {
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

  async listen (port: number = 3000, host: string = '0.0.0.0') {
    // Register routes
    if (this.fastifyInstance === null) return

    await this.schemas.loadDir(
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

    // Add documentation route
    this.controllers.add(Swagger)

    // Add monitor route
    if (this.options.monitor) {
      this.controllers.add(Monitoring)
    }

    // Register found controllers
    this.controllers.register()

    // Open connection
    try {
      await this.fastifyInstance.listen({ port, host })
      this.log('info', `Listening to ${host}:${port}`)
    } catch (err) {
      console.log(`Cannot listen to ${host}:${port}: ${getErrorMessage(err)}`)
      process.exit(1)
    }
  }
}
