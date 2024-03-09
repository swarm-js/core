import { Server } from 'socket.io'
import { Swarm } from './Swarm'
import mitt from 'mitt'

let ioInstance: Server | undefined = undefined
let bus = mitt()

export class Socket {
  static setup (swarm: Swarm, io: Server) {
    ioInstance = io
    io.on('connection', async (socket: any) => {
      for (let cb of swarm.getOption('socketOnConnection')) {
        await cb(socket, bus)
      }
    })
  }

  static get io (): Server {
    return ioInstance as Server
  }

  static on (name: string, cb: (data: any) => void) {
    bus.on(name, cb)
  }

  static off (name: string, cb: (data: any) => void) {
    bus.off(name, cb)
  }

  static emit (name: string, data: any = null) {
    bus.emit(name, data)
  }
}
