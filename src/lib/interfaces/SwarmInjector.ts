export interface SwarmInjector {
  name: string
  getValue: (req: any) => any
}
