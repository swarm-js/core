export function prefix (prefix: string): any {
  return (target: any): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    target.prototype.swarm.prefix = prefix
  }
}
