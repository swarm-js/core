import { Swarm } from './Swarm'
import fs from 'fs/promises'
import path from 'path'
import {
  SwarmController,
  SwarmMethod,
  SwarmParameter,
  SwarmQuery,
  SwarmReturn
} from './interfaces'
import { getErrorMessage } from './tools/error'

export class Schemas {
  private swarm: Swarm
  private schemas: any = {}

  constructor (instance: Swarm) {
    this.swarm = instance
  }

  getSwaggerComponents () {
    return Object.fromEntries(
      Object.entries(this.schemas).map((s: any) => [
        s[0].replace(/\//g, '_').replace('.json', ''),
        s[1]
      ])
    )
  }

  /**
   * $ref : when using shared schema in fastify, user can use the following syntax:
   *
   * {
   *   $ref: 'MySchema.json#/properties/foo'
   * }
   *
   * For Swagger, we need to transform them into :
   *
   * {
   *   $ref: '#/components/schemas/MySchema/properties/foo
   * }
   *
   * And we'll embed every single shared schema in components.
   *
   * (NB: for schema names, replace / by _)
   */
  private refToSwagger (o: any): any {
    for (let key in o) {
      if (typeof o[key] === 'object' && o[key] !== null) {
        o[key] = this.refToSwagger(o[key])
      } else if (key === '$ref') {
        const ref = o[key].split('#')
        o[key] = `#/components/schemas/${ref[0]
          .replace(/\//g, '_')
          .replace('.json', '')}${ref[1] ?? ''}`
      }
    }
    return o
  }

  get (name: string) {
    return this.schemas[name]
  }

  async load (path: string, name: string) {
    try {
      const content: string = await fs.readFile(path, { encoding: 'utf8' })
      this.schemas[name] = this.refToSwagger(JSON.parse(content))
      this.swarm.log('info', `Found schema ${name}`)
      const fastifySchema = JSON.parse(content)
      fastifySchema.$id = name
      this.swarm.fastify.addSchema(fastifySchema)
    } catch (err: any) {
      this.swarm.log(
        'error',
        `Cannot load schema ${path}: ${getErrorMessage(err)}`
      )
    }
  }

  async loadDir (dir: string, prefix: string = ''): Promise<void> {
    try {
      const files = await fs.readdir(dir)
      for (let file of files) {
        const filepath: string = path.join(dir, file)
        const stat = await fs.lstat(filepath)
        if (stat.isFile() && file.substring(file.length - 5) === '.json')
          await this.load(
            filepath,
            `${prefix.length ? prefix + '/' : ''}${file}`
          )
        else if (stat.isDirectory()) {
          await this.loadDir(
            filepath,
            `${prefix}${prefix.length ? '/' : ''}${file}`
          )
        }
      }
    } catch (err: any) {
      this.swarm.log('error', `Cannot load dir ${dir}: ${getErrorMessage(err)}`)
    }
  }

  generate (controller: SwarmController, method: SwarmMethod): any {
    const schema: any = {}

    if (method.accepts !== null) {
      let accepts = method.accepts.schema
      if (accepts instanceof Array === false) accepts = [accepts]
      accepts = accepts.map((a: any) =>
        typeof a === 'string' ? { $ref: `${a}.json#` } : a
      )

      switch (accepts.length) {
        case 0:
          break
        case 1:
          schema.body = accepts[0]
          break
        default:
          schema.body = {
            allOf: accepts
          }
          break
      }
    }

    const params = [
      ...(controller.parameters ?? []),
      ...(method.parameters ?? [])
    ]
      .map((param: SwarmParameter) => [
        param.name,
        typeof param.schema === 'string'
          ? { $ref: `${param.schema}.json#` }
          : param.schema
      ])
      .filter(a => [null, undefined].includes(a[1]) !== true)
    if (params.length)
      schema.params = {
        type: 'object',
        properties: Object.fromEntries(params)
      }

    const queries = method.query
      .map((query: SwarmQuery) => [
        query.name,
        typeof query.schema === 'string'
          ? { $ref: `${query.schema}.json#` }
          : query.schema
      ])
      .filter(a => [null, undefined].includes(a[1]) !== true)
    if (queries.length)
      schema.querystring = {
        type: 'object',
        properties: Object.fromEntries(queries)
      }

    const returns = method.returns
      .map((ret: SwarmReturn) => [
        ret.code,
        typeof ret.schema === 'string'
          ? { $ref: `${ret.schema}.json#` }
          : ret.schema
      ])
      .filter(a => [null, undefined].includes(a[1]) !== true)
    if (returns.length) schema.response = Object.fromEntries(returns)

    return schema
  }
}
