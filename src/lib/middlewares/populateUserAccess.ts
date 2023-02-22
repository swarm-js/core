import { FastifyRequest } from 'fastify'

export function createUserAccessMiddleware (func: any) {
  return async function (req: FastifyRequest) {
    if (func) req.userAccess = await func(req)
  }
}
