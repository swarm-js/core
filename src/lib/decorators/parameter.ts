import { SwarmParameter } from '../interfaces'

export function parameter (
  name: string,
  schema: string,
  description: string = ''
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods[propertyKey].methods === undefined)
      target.prototype.swarm.methods[propertyKey].methods = {}
    if (
      target.prototype.swarm.methods[propertyKey].methods[propertyKey] ===
      undefined
    )
      target.prototype.swarm.methods[propertyKey].methods[propertyKey] = {}

    if (target.prototype.swarm.methods[propertyKey].parameters === undefined)
      target.prototype.swarm.methods[propertyKey].parameters = []
    target.prototype.swarm.methods[propertyKey].parameters =
      target.prototype.swarm.methods[propertyKey].parameters.filter(
        (r: SwarmParameter) => r.name !== name
      )
    target.prototype.swarm.methods[propertyKey].parameters.push({
      name,
      schema,
      description
    })
  }
}
