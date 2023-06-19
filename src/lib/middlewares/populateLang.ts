import { SwarmOptions } from '../interfaces'

export function populateLang (conf: SwarmOptions) {
  return async function (req: any) {
    const langs = (req.headers['accept-language'] ?? 'en')
      .split(',')
      .map((s: string) => s.split(';')[0].trim())
    for (let lang of langs) {
      if (conf.languages.includes(lang)) {
        req.lang = lang
        break
      }
    }
  }
}
