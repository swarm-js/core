/**
 * Decorator to add reply to the method parameter
 *
 * @returns       The decorator function.
 */
export function Response (): any {
  return (target: any, propertyKey: string, parameterIndex: number): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}
    if (target.prototype.swarm.methods[propertyKey].args === undefined)
      target.prototype.swarm.methods[propertyKey].args = []
    target.prototype.swarm.methods[propertyKey].args.push({
      idx: parameterIndex,
      type: 'response'
    })
  }
}

export const Res = Response
