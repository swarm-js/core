import { JSONSchema7 } from '../interfaces/JsonSchema'

export function Query(
  name: string,
  schema: JSONSchema7 | string | null,
  description?: string
): any
export function Query(key?: string): any

/**
 * Decorator to configure a URL query parameter. Can only be used on methods or parameters.
 *
 * @param name          Query parameter name.
 * @param schema        JSON Schema or local schema name.
 * @param description   Description.
 * @returns             The decorator function.
 */
export function Query (
  name: string = '',
  schema: JSONSchema7 | string | null = null,
  description: string = ''
): any {
  return (
    target: any,
    propertyKey: string,
    idx: PropertyDescriptor | number
  ): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    if (typeof idx === 'number') {
      if (target.prototype.swarm.methods[propertyKey].args === undefined)
        target.prototype.swarm.methods[propertyKey].args = []
      target.prototype.swarm.methods[propertyKey].args.push({
        idx: idx,
        type: 'query',
        key: name
      })
    } else {
      if (target.prototype.swarm.methods[propertyKey].query === undefined)
        target.prototype.swarm.methods[propertyKey].query = []
      target.prototype.swarm.methods[propertyKey].query =
        target.prototype.swarm.methods[propertyKey].query.filter(
          (r: any) => r.name !== name
        )
      target.prototype.swarm.methods[propertyKey].query.push({
        name,
        schema,
        description
      })
    }
  }
}
