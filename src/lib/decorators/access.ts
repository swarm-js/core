export function access (access: any): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (typeof access === 'string' || access instanceof Array) {
      if (target.prototype.swarm === undefined) target.prototype.swarm = {}
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].access = access
    }
  }
}
