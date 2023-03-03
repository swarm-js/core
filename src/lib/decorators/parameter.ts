import { SwarmParameter } from '../interfaces'
import { JSONSchema7 } from '../interfaces/JsonSchema'

/**
 * Decorator to configure a route parameter. Can be used on methods or on controllers.
 *
 * @param name          Parameter name.
 * @param schema        JSON Schema or local schema name.
 * @param description   Description.
 * @returns             The decorator function.
 */
export function Parameter (
  name: string,
  schema: JSONSchema7 | string | null,
  description: string = ''
): any {
  return (target: any, propertyKey: string): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    if (propertyKey) {
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      if (target.prototype.swarm.methods[propertyKey].parameters === undefined)
        target.prototype.swarm.methods[propertyKey].parameters = []
      target.prototype.swarm.methods[propertyKey].parameters =
        target.prototype.swarm.methods[propertyKey].parameters.filter(
          (r: SwarmParameter) => r.name !== name
        )
      target.prototype.swarm.methods[propertyKey].parameters.push({
        name,
        schema,
        description
      })
    } else {
      if (target.prototype.swarm.parameters === undefined)
        target.prototype.swarm.parameters = []
      target.prototype.swarm.parameters =
        target.prototype.swarm.parameters.filter(
          (r: SwarmParameter) => r.name !== name
        )
      target.prototype.swarm.parameters.push({
        name,
        schema,
        description
      })
    }
  }
}
