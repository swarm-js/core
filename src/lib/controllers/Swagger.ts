import { FastifyRequest } from 'fastify'
import { method, prefix, route } from '../decorators'
import { checkAccess } from '../tools/acl'

let swarm: any = null

@prefix('/', true)
export default class Swagger {
  static init (swarmInstance: any) {
    swarm = swarmInstance
  }

  @method('GET')
  @route('/:version/swagger.json')
  static async getSwaggerFile (request: FastifyRequest) {
    checkAccess(request, swarm.options.documentationAccess)

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
     *   $ref: '#/components/MySchema/properties/foo
     * }
     *
     * And we'll embed every single shared schema in components.
     *
     * (NB: for schema names, replace / by _)
     */

    return {
      implemented: false
    }
  }
}
