export function prefix (prefix: string, root: boolean = false): any {
  return (target: any): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    target.prototype.swarm.prefix = prefix
    target.prototype.swarm.root = root
  }
}
