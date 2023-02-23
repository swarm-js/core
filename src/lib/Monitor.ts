import dayjs from 'dayjs'
import { SwarmController, SwarmMethod, SwarmMonitorData } from './interfaces'
import { Swarm } from './Swarm'

export class Monitor {
  private swarm: Swarm
  private monitorData: Map<string, SwarmMonitorData> = new Map<
    string,
    SwarmMonitorData
  >()

  constructor (instance: Swarm) {
    this.swarm = instance
  }

  getData () {
    return this.monitorData.values()
  }

  saveData (controller: SwarmController, method: SwarmMethod, duration: number) {
    if (!this.swarm.options.monitor) return

    let data: SwarmMonitorData | undefined = this.monitorData.get(
      `${controller.name}@${method.name}`
    )
    if (data === undefined)
      data = {
        controllerName: controller.name,
        methodName: method.name,
        method: method.method,
        path: method.fullRoute,
        calls: 0,
        totalDuration: 0,
        minDuration: null,
        maxDuration: null,
        perDay: {}
      }
    data.calls++
    data.totalDuration += duration
    if (data.minDuration === null || data.minDuration > duration)
      data.minDuration = duration
    if (data.maxDuration === null || data.maxDuration < duration)
      data.maxDuration = duration

    const today = dayjs().format('YYYY-MM-DD')
    if (data.perDay[today] === undefined)
      data.perDay[today] = {
        calls: 0,
        totalDuration: 0,
        minDuration: null,
        maxDuration: null
      }
    data.perDay[today].calls++
    data.perDay[today].totalDuration += duration
    if (data.minDuration === null || data.perDay[today].minDuration > duration)
      data.perDay[today].minDuration = duration
    if (
      data.perDay[today].maxDuration === null ||
      data.perDay[today].maxDuration < duration
    )
      data.perDay[today].maxDuration = duration
    this.monitorData.set(`${controller.name}@${method.name}`, data)
  }
}
