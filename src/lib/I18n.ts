import { Swarm } from './Swarm'
import { SwarmI18nNamespace } from './interfaces/SwarmI18nNamespace'

export class I18n {
  swarm: Swarm
  namespaces: { [key: string]: SwarmI18nNamespace } = {}

  constructor (instance: Swarm) {
    this.swarm = instance
  }

  addTranslations (namespace: string, langs: SwarmI18nNamespace) {
    this.namespaces[namespace] = langs
  }

  translate (namespace: string, lang: string, key: string): string {
    return (
      this.namespaces[namespace]?.[lang]?.[key] ??
      this.namespaces[namespace]?.[this.swarm.getOption('defaultLanguage')]?.[
        key
      ] ??
      key
    )
  }
}
