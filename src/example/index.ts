import {
  Body,
  Description,
  Header,
  Post,
  Prefix,
  Query,
  RawBody,
  Req,
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
  @Query('source', { type: 'string' }, 'Auth source')
  @Returns(200, 'JWT', 'A JWT token used to authenticate user requests')
  @Returns(403, 'Error', 'Credentials are invalid')
  @Version(['v1', 'v2'])
  @RawBody()
  static async login (
    @Req() req: any,
    @Body('email') email: any,
    @Header('content-type') contentType: string
  ) {
    console.log(req.body, email, contentType)
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

app.hooks.add('preShutdown', async () => {
  console.log('Hook start')
  await new Promise((res: any) => {
    setTimeout(_ => {
      res()
    }, 5000)
  })
  console.log('Hook done')
})

app.listen(8081)
