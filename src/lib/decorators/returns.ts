import { JSONSchema7 } from '../interfaces/JsonSchema'

/**
 * Decorator to filter returned data. Can only be used on methods.
 *
 * @param code          HTTP code. Can be "2xx" for all 2xx codes, for exemple.
 * @param schema        JSON Schema or local schema name.
 * @param description   Description.
 * @param mimeType      Returned mime-type.
 * @returns             The decorator function.
 */
export function Returns (
  code: number | string,
  schema: JSONSchema7 | string | null,
  description: string = '',
  mimeType: string = 'application/json'
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    if (target.prototype.swarm.methods[propertyKey].returns === undefined)
      target.prototype.swarm.methods[propertyKey].returns = []
    target.prototype.swarm.methods[propertyKey].returns =
      target.prototype.swarm.methods[propertyKey].returns.filter(
        (r: any) => r.code !== code
      )
    target.prototype.swarm.methods[propertyKey].returns.push({
      code,
      schema,
      description,
      mimeType
    })
  }
}
