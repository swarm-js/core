import { FastifyReply, FastifyRequest } from 'fastify'
import {
  accepts,
  description,
  prefix,
  returns,
  Swarm,
  title,
  method,
  route,
  access,
  query,
  version
} from '../'

@title('Users')
@description('Handles users related actions')
@prefix('/users')
class UsersController {
  @title('Login a user')
  @description('Validates user credentials and returns a JWT token')
  @method('POST')
  @route('/login')
  @accepts('Login')
  @access('user')
  @query('source', { type: 'string' }, 'Auth source')
  @returns(200, 'JWT', 'A JWT token used to authenticate user requests')
  @returns(403, 'Error', 'Credentials are invalid')
  @version(['v1', 'v2'])
  static async login (request: FastifyRequest, reply: FastifyReply) {
    console.log(request, reply)
    return {
      status: 'ok'
    }
  }
}

const app = new Swarm({
  logLevel: 'info',
  monitor: true,
  authType: 'openId',
  openIdConnectUrl: 'http://sss.www.com',
  title: 'My API',
  description: 'A super API made with SwarmJS'
})

app.controllers.add(UsersController)

app.listen(8080)
