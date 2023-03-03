/**
 * Decorator to add title to Swagger documentation. Can be used on methods, or controllers.
 *
 * @param title   Title.
 * @returns       The decorator function.
 */
export function Title (title: string): any {
  return (target: any, propertyKey: string): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    if (propertyKey) {
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].title = title
    } else {
      target.prototype.swarm.title = title
    }
  }
}
