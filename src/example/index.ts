import { FastifyReply, FastifyRequest } from 'fastify'
import {
  Accepts,
  Description,
  Post,
  Prefix,
  Query,
  Returns,
  Title,
  Version
} from '../lib/decorators'
import { Swarm } from '../'

@Title('Users')
@Description('Handles users related actions')
@Prefix('/users')
class UsersController {
  @Title('Login a user')
  @Description('Validates user credentials and returns a JWT token')
  @Post('/login')
  @Accepts('Login')
  @Query('source', { type: 'string' }, 'Auth source')
  @Returns(200, 'JWT', 'A JWT token used to authenticate user requests')
  @Returns(403, 'Error', 'Credentials are invalid')
  @Version(['v1', 'v2'])
  static async login (request: FastifyRequest, reply: FastifyReply) {
    console.log(request, reply)
    console.log(request.$t('test'))
    return {
      status: 'ok'
    }
  }
}

const app = new Swarm({
  logLevel: 'debug',
  authType: 'openId',
  openIdConnectUrl: 'http://sss.www.com',
  title: 'My API',
  description: 'A super API made with SwarmJS'
})

app.controllers.add(UsersController)

app.listen(8080)
