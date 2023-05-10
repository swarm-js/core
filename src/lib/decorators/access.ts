/**
 * Decorator to restrict user access. Can be used on methods, or controllers (apply a default configuration for all methods).
 *
 * @param access    Required scope or scopes.
 * @returns         The decorator function.
 */
export function Access (access: string | string[] = []): any {
  return (target: any, propertyKey: string): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (access instanceof Array === false) access = [access as string]

    if (propertyKey) {
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].access = access
    } else {
      target.prototype.swarm.access = access
    }
  }
}
