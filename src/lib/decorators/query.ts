import { SwarmParameter } from '../interfaces'

export function query (
  name: string,
  schema: any,
  description: string = ''
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    if (target.prototype.swarm.methods[propertyKey].query === undefined)
      target.prototype.swarm.methods[propertyKey].query = []
    target.prototype.swarm.methods[propertyKey].query =
      target.prototype.swarm.methods[propertyKey].query.filter(
        (r: SwarmParameter) => r.name !== name
      )
    target.prototype.swarm.methods[propertyKey].query.push({
      name,
      schema,
      description
    })
  }
}
