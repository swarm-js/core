import { SwarmScopes } from './SwarmScopes'
import { SwarmServer } from './SwarmServer'

export interface SwarmOptions {
  logLevel: string
  verbose: boolean
  getUserAccess: any
  baseUrl: string
  prefix: string
  schemasFolder: string
  defaultVersion: string

  // Related to Swagger documentation
  servers: SwarmServer[]
  title: string
  description: string

  // Authorization
  authType: null | 'basic' | 'bearer' | 'apiKey' | 'openId' | 'oauth2'
  apiKeyLocation: null | 'header' | 'query' | 'cookie'
  apiKeyName: null | string
  bearerFormat: null | string
  openIdConnectUrl: null | string
  oauth2AuthorizationUrl: null | string
  oauth2Flow:
    | null
    | 'authorizationCode'
    | 'implicit'
    | 'password'
    | 'clientCredentials'
  oauth2TokenUrl: null | string
  oauth2RefreshUrl: null | string
  oauth2Scopes: SwarmScopes

  // I18n
  defaultLanguage: string
  languages: string[]

  // HTTPS
  http2: boolean
  sslKeyPath: string
  sslCertPath: string
}
