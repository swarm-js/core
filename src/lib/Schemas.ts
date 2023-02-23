import { Swarm } from './Swarm'
import fs from 'fs/promises'
import path from 'path'
import {
  SwarmMethod,
  SwarmParameter,
  SwarmQuery,
  SwarmReturn
} from './interfaces'

export class Schemas {
  private swarm: Swarm
  private schemas: any = {}

  constructor (instance: Swarm) {
    this.swarm = instance
  }

  async load (path: string, name: string) {
    try {
      const content: string = await fs.readFile(path, { encoding: 'utf8' })
      this.schemas[name] = JSON.parse(content)
      this.swarm.log('info', `Found schema ${name}`)
      const fastifySchema = JSON.parse(content)
      fastifySchema.$id = name
      this.swarm.fastify.addSchema(fastifySchema)
    } catch {}
  }

  async loadDir (dir: string, prefix: string = ''): Promise<void> {
    try {
      const files = await fs.readdir(dir)
      for (let file of files) {
        const filepath: string = path.join(dir, file)
        const stat = await fs.lstat(filepath)
        if (stat.isFile() && file.substring(file.length - 5) === '.json')
          await this.loadDir(
            filepath,
            `${prefix.length ? prefix + '/' : ''}${file.substring(
              0,
              file.length - 5
            )}`
          )
        else if (stat.isDirectory()) {
          await this.loadDir(
            filepath,
            `${prefix}${prefix.length ? '/' : ''}${file}`
          )
        }
      }
    } catch {}
  }

  generate (method: SwarmMethod): any {
    const schema: any = {}

    if (method.accepts !== null) {
      let accepts = method.accepts
      if (accepts instanceof Array === false) accepts = [accepts]
      accepts = accepts
        .map((name: string) => this.schemas[name])
        .filter((s: any) => s !== undefined)

      switch (accepts.length) {
        case 0:
          break
        case 1:
          schema.body = accepts[0]
          break
        default:
          schema.body = {
            anyOf: accepts
          }
          break
      }
    }

    const params = method.parameters
      .map((param: SwarmParameter) => [
        param.name,
        typeof param.schema === 'string'
          ? this.schemas[param.schema]
          : param.schema
      ])
      .filter(a => a[1] !== undefined)
    if (params.length)
      schema.params = {
        type: 'object',
        properties: Object.fromEntries(params)
      }

    const queries = method.query
      .map((query: SwarmQuery) => [
        query.name,
        typeof query.schema === 'string'
          ? this.schemas[query.schema]
          : query.schema
      ])
      .filter(a => a[1] !== undefined)
    if (queries.length)
      schema.querystring = {
        type: 'object',
        properties: Object.fromEntries(queries)
      }

    const returns = method.returns
      .map((ret: SwarmReturn) => [
        ret.code,
        typeof ret.schema === 'string' ? this.schemas[ret.schema] : ret.schema
      ])
      .filter(a => a[1] !== undefined)
    if (returns.length) schema.response = Object.fromEntries(returns)

    return schema
  }
}
