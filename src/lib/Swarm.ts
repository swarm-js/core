import fastify, { FastifyInstance, FastifyRequest } from 'fastify'
import { SwarmOptions, SwarmScopes } from './interfaces'
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
    getUserAccess: (_: FastifyRequest) => null,
    monitor: false,
    monitorAccess: [],
    prefix: '/',
    schemasFolder: './schemas',

    documentationAccess: null,
    servers: [],
    title: '',
    description: '',

    authType: null,
    apiKeyLocation: null,
    apiKeyName: null,
    bearerFormat: 'JWT',
    openIdConnectUrl: null,
    oauth2AuthorizationUrl: null,
    oauth2Flow: null,
    oauth2RefreshUrl: null,
    oauth2TokenUrl: null,
    oauth2Scopes: {}
  }
  monitor: Monitor
  schemas: Schemas
  controllers: Controllers

  constructor (conf: Partial<SwarmOptions>) {
    this.options = {
      ...this.options,
      ...conf
    }
    this.fastifyInstance = fastify({
      logger: true
    })
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

  addServer (url: string, description: string = '') {
    this.options.servers.push({ url, description })
  }

  basicAuth () {
    this.options.authType = 'basic'
  }

  bearerAuth (bearerFormat: string = 'JWT') {
    this.options.authType = 'bearer'
    this.options.bearerFormat = bearerFormat
  }

  apiKeyAuth (location: 'header' | 'query' | 'cookie', name: string) {
    this.options.authType = 'apiKey'
    this.options.apiKeyLocation = location
    this.options.apiKeyName = name
  }

  openIdAuth (connectUrl: string) {
    this.options.authType = 'openId'
    this.options.openIdConnectUrl = connectUrl
  }

  oauth2AuthAutorizationCode (
    authorizationUrl: string,
    tokenUrl: string,
    refreshUrl: string,
    scopes: SwarmScopes
  ) {
    this.options.authType = 'oauth2'
    this.options.oauth2Flow = 'authorizationCode'
    this.options.oauth2AuthorizationUrl = authorizationUrl
    this.options.oauth2TokenUrl = tokenUrl
    this.options.oauth2RefreshUrl = refreshUrl
    this.options.oauth2Scopes = scopes
  }

  oauth2AuthImplicit (
    authorizationUrl: string,
    refreshUrl: string,
    scopes: SwarmScopes
  ) {
    this.options.authType = 'oauth2'
    this.options.oauth2Flow = 'implicit'
    this.options.oauth2AuthorizationUrl = authorizationUrl
    this.options.oauth2RefreshUrl = refreshUrl
    this.options.oauth2Scopes = scopes
  }

  oauth2AuthPassword (
    tokenUrl: string,
    refreshUrl: string,
    scopes: SwarmScopes
  ) {
    this.options.authType = 'oauth2'
    this.options.oauth2Flow = 'password'
    this.options.oauth2TokenUrl = tokenUrl
    this.options.oauth2RefreshUrl = refreshUrl
    this.options.oauth2Scopes = scopes
  }

  oauth2AuthClientCredentials (
    tokenUrl: string,
    refreshUrl: string,
    scopes: SwarmScopes
  ) {
    this.options.authType = 'oauth2'
    this.options.oauth2Flow = 'clientCredentials'
    this.options.oauth2TokenUrl = tokenUrl
    this.options.oauth2RefreshUrl = refreshUrl
    this.options.oauth2Scopes = scopes
  }

  async listen (port: number = 3000, host: string = '0.0.0.0') {
    // Register routes
    if (this.fastifyInstance === null) return

    await this.schemas.loadDir(
      path.join(path.dirname(main), this.options.schemasFolder)
    )

    // Decorate fastify instance to handle ACL
    this.fastifyInstance.decorateRequest('userAccess', null)
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
