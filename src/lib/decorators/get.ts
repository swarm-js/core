/**
 * Decorator to the route for a GET request. Can only be used on methods.
 *
 * @param path    URL path.
 * @returns       The decorator function.
 */
export function Get (path: string = '/'): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    target.prototype.swarm.methods[propertyKey].method = 'GET'
    target.prototype.swarm.methods[propertyKey].route = path
  }
}
