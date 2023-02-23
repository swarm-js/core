import { SwarmReturn } from '../interfaces'

export function returns (
  code: number | string,
  schema: any,
  description: string = '',
  mimeType: string = 'application/json'
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    if (target.prototype.swarm.methods[propertyKey].returns === undefined)
      target.prototype.swarm.methods[propertyKey].returns = []
    target.prototype.swarm.methods[propertyKey].returns =
      target.prototype.swarm.methods[propertyKey].returns.filter(
        (r: SwarmReturn) => r.code !== code
      )
    target.prototype.swarm.methods[propertyKey].returns.push({
      code,
      schema,
      description,
      mimeType
    })
  }
}
