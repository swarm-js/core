import { method, prefix, route } from '../decorators'
import { SwarmParameter, SwarmQuery, SwarmReturn } from '../interfaces'
import { Swarm } from '../Swarm'
import { checkAccess } from '../tools/acl'

let swarm: Swarm
let cache: any = {}

@prefix('/', true)
export default class Swagger {
  static init (swarmInstance: Swarm) {
    swarm = swarmInstance
  }

  static schemaNameToSwagger (name: string) {
    return name.replace(/\//g, '_')
  }

  @method('GET')
  @route('/:version/swagger.json')
  static async getSwaggerFile (request: any) {
    checkAccess(request, swarm.options.documentationAccess)

    if (cache[request.params.version] === undefined) {
      const ret: any = {
        openapi: '3.0.0',
        info: {
          title: '', // TODO : add title
          description: '', // TODO : add description
          version: request.params.version
        },
        servers: [
          {
            url: 'https://path', // TODO : Add server,
            description: '' // TODO : Add description
          }
        ],
        components: {
          schemas: swarm.schemas.getSwaggerComponents()
        },
        paths: {}
      }

      for (let controller of swarm.controllers.list) {
        for (let method of controller.methods) {
          const path = `${controller.root ? '' : '/' + request.params.version}${
            method.fullRoute
          }`
            .split('/')
            .map(p => (p.substring(0, 1) === ':' ? `{${p.substring(1)}}` : p))
            .join('/')
          const verb = (method.method as string).toLowerCase()

          if (ret.paths[path] === undefined) ret.paths[path] = {}

          ret.paths[path][verb] = {
            tags: [controller.name],
            summary: method.title,
            description: method.description,
            operationId: `${controller.name}@${method.name}`,
            parameters: [
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
    /**
     * $ref : when using shared schema in fastify, user can use the following syntax:
     *
     * {
     *   $ref: 'MySchema#/properties/foo'
     * }
     *
     * For Swagger, we need to transform them into :
     *
     * {
     *   $ref: '#/components/schemas/MySchema/properties/foo
     * }
     *
     * And we'll embed every single shared schema in components.
     *
     * (NB: for schema names, replace / by _)
     */

    return cache[request.params.version]
  }
}
