import fastify, {
  FastifyBaseLogger,
  FastifyHttpOptions,
  FastifyInstance,
  FastifyRequest,
  RawServerDefault
} from 'fastify'
import { SwarmOptions, SwarmScopes } from './interfaces'
import { createUserAccessMiddleware } from './middlewares/populateUserAccess'
import { getErrorMessage } from './tools/error'
import path from 'path'
import fs from 'fs'
import { Schemas } from './Schemas'
import { Controllers } from './Controllers'
import { Hooks } from './Hooks'
import { checkAccess as doCheckAccess } from './tools/acl'
import { I18n } from './I18n'
import { populateLang } from './middlewares/populateLang'
import SwarmHealthController from './controllers/SwarmHealthController'
import { Server } from 'socket.io'
import fastifySocketIO from 'fastify-socket.io'
import { Socket } from './Socket'

const main = require('require-main-filename')()

declare module 'fastify' {
  interface FastifyRequest {
    userAccess: string[]
    lang: string
    $t: (
      text: string,
      replacements?: { [key: string]: any },
      lang?: string | null,
      namespace?: string
    ) => string
  }

  interface FastifyInstance {
    io: Server
  }
}

export class Swarm {
  private fastifyInstance: FastifyInstance
  options: SwarmOptions
  schemas: Schemas
  controllers: Controllers
  hooks: Hooks
  i18n: I18n
  isShutingDown: boolean

  constructor (conf: Partial<SwarmOptions>) {
    this.options = {
      logLevel: 'error',
      verbose: false,
      getUserAccess: (_: FastifyRequest) => null,
      prefix: '/',
      baseUrl: 'http://localhost:8080',
      schemasFolder: './schemas',
      defaultVersion: 'v1',

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
      oauth2Scopes: {},

      defaultLanguage: 'en',
      languages: ['en'],

      http2: false,
      sslKeyPath: '',
      sslCertPath: '',

      injectors: [],

      socketOnConnection: [],
      socketIoOptions: {
        cors: {
          origin: true,
          credentials: true
        }
      },

      ...conf
    }
    this.fastifyInstance = fastify({
      logger: this.options.verbose,
      http2: this.options.http2,
      https: this.options.http2
        ? {
            allowHTTP1: true,
            key: fs.readFileSync(this.options.sslKeyPath),
            cert: fs.readFileSync(this.options.sslCertPath)
          }
        : null
    } as FastifyHttpOptions<RawServerDefault, FastifyBaseLogger>)
    this.schemas = new Schemas(this)
    this.controllers = new Controllers(this)
    this.hooks = new Hooks(this)
    this.i18n = new I18n(this)
    process.env.SWARM_OPTIONS = JSON.stringify(this.options)

    // Socket.io
    this.fastifyInstance.register(fastifySocketIO, this.options.socketIoOptions)

    // Handle health
    this.isShutingDown = false
    this.controllers.add(SwarmHealthController)
  }

  onSocketConnection (cb: (socket: any) => void) {
    this.options.socketOnConnection.push(cb)
  }

  get fastify () {
    return this.fastifyInstance
  }

  getOption (key: keyof SwarmOptions) {
    return this.options[key]
  }

  setOption (key: keyof SwarmOptions, value: any) {
    ;(this.options as any)[key] = value
    process.env.SWARM_OPTIONS = JSON.stringify(this.options)
  }

  appendOption (key: keyof SwarmOptions, value: any) {
    this.options[key].push(value)
    process.env.SWARM_OPTIONS = JSON.stringify(this.options)
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

  checkAccess (
    request: FastifyRequest,
    requiredAccess: string | string[] | null = null
  ): void {
    doCheckAccess(request, requiredAccess)
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

    // Decorate fastify instance to handle I18n
    const _this = this
    this.fastifyInstance.decorateRequest('lang', this.options.defaultLanguage)
    this.fastifyInstance.addHook('preHandler', populateLang(this.options))
    this.fastifyInstance.decorateRequest(
      '$t',
      function (
        text: string,
        replacements: { [key: string]: any } = {},
        lang: string | null = null,
        namespace: string = 'app'
      ) {
        let str = _this.i18n.translate(namespace, lang ?? this.lang, text)

        for (let key in replacements) {
          str = str.replace(new RegExp(`{${key}}`, 'g'), replacements[key])
        }

        return str
      }
    )

    // Decorate fastify instance to handle ACL
    this.fastifyInstance.decorateRequest('userAccess', null)
    this.fastifyInstance.addHook(
      'preHandler',
      createUserAccessMiddleware(this.options.getUserAccess)
    )

    // Register found controllers
    await this.hooks.run('preRegister')
    this.controllers.register()
    await this.hooks.run('postRegister')

    await this.hooks.run('preListen')
    // Open connection
    try {
      await this.fastifyInstance.listen({ port, host })
      Socket.setup(this, this.fastifyInstance.io)
      await this.hooks.run('postListen')
      this.log('info', `Listening to ${host}:${port}`)
    } catch (err) {
      console.log(`Cannot listen to ${host}:${port}: ${getErrorMessage(err)}`)
      process.exit(1)
    }
  }

  use (plugin: any, options: any = {}): void {
    plugin.setup(this, options)
  }
}
