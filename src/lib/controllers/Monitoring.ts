import dayjs from 'dayjs'
import {
  description,
  method,
  parameter,
  prefix,
  route,
  title
} from '../decorators'
import { checkAccess } from '../tools/acl'

let swarm: any = null
let startDate: number | null = null

@title('Monitoring')
@description('Handles Swarm instance monitoring stats')
@prefix('/__monitoring__')
export default class Monitoring {
  static init (swarmInstance: any) {
    swarm = swarmInstance
    startDate = +new Date()
  }

  @method('GET')
  @route('/stats/:filter')
  @title('Retrieve statistics from Swarm instance')
  @parameter(
    'filter',
    { type: 'string' },
    'Method name as in controller@method. Use "all" to retrieve global statistics.'
  )
  static async getStats (request: any) {
    checkAccess(request, swarm.options.monitorAccess)

    const days: number = +(request.query.days ?? 30)
    const minDate: string = dayjs().subtract(days, 'days').format('YYYY-MM-DD')

    let ret: any = {
      uptime: +new Date() - (startDate ?? +new Date()),
      global: {
        calls: 0,
        duration: {
          avg: 0,
          min: null,
          max: null
        }
      },
      perDay: {}
    }

    for (const item of swarm.getMonitorData()) {
      if (
        request.params.filter !== 'all' &&
        request.params.filter !== `${item.controllerName}@${item.methodName}`
      )
        continue

      ret.global.calls += item.calls
      ret.global.duration.avg += item.totalDuration
      if (
        ret.global.duration.min === null ||
        item.minDuration < ret.global.duration.min
      )
        ret.global.duration.min = item.minDuration
      if (
        ret.global.duration.max === null ||
        item.maxDuration > ret.global.duration.max
      )
        ret.global.duration.max = item.maxDuration

      for (let day of Object.keys(item.perDay)) {
        if (day < minDate) continue

        if (ret.perDay[day] === undefined)
          ret.perDay[day] = {
            calls: 0,
            duration: {
              avg: 0,
              min: null,
              max: null
            }
          }

        ret.perDay[day].calls += item.calls
        ret.perDay[day].duration.avg += item.totalDuration
        if (
          ret.perDay[day].duration.min === null ||
          item.minDuration < ret.perDay[day].duration.min
        )
          ret.perDay[day].duration.min = item.minDuration
        if (
          ret.perDay[day].duration.max === null ||
          item.maxDuration > ret.perDay[day].duration.max
        )
          ret.perDay[day].duration.max = item.maxDuration
      }
    }

    ret.global.duration.avg /= ret.global.calls
    for (let day in ret.perDay) {
      ret.perDay[day].duration.avg /= ret.perDay[day].calls
    }

    return ret
  }
}
