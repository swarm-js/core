export function createFullRoute (
  prefix: string = '/',
  path: string = '/'
): string {
  if (prefix.substring(0, 1) !== '/') prefix = '/' + prefix
  if (prefix.substring(prefix.length - 1) === '/')
    prefix = prefix.substring(0, prefix.length - 1)

  if (path.substring(0, 1) !== '/') path = '/' + path

  let newPath: string = prefix + path
  if (newPath.substring(newPath.length - 1) === '/')
    newPath = newPath.substring(0, newPath.length - 1)

  return newPath
}
