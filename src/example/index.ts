import { FastifyReply, FastifyRequest } from 'fastify'
import {
  accepts,
  description,
  prefix,
  returns,
  Swarm,
  title,
  method,
  route
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
  @returns(200, 'JWT', 'A JWT token used to authenticate user requests')
  @returns(403, 'Error', 'Credentials are invalid')
  static async login (request: FastifyRequest, reply: FastifyReply) {
    console.log(request, reply)
    return {
      status: 'ok'
    }
  }
}

const app = new Swarm({
  logLevel: 'debug',
  monitor: true
})

app.addController(UsersController)

app.listen(8080)
