import { FastifyRequest } from 'fastify'
import { Forbidden } from 'http-errors'

export function checkAccess(
  request: FastifyRequest,
  requiredAccess: string | string[] | null = null
) {
  // User is not logged (userAccess null) and we require auth (requiredAccess not null) -> We refuse access
  if (request.userAccess === null && requiredAccess !== null)
    throw new Forbidden()

  // We require nothing, we allow access
  if (requiredAccess === null) return true

  // We have an empty array of required accesses -> we want to check if the user is logged in
  // At this step, the user would have been ejected by first condition
  if (requiredAccess instanceof Array && requiredAccess.length === 0)
    return true

  // Ensure requiredAccess to be an array of strings
  if (requiredAccess instanceof Array === false && requiredAccess !== null)
    requiredAccess = [<string>requiredAccess]

  // Apply params
  const params: any = request.params ?? {}
  requiredAccess = (requiredAccess as string[]).map((access: string) => {
    for (let key in params) {
      access.replace(new RegExp(`{${key}}`, 'g'), params[key])
    }
    return access
  })

  console.log('checkAccess', request.userAccess, requiredAccess)

  // If the logged in user have access, we allow access
  for (const a of requiredAccess) {
    if ((request.userAccess ?? []).includes(a)) return true
  }

  // If no requiredAccess has been found, we refuse access
  throw new Forbidden()
}
