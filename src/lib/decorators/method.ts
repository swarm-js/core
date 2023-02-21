export function method (method: string): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    method = method.toUpperCase()

    if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method) === false)
      return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    target.prototype.swarm.methods[propertyKey].method = method
  }
}
