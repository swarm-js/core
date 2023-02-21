export function accepts (accepts: any): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (typeof accepts === 'string' || accepts instanceof Array) {
      if (target.prototype.swarm === undefined) target.prototype.swarm = {}
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].accepts = accepts
    }
  }
}
