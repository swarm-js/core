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

    return {
      implemented: false
    }
  }
}
