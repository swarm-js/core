import { Description, Get, Prefix, Returns, Title } from '../decorators'

@Prefix('/health', true)
@Title('Healthcheck')
@Description('Adds a health check endpoint')
export default class SwarmHealthController {
  @Get('/')
  @Title('Is the API healthy ?')
  @Returns(
    200,
    { type: 'object', properties: { ok: { type: 'boolean' } } },
    'The API is healthy'
  )
  @Returns(500, { type: 'object', properties: {} }, 'The API is shutting down')
  static async healthy () {
    return { ok: true }
  }
}
