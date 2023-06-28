import { JSONSchema7 } from '../interfaces/JsonSchema'

export function Parameter(
  name: string,
  schema: JSONSchema7 | string | null,
  description?: string
): any
export function Parameter(key?: string): any

/**
 * Decorator to configure a route parameter. Can be used on methods or on controllers.
 *
 * @param name          Parameter name.
 * @param schema        JSON Schema or local schema name.
 * @param description   Description.
 * @returns             The decorator function.
 */
export function Parameter (
  name: string = '',
  schema: JSONSchema7 | string | null = null,
  description: string = ''
): any {
  return (
    target: any,
    propertyKey: string,
    idx: PropertyDescriptor | number
  ): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    if (propertyKey) {
      // Called on method
      if (target.prototype.swarm.methods === undefined)
        target.prototype.swarm.methods = {}
      if (target.prototype.swarm.methods[propertyKey] === undefined)
        target.prototype.swarm.methods[propertyKey] = {}

      if (typeof idx === 'number') {
        // Called on parameter
        if (target.prototype.swarm.methods[propertyKey].args === undefined)
          target.prototype.swarm.methods[propertyKey].args = []
        target.prototype.swarm.methods[propertyKey].args.push({
          idx: idx,
          type: 'params',
          key: name
        })
      } else {
        // Called on method
        if (
          target.prototype.swarm.methods[propertyKey].parameters === undefined
        )
          target.prototype.swarm.methods[propertyKey].parameters = []
        target.prototype.swarm.methods[propertyKey].parameters =
          target.prototype.swarm.methods[propertyKey].parameters.filter(
            (r: any) => r.name !== name
          )
        target.prototype.swarm.methods[propertyKey].parameters.push({
          name,
          schema,
          description
        })
      }
    } else {
      // Called on class
      if (target.prototype.swarm.parameters === undefined)
        target.prototype.swarm.parameters = []
      target.prototype.swarm.parameters =
        target.prototype.swarm.parameters.filter((r: any) => r.name !== name)
      target.prototype.swarm.parameters.push({
        name,
        schema,
        description
      })
    }
  }
}

export const Param = Parameter
