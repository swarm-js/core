import { FastifyRequest } from 'fastify'
import { Forbidden } from 'http-errors'

export function checkAccess(
  request: FastifyRequest,
  allowedAccess: string | string[] = []
) {
  if (allowedAccess instanceof Array && allowedAccess.length === 0) return true

  if (allowedAccess instanceof Array === false)
    allowedAccess = [<string>allowedAccess]

  for (const a of allowedAccess) {
    if ((request.userAccess ?? []).includes(a)) return true
  }

  throw new Forbidden()
}
