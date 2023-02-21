export interface SwarmMonitorData {
  controllerName: string
  methodName: string
  method: string | null
  path: string
  calls: number
  totalDuration: number
  minDuration: number | null
  maxDuration: number | null
  perDay: any
}
