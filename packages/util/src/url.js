export function parseUrlOrPath(url) {
  const isPath = url.indexOf('://') === -1
  return isPath ? parsePath(url) : parseUrl(url)
}

export function parseUrl(url) {
  return new URL(url)
}

export function parsePath(path) {
  let origin = global?.location?.origin ?? 'http://localhost'
  if (!path.startsWith('/')) {
    origin = origin + '/'
  }
  return parseUrl(origin + path)
}