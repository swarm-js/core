import { SwarmScopes } from './SwarmScopes'
import { SwarmServer } from './SwarmServer'

export interface SwarmOptions {
  logLevel: string
  getUserAccess: any
  monitor: boolean
  monitorAccess: string | string[]
  prefix: string
  schemasFolder: string

  // Related to Swagger documentation
  documentationAccess: string | string[] | null
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
}
