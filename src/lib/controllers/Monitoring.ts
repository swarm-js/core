import dayjs from 'dayjs'
import {
  Description,
  Get,
  Parameter,
  Prefix,
  Returns,
  Title
} from '@swarmjs/decorators'
import { Swarm } from '../Swarm'
import { checkAccess } from '../tools/acl'

let swarm: Swarm
let startDate: number | null = null

@Title('Monitoring')
@Description('Handles Swarm instance monitoring stats')
@Prefix('/__monitoring__')
export default class Monitoring {
  static init (swarmInstance: Swarm) {
    swarm = swarmInstance
    startDate = +new Date()
  }

  @Get('/stats/:filter')
  @Title('Retrieve statistics from Swarm instance')
  @Parameter(
    'filter',
    { type: 'string' },
    'Method name as in controller@method. Use "all" to retrieve global statistics.'
  )
  @Returns(
    200,
    {
      type: 'object',
      properties: {
        uptime: {
          type: 'number',
          description: 'Number of milliseconds since last reboot'
        },
        global: {
          type: 'object',
          properties: {
            calls: { type: 'number' },
            duration: {
              type: 'object',
              properties: {
                avg: { type: 'number' },
                min: { type: 'number' },
                max: { type: 'number' }
              }
            }
          }
        },
        perDay: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              calls: { type: 'number' },
              duration: {
                type: 'object',
                properties: {
                  avg: { type: 'number' },
                  min: { type: 'number' },
                  max: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    'Statistics'
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

    for (const item of swarm.monitor.getData()) {
      if (
        request.params.filter !== 'all' &&
        request.params.filter !== `${item.controllerName}@${item.methodName}`
      )
        continue

      ret.global.calls += item.calls
      ret.global.duration.avg += item.totalDuration
      if (
        item.minDuration !== null &&
        (ret.global.duration.min === null ||
          item.minDuration < ret.global.duration.min)
      )
        ret.global.duration.min = item.minDuration
      if (
        item.maxDuration !== null &&
        (ret.global.duration.max === null ||
          item.maxDuration > ret.global.duration.max)
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
          item.minDuration !== null &&
          (ret.perDay[day].duration.min === null ||
            item.minDuration < ret.perDay[day].duration.min)
        )
          ret.perDay[day].duration.min = item.minDuration
        if (
          item.maxDuration !== null &&
          (ret.perDay[day].duration.max === null ||
            item.maxDuration > ret.perDay[day].duration.max)
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
