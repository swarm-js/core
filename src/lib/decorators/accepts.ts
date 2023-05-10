import { JSONSchema7 } from '../interfaces/JsonSchema'

/**
 * Decorator to filter data input. Can be only used on methods.
 *
 * @param schema    JSON Schemas or local schema name. If multiple supplied, they will be merged with allOf.
 * @param mimeType  Accepted mime-type.
 * @returns         The decorator function.
 */
export function Accepts (
  schema: string | string[] | JSONSchema7 | JSONSchema7[],
  mimeType: string = 'application/json'
): any {
  return (target: any, propertyKey: string): void => {
    if (!propertyKey) return

    if (target.prototype.swarm === undefined) target.prototype.swarm = {}
    if (target.prototype.swarm.methods === undefined)
      target.prototype.swarm.methods = {}
    if (target.prototype.swarm.methods[propertyKey] === undefined)
      target.prototype.swarm.methods[propertyKey] = {}

    target.prototype.swarm.methods[propertyKey].accepts = { schema, mimeType }
  }
}
