import { Server } from 'socket.io'
import { Swarm } from './Swarm'

let ioInstance: Server | undefined = undefined

export class Socket {
  static setup (swarm: Swarm, io: Server) {
    ioInstance = io
    io.on('connection', async (socket: any) => {
      for (let cb of swarm.getOption('socketOnConnection')) {
        await cb(socket)
      }
    })
  }

  get io (): Server {
    return ioInstance as Server
  }
}
