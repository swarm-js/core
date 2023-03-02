/**
 * Decorator to configure HTTP route to use. Can only be used on methods.
 *
 * @param route   HTTP Route.
 * @returns       The decorator function.
 */
export function route (route: string): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    target.prototype.swarm.methods[propertyKey].route = route
  }
}
