export function version(version: string | string[]): any {
  return (target: any, propertyKey: string): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    if (
      version instanceof Array === false &&
      ['string', 'number'].includes(typeof version)
    )
      version = [<string>version]
    if (version instanceof Array)
      version = version.map((a: number | string) => `${a}`)

    if (propertyKey) {
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].version = version
    } else {
      target.prototype.swarm.version = version
    }
  }
}
