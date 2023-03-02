/**
 * Decorator to configure HTTP verb to use. Can only be used on methods.
 *
 * @param method  HTTP verb.
 * @returns       The decorator function.
 */
export function method (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    target.prototype.swarm.methods[propertyKey].method = method
  }
}
