/**
 * Decorator to configure routes prefix to prepend to methods routes. Can only be used on controllers.
 *
 * @param prefix  Route base URL.
 * @param root    If TRUE, ignores sets this prefix relative to root URL, instead of /{version} (ex: /v1).
 * @returns       The decorator function.
 */
export function Prefix (prefix: string, root: boolean = false): any {
  return (target: any): void => {
    if (target.prototype.swarm === undefined) target.prototype.swarm = {}

    target.prototype.swarm.prefix = prefix
    target.prototype.swarm.root = root
  }
}
