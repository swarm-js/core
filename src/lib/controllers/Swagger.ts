import {
  Description,
  Get,
  Parameter,
  Prefix,
  Returns,
  Title
} from '@swarmjs/decorators'
import { SwarmParameter, SwarmQuery, SwarmReturn } from '../interfaces'
import { Swarm } from '../Swarm'
import { checkAccess } from '../tools/acl'

let swarm: Swarm
let cache: any = {}

@Title('Swagger')
@Description('Handles API documentation display')
@Prefix('/', true)
export default class Swagger {
  static init (swarmInstance: Swarm) {
    swarm = swarmInstance
  }

  static schemaNameToSwagger (name: string) {
    return name.replace(/\//g, '_')
  }

  @Title('Get Swagger documentation file')
  @Get('/:version/swagger.json')
  @Parameter('version', { type: 'string' }, 'The API version, defaults to : v1')
  @Returns(
    200,
    { type: 'object', additionalProperties: true },
    'Swagger JSON file'
  )
  static async getSwaggerFile (request: any) {
    checkAccess(request, swarm.options.documentationAccess)

    if (cache[request.params.version] === undefined) {
      const ret: any = {
        openapi: '3.0.0',
        info: {
          title: swarm.options.title,
          description: swarm.options.description,
          version: request.params.version
        },
        servers: swarm.options.servers ?? [],
        components: {
          schemas: swarm.schemas.getSwaggerComponents()
        },
        paths: {},
        tags: []
      }

      switch (swarm.options.authType) {
        case 'basic':
          ret.components.securitySchemes = {
            auth: {
              type: 'http',
              scheme: 'basic'
            }
          }
          break
        case 'bearer':
          ret.components.securitySchemes = {
            auth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: swarm.options.bearerFormat
            }
          }
          break
        case 'apiKey':
          ret.components.securitySchemes = {
            auth: {
              type: 'apiKey',
              in: swarm.options.apiKeyLocation,
              name: swarm.options.apiKeyName
            }
          }
          break
        case 'openId':
          ret.components.securitySchemes = {
            auth: {
              type: 'openIdConnect',
              openIdConnectUrl: swarm.options.openIdConnectUrl
            }
          }
          break
        case 'oauth2':
          switch (swarm.options.oauth2Flow) {
            case 'authorizationCode':
              ret.components.securitySchemes = {
                auth: {
                  type: 'oauth2',
                  flows: {
                    authorizationCode: {
                      authorizationUrl: swarm.options.oauth2AuthorizationUrl,
                      tokenUrl: swarm.options.oauth2TokenUrl,
                      refreshUrl: swarm.options.oauth2RefreshUrl,
                      scopes: swarm.options.oauth2Scopes
                    }
                  }
                }
              }
              break
            case 'implicit':
              ret.components.securitySchemes = {
                auth: {
                  type: 'oauth2',
                  flows: {
                    implicit: {
                      authorizationUrl: swarm.options.oauth2AuthorizationUrl,
                      refreshUrl: swarm.options.oauth2RefreshUrl,
                      scopes: swarm.options.oauth2Scopes
                    }
                  }
                }
              }
              break
            case 'password':
              ret.components.securitySchemes = {
                auth: {
                  type: 'oauth2',
                  flows: {
                    password: {
                      tokenUrl: swarm.options.oauth2TokenUrl,
                      refreshUrl: swarm.options.oauth2RefreshUrl,
                      scopes: swarm.options.oauth2Scopes
                    }
                  }
                }
              }
              break
            case 'clientCredentials':
              ret.components.securitySchemes = {
                auth: {
                  type: 'oauth2',
                  flows: {
                    clientCredentials: {
                      tokenUrl: swarm.options.oauth2TokenUrl,
                      refreshUrl: swarm.options.oauth2RefreshUrl,
                      scopes: swarm.options.oauth2Scopes
                    }
                  }
                }
              }
              break
          }
          break
      }

      for (let controller of swarm.controllers.list) {
        ret.tags.push({
          name: controller.title ?? controller.name,
          description: controller.description
        })

        for (let method of controller.methods) {
          if (
            method.version.includes(request.params.version) === false &&
            !controller.root
          )
            continue
          const path = `${controller.root ? '' : '/' + request.params.version}${
            method.fullRoute
          }`
            .split('/')
            .map(p => (p.substring(0, 1) === ':' ? `{${p.substring(1)}}` : p))
            .join('/')
          const verb = (method.method as string).toLowerCase()

          if (ret.paths[path] === undefined) ret.paths[path] = {}

          ret.paths[path][verb] = {
            tags: [controller.title ?? controller.name],
            summary: method.title,
            description: method.description,
            operationId: `${controller.name}@${method.name}`,
            security:
              controller.access !== null || method.access !== null
                ? [
                    {
                      auth:
                        method.access !== null
                          ? method.access
                          : controller.access
                    }
                  ]
                : undefined,
            parameters: [
              ...controller.parameters.map((param: SwarmParameter) => ({
                name: param.name,
                in: 'path',
                schema: !param.schema
                  ? undefined
                  : typeof param.schema === 'string'
                  ? {
                      $ref: `#/components/schemas/${Swagger.schemaNameToSwagger(
                        param.schema
                      )}`
                    }
                  : param.schema,
                required: true
              })),
              ...method.parameters.map((param: SwarmParameter) => ({
                name: param.name,
                in: 'path',
                schema: !param.schema
                  ? undefined
                  : typeof param.schema === 'string'
                  ? {
                      $ref: `#/components/schemas/${Swagger.schemaNameToSwagger(
                        param.schema
                      )}`
                    }
                  : param.schema,
                required: true
              })),
              ...method.query.map((param: SwarmQuery) => ({
                name: param.name,
                in: 'query',
                schema: !param.schema
                  ? undefined
                  : typeof param.schema === 'string'
                  ? {
                      $ref: `#/components/schemas/${Swagger.schemaNameToSwagger(
                        param.schema
                      )}`
                    }
                  : param.schema,
                required: false
              }))
            ],
            requestBody:
              ['post', 'put', 'patch'].includes(verb) && method.accepts
                ? {
                    required: true,
                    content: {
                      [method.accepts.mimeType]: {
                        schema: !method.accepts.schema
                          ? undefined
                          : typeof method.accepts.schema === 'string'
                          ? {
                              $ref: `#/components/schemas/${Swagger.schemaNameToSwagger(
                                method.accepts.schema
                              )}`
                            }
                          : method.accepts.schema
                      }
                    }
                  }
                : undefined,
            responses: Object.fromEntries(
              method.returns
                .map((r: SwarmReturn): any => {
                  return [
                    r.code,
                    {
                      description: r.description,
                      content: {
                        [r.mimeType]: {
                          schema: !r.schema
                            ? undefined
                            : typeof r.schema === 'string'
                            ? {
                                $ref: `#/components/schemas/${Swagger.schemaNameToSwagger(
                                  r.schema
                                )}`
                              }
                            : r.schema
                        }
                      }
                    }
                  ]
                })
                .filter(r => r !== null)
            )
          }
        }
      }

      cache[request.params.version] = ret
    }

    return cache[request.params.version]
  }

  @Title('Display Swagger UI for this API version')
  @Get('/:version')
  @Parameter('version', { type: 'string' }, 'The API version, defaults to : v1')
  @Returns(200, { type: 'string' }, 'Swagger UI HTML code', 'text/html')
  static async getSwaggerUi (request: any, reply: any) {
    checkAccess(request, swarm.options.documentationAccess)

    reply.type('text/html').send(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Swagger UI</title>
        <link rel="stylesheet" type="text/css" href="/swagger/swagger-ui.css" />
        <link rel="stylesheet" type="text/css" href="/swagger/index.css" />
        <link rel="icon" type="image/png" href="/swagger/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/swagger/favicon-16x16.png" sizes="16x16" />
      </head>
    
      <body>
        <div id="swagger-ui"></div>
        <script src="/swagger/swagger-ui-bundle.js" charset="UTF-8"> </script>
        <script src="/swagger/swagger-ui-standalone-preset.js" charset="UTF-8"> </script>
        <script src="/${request.params.version}/swagger-initializer.js" charset="UTF-8"> </script>
      </body>
    </html>
    `)
  }

  @Title('Get Swagger UI initialization file')
  @Get('/:version/swagger-initializer.js')
  @Parameter('version', { type: 'string' }, 'The API version, defaults to : v1')
  @Returns(
    200,
    { type: 'string' },
    'Swagger UI initialization script',
    'text/javascript'
  )
  static async getInitializerFile (request: any, reply: any) {
    checkAccess(request, swarm.options.documentationAccess)

    reply.type('text/javascript').send(`window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: "/${request.params.version}/swagger.json",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  });
};
`)
  }
}
