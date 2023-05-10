/**
 * Decorator to add description to Swagger documentation. Can be used on methods, or controllers.
 *
 * @param description   Description.
 * @returns             The decorator function.
 */
export function Description (description: string): any {
  return (target: any, propertyKey: string): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    if (propertyKey) {
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      target.prototype.swarm.methods[propertyKey].description = description
    } else {
      target.prototype.swarm.description = description
    }
  }
}
